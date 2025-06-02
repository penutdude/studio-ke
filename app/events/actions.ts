"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getEvents() {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.from("events").select("*").order("event_date", { ascending: true })

    if (error) {
      console.error("Error fetching events:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Unexpected error fetching events:", error)
    return []
  }
}

export async function getEventComments(eventId: string) {
  try {
    const supabase = createServerSupabaseClient()

    if (!eventId) {
      console.error("Event ID is required")
      return []
    }

    const { data, error } = await supabase
      .from("event_comments")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching event comments:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Unexpected error fetching event comments:", error)
    return []
  }
}

export async function createEvent(formData: FormData) {
  try {
    console.log("Creating event with form data:", Object.fromEntries(formData.entries()))

    const supabase = createServerSupabaseClient()

    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const eventDate = formData.get("event_date") as string
    const eventTime = formData.get("event_time") as string
    const location = formData.get("location") as string
    const createdBy = formData.get("created_by") as string

    console.log("Extracted values:", { title, description, eventDate, eventTime, location, createdBy })

    // Validate required fields
    if (!title?.trim()) {
      console.error("Title is missing or empty")
      return { error: "Title is required" }
    }

    if (!eventDate) {
      console.error("Event date is missing")
      return { error: "Event date is required" }
    }

    if (!createdBy?.trim()) {
      console.error("Created by is missing or empty")
      return { error: "Creator information is required" }
    }

    // Validate date format
    const dateObj = new Date(eventDate)
    if (isNaN(dateObj.getTime())) {
      console.error("Invalid date format:", eventDate)
      return { error: "Invalid date format" }
    }

    // Validate field lengths
    if (title.length > 200) {
      return { error: "Title must be less than 200 characters" }
    }

    if (description && description.length > 1000) {
      return { error: "Description must be less than 1,000 characters" }
    }

    if (location && location.length > 300) {
      return { error: "Location must be less than 300 characters" }
    }

    // Prepare the insert data
    const insertData = {
      title: title.trim(),
      description: description?.trim() || null,
      event_date: eventDate,
      event_time: eventTime?.trim() || null,
      location: location?.trim() || null,
      created_by: createdBy.trim(),
    }

    console.log("Insert data:", insertData)

    // Test database connection first
    const { data: testData, error: testError } = await supabase.from("events").select("count").limit(1)

    if (testError) {
      console.error("Database connection test failed:", testError)
      return { error: "Database connection failed. Please try again." }
    }

    console.log("Database connection test successful")

    // Insert the event
    const { data, error } = await supabase.from("events").insert(insertData).select().single()

    if (error) {
      console.error("Error creating event:", error)
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })

      // Provide more specific error messages based on the error
      if (error.code === "23505") {
        return { error: "An event with this information already exists" }
      } else if (error.code === "23502") {
        return { error: "Missing required information" }
      } else if (error.code === "42P01") {
        return { error: "Events table not found. Please contact support." }
      } else {
        return { error: `Failed to create event: ${error.message}` }
      }
    }

    console.log("Event created successfully:", data)

    revalidatePath("/events")
    return { success: true, data }
  } catch (error) {
    console.error("Unexpected error creating event:", error)
    return {
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function deleteEvent(id: string, createdBy: string, currentUserEmail: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Validate inputs
    if (!id || !createdBy || !currentUserEmail) {
      return {
        error: "Missing required information",
      }
    }

    // Check if the current user is the creator
    if (createdBy !== currentUserEmail) {
      return {
        error: "You don't have permission to delete this event",
      }
    }

    // Verify the event exists and belongs to the user
    const { data: event, error: fetchError } = await supabase
      .from("events")
      .select("id, created_by")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("Error fetching event for deletion:", fetchError)
      return {
        error: "Event not found",
      }
    }

    if (event.created_by !== currentUserEmail) {
      return {
        error: "You don't have permission to delete this event",
      }
    }

    // Delete all comments for this event first (cascade should handle this, but being explicit)
    const { error: commentsError } = await supabase.from("event_comments").delete().eq("event_id", id)

    if (commentsError) {
      console.error("Error deleting event comments:", commentsError)
      // Continue with event deletion even if comments deletion fails
    }

    const { error: deleteError } = await supabase.from("events").delete().eq("id", id)

    if (deleteError) {
      console.error("Error deleting event:", deleteError)
      return {
        error: "Failed to delete event. Please try again.",
      }
    }

    revalidatePath("/events")
    return { success: true }
  } catch (error) {
    console.error("Unexpected error deleting event:", error)
    return {
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function createEventComment(formData: FormData) {
  try {
    const supabase = createServerSupabaseClient()

    const eventId = formData.get("event_id") as string
    const content = formData.get("content") as string
    const username = formData.get("username") as string
    const imageFile = formData.get("image") as File

    // Validate required fields
    if (!eventId || !username?.trim()) {
      return {
        error: "Event ID and username are required",
      }
    }

    if (!content?.trim() && (!imageFile || imageFile.size === 0)) {
      return {
        error: "Either content or image is required",
      }
    }

    // Validate content length
    if (content && content.length > 1000) {
      return {
        error: "Comment must be less than 1,000 characters",
      }
    }

    let imagePath = null

    // Handle image upload if provided
    if (imageFile && imageFile.size > 0) {
      // Validate image file
      if (!imageFile.type.startsWith("image/")) {
        return {
          error: "File must be an image",
        }
      }

      if (imageFile.size > 5 * 1024 * 1024) {
        return {
          error: "Image must be less than 5MB",
        }
      }

      try {
        // Convert image to base64 for direct storage
        const fileBuffer = await imageFile.arrayBuffer()
        const base64 = Buffer.from(fileBuffer).toString("base64")
        imagePath = `data:${imageFile.type};base64,${base64}`
      } catch (error) {
        console.error("Error processing image:", error)
        return {
          error: "Failed to process image",
        }
      }
    }

    const { data, error } = await supabase
      .from("event_comments")
      .insert({
        event_id: eventId,
        content: content?.trim() || null,
        image_path: imagePath,
        username: username.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating event comment:", error)
      return {
        error: "Failed to create comment. Please try again.",
      }
    }

    revalidatePath("/events")
    return { success: true, data }
  } catch (error) {
    console.error("Unexpected error creating event comment:", error)
    return {
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function deleteEventComment(id: string, username: string, currentUserEmail: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Validate inputs
    if (!id || !username || !currentUserEmail) {
      return {
        error: "Missing required information",
      }
    }

    // Check if the current user is the creator
    if (username !== currentUserEmail) {
      return {
        error: "You don't have permission to delete this comment",
      }
    }

    // Verify the comment exists and belongs to the user
    const { data: comment, error: fetchError } = await supabase
      .from("event_comments")
      .select("id, username")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("Error fetching comment for deletion:", fetchError)
      return {
        error: "Comment not found",
      }
    }

    if (comment.username !== currentUserEmail) {
      return {
        error: "You don't have permission to delete this comment",
      }
    }

    const { error: deleteError } = await supabase.from("event_comments").delete().eq("id", id)

    if (deleteError) {
      console.error("Error deleting event comment:", deleteError)
      return {
        error: "Failed to delete comment. Please try again.",
      }
    }

    revalidatePath("/events")
    return { success: true }
  } catch (error) {
    console.error("Unexpected error deleting event comment:", error)
    return {
      error: "An unexpected error occurred. Please try again.",
    }
  }
}
