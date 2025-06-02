"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getGalleryItems() {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.from("gallery").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching gallery items:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Unexpected error fetching gallery items:", error)
    return []
  }
}

export async function createGalleryItem(formData: FormData) {
  try {
    const supabase = createServerSupabaseClient()

    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const imageUrl = formData.get("image_url") as string
    const uploadedBy = formData.get("uploaded_by") as string

    // Validate required fields
    if (!title?.trim() || !imageUrl?.trim() || !uploadedBy?.trim()) {
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

    const { data, error } = await supabase
      .from("gallery")
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        image_url: imageUrl.trim(),
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
    console.error("Unexpected error creating gallery item:", error)
    return {
      error: "An unexpected error occurred. Please try again.",
    }
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
      .select("id, uploaded_by, image_url")
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

    const { error: deleteError } = await supabase.from("gallery").delete().eq("id", id)

    if (deleteError) {
      console.error("Error deleting gallery item:", deleteError)
      return {
        error: "Failed to delete gallery item. Please try again.",
      }
    }

    // Note: We're not deleting from storage since we're using data URLs
    // If we were using actual file storage, we would delete the file here

    revalidatePath("/gallery")
    return { success: true }
  } catch (error) {
    console.error("Unexpected error deleting gallery item:", error)
    return {
      error: "An unexpected error occurred. Please try again.",
    }
  }
}
