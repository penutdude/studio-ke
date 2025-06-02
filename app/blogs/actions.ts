"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getBlogs() {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.from("blogs").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching blogs:", error)
      // Try fallback to blog_posts table
      const { data: blogPosts, error: blogPostsError } = await supabase
        .from("blog_posts")
        .select("*")
        .order("published_at", { ascending: false })

      if (blogPostsError) {
        console.error("Error fetching blog posts:", blogPostsError)
        return []
      }

      // Transform blog_posts data to match the expected format
      return blogPosts.map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        author: post.username || "Anonymous",
        created_at: post.published_at || new Date().toISOString(),
        updated_at: post.updated_at || new Date().toISOString(),
      }))
    }

    return data || []
  } catch (error) {
    console.error("Unexpected error fetching blogs:", error)
    return []
  }
}

export async function createBlog(formData: FormData) {
  try {
    const supabase = createServerSupabaseClient()

    const title = formData.get("title") as string
    const content = formData.get("content") as string
    const author = formData.get("author") as string

    // Validate required fields
    if (!title?.trim() || !content?.trim() || !author?.trim()) {
      return {
        error: "Title, content, and author are required",
      }
    }

    // Validate field lengths
    if (title.length > 200) {
      return {
        error: "Title must be less than 200 characters",
      }
    }

    if (content.length > 10000) {
      return {
        error: "Content must be less than 10,000 characters",
      }
    }

    const { data, error } = await supabase
      .from("blogs")
      .insert({
        title: title.trim(),
        content: content.trim(),
        author: author.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating blog:", error)
      return {
        error: "Failed to create blog post. Please try again.",
      }
    }

    revalidatePath("/blogs")
    return { success: true, data }
  } catch (error) {
    console.error("Unexpected error creating blog:", error)
    return {
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function deleteBlog(id: string, author: string, currentUserEmail: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Validate inputs
    if (!id || !author || !currentUserEmail) {
      return {
        error: "Missing required information",
      }
    }

    // Check if the current user is the author
    if (author !== currentUserEmail) {
      return {
        error: "You don't have permission to delete this post",
      }
    }

    // Verify the blog exists and belongs to the user
    const { data: blog, error: fetchError } = await supabase.from("blogs").select("id, author").eq("id", id).single()

    if (fetchError) {
      console.error("Error fetching blog for deletion:", fetchError)
      return {
        error: "Blog post not found",
      }
    }

    if (blog.author !== currentUserEmail) {
      return {
        error: "You don't have permission to delete this post",
      }
    }

    const { error: deleteError } = await supabase.from("blogs").delete().eq("id", id)

    if (deleteError) {
      console.error("Error deleting blog:", deleteError)
      return {
        error: "Failed to delete blog post. Please try again.",
      }
    }

    revalidatePath("/blogs")
    return { success: true }
  } catch (error) {
    console.error("Unexpected error deleting blog:", error)
    return {
      error: "An unexpected error occurred. Please try again.",
    }
  }
}
