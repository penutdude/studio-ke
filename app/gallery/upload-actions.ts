"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Use a simpler approach with base64 encoding to avoid storage RLS issues
export async function uploadImage(formData: FormData) {
  try {
    const file = formData.get("file") as File

    if (!file) {
      return { error: "No file provided" }
    }

    // Check file type
    const fileType = file.type
    if (!fileType.startsWith("image/")) {
      return { error: "File must be an image" }
    }

    // Check file size (limit to 2MB for data URLs)
    if (file.size > 2 * 1024 * 1024) {
      return { error: "File size must be less than 2MB" }
    }

    // Convert the file to a data URL
    const fileBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(fileBuffer).toString("base64")
    const dataUrl = `data:${file.type};base64,${base64}`

    console.log("Image converted to data URL successfully")
    return { success: true, url: dataUrl }
  } catch (error) {
    console.error("Error in uploadImage:", error)
    return { error: "An unexpected error occurred during upload" }
  }
}

export async function createGalleryItemWithUpload(formData: FormData) {
  try {
    const supabase = createServerSupabaseClient()

    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const uploadedBy = formData.get("uploaded_by") as string
    const file = formData.get("file") as File

    // Validate required fields
    if (!title?.trim() || !file || !uploadedBy?.trim()) {
      return {
        error: "Title, image, and uploader are required",
      }
    }

    // Validate field lengths
    if (title.length > 200) {
      return {
        error: "Title must be less than 200 characters",
      }
    }

    if (description && description.length > 1000) {
      return {
        error: "Description must be less than 1,000 characters",
      }
    }

    // First upload the image
    const uploadResult = await uploadImage(formData)

    if (uploadResult.error) {
      return { error: uploadResult.error }
    }

    // Then create the gallery item with the image URL
    const { data, error } = await supabase
      .from("gallery")
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        image_url: uploadResult.url!,
        uploaded_by: uploadedBy.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating gallery item:", error)
      return {
        error: "Failed to create gallery item. Please try again.",
      }
    }

    revalidatePath("/gallery")
    return { success: true, data }
  } catch (error) {
    console.error("Error in createGalleryItemWithUpload:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function deleteGalleryItem(id: string, uploadedBy: string, currentUserEmail: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Validate inputs
    if (!id || !uploadedBy || !currentUserEmail) {
      return {
        error: "Missing required information",
      }
    }

    // Check if the current user is the uploader
    if (uploadedBy !== currentUserEmail) {
      return {
        error: "You don't have permission to delete this gallery item",
      }
    }

    // Verify the item exists and belongs to the user
    const { data: item, error: fetchError } = await supabase
      .from("gallery")
      .select("id, uploaded_by")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("Error fetching gallery item for deletion:", fetchError)
      return {
        error: "Gallery item not found",
      }
    }

    if (item.uploaded_by !== currentUserEmail) {
      return {
        error: "You don't have permission to delete this gallery item",
      }
    }

    // Delete the item from the database
    const { error: deleteError } = await supabase.from("gallery").delete().eq("id", id)

    if (deleteError) {
      console.error("Error deleting gallery item:", deleteError)
      return {
        error: "Failed to delete gallery item. Please try again.",
      }
    }

    revalidatePath("/gallery")
    return { success: true }
  } catch (error) {
    console.error("Unexpected error deleting gallery item:", error)
    return {
      error: "An unexpected error occurred. Please try again.",
    }
  }
}
