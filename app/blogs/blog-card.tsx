"use client"

import { useState } from "react"
import type { Database } from "@/lib/types/database.types"
import { Calendar, User, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth/auth-context"
import { useToast } from "@/hooks/use-toast"
import { deleteBlog } from "./actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Blog =
  | Database["public"]["Tables"]["blogs"]["Row"]
  | {
      id: string
      title: string
      content: string
      author: string
      created_at: string
      updated_at: string
    }

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function BlogCard({ blog }: { blog: Blog }) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isFullViewOpen, setIsFullViewOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const isAuthor = user?.email === blog.author

  const handleDelete = async () => {
    if (!user) return

    setIsDeleting(true)
    try {
      const result = await deleteBlog(blog.id, blog.author, user.email || "")

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
        description: "Blog post deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete blog post",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <>
      <article className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="font-heading text-xl font-semibold text-foreground mb-2">{blog.title}</h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {blog.author}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(blog.created_at)}
              </div>
            </div>
          </div>

          {isAuthor && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          )}
        </div>

        <div className="prose prose-sm max-w-none">
          <p className="text-muted-foreground line-clamp-3">{blog.content}</p>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <button
            onClick={() => setIsFullViewOpen(true)}
            className="text-sm font-medium text-primary hover:underline font-heading"
          >
            Read more
          </button>
        </div>
      </article>

      {/* Full Blog View Modal */}
      <Dialog open={isFullViewOpen} onOpenChange={setIsFullViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <div className="sticky top-0 bg-background border-b border-border p-6">
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl font-bold text-left">{blog.title}</DialogTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span className="font-heading">{blog.author}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span className="font-heading">{formatDate(blog.created_at)}</span>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-6">
            <div className="prose prose-lg max-w-none">
              <div className="text-foreground whitespace-pre-wrap leading-relaxed">{blog.content}</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your blog post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
