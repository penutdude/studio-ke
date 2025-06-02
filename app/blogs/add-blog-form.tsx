"use client"

import { useState } from "react"
import { createBlog } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth/auth-context"

export function AddBlogForm({ onSuccess }: { onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a blog post",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    // Add the user's email to the form data
    formData.set("author", user.email || "Anonymous")

    try {
      const result = await createBlog(formData)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Blog post created successfully!",
      })

      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required placeholder="Enter a title for your blog post" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea id="content" name="content" rows={6} required placeholder="Write your blog post content here..." />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Create Blog Post"}
      </Button>
    </form>
  )
}
