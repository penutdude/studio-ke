"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth/auth-context"
import { createEventComment, getEventComments, deleteEventComment } from "./actions"
import type { Database } from "@/lib/types/database.types"
import { Calendar, MapPin, Clock, Send, ImageIcon, Trash2, User, ExternalLink, X } from "lucide-react"
import Image from "next/image"
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

type Event = Database["public"]["Tables"]["events"]["Row"]
type EventComment = Database["public"]["Tables"]["event_comments"]["Row"]

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function EventDetailsModal({
  event,
  isOpen,
  onClose,
}: {
  event: Event | null
  isOpen: boolean
  onClose: () => void
}) {
  const [comments, setComments] = useState<EventComment[]>([])
  const [newComment, setNewComment] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<EventComment | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null)

  useEffect(() => {
    if (event && isOpen) {
      loadComments()
    }
  }, [event, isOpen])

  const loadComments = async () => {
    if (!event) return

    setIsLoading(true)
    try {
      const eventComments = await getEventComments(event.id)
      setComments(eventComments)
    } catch (error) {
      console.error("Error loading comments:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const openInGoogleMaps = () => {
    if (!event?.location) return

    // Encode the location for URL
    const encodedLocation = encodeURIComponent(event.location)

    // Create Google Maps URL with the location
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`

    // Open in new tab
    window.open(googleMapsUrl, "_blank")
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        })
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        })
        return
      }

      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const clearImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !event) {
      toast({
        title: "Error",
        description: "You must be logged in to comment",
        variant: "destructive",
      })
      return
    }

    if (!newComment.trim() && !selectedImage) {
      toast({
        title: "Error",
        description: "Please enter a comment or select an image",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.set("event_id", event.id)
      formData.set("content", newComment.trim())
      formData.set("username", user.email || "Anonymous")

      if (selectedImage) {
        formData.set("image", selectedImage)
      }

      const result = await createEventComment(formData)

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
        description: "Comment added successfully!",
      })

      setNewComment("")
      clearImage()
      await loadComments()
      setShowCommentForm(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async () => {
    if (!user || !commentToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteEventComment(commentToDelete.id, commentToDelete.username || "", user.email || "")

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
        description: "Comment deleted successfully",
      })

      await loadComments()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setCommentToDelete(null)
    }
  }

  if (!event) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden bg-background border-border">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="text-xl font-semibold text-foreground font-heading">{event.title}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col h-full max-h-[70vh]">
            {/* Event Details */}
            <div className="p-4 border-b border-border">
              {event.description && <p className="text-muted-foreground mb-4">{event.description}</p>}

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-heading">{formatDate(event.event_date)}</span>
                </div>

                {event.event_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-heading">{event.event_time}</span>
                  </div>
                )}

                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="flex-1 font-heading">{event.location}</span>
                    <button
                      onClick={openInGoogleMaps}
                      className="ml-2 text-primary hover:text-primary/80 transition-colors flex items-center gap-1 text-xs underline font-heading"
                      title="Open in Google Maps"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Navigate
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-3 text-xs text-muted-foreground">
                <span className="font-heading">Created by {event.created_by}</span>
              </div>
            </div>

            {/* Comments Section */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="font-medium text-foreground mb-4 font-heading">Comments ({comments.length})</h3>

              {isLoading ? (
                <div className="text-center text-muted-foreground font-heading">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 font-heading">
                  No comments yet. Be the first to comment!
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-muted border border-border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-muted-foreground/20 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-muted-foreground" />
                          </div>
                          <span className="font-medium text-foreground text-sm font-heading">{comment.username}</span>
                          <span className="text-xs text-muted-foreground font-heading">
                            {formatDateTime(comment.created_at)}
                          </span>
                        </div>

                        {user?.email === comment.username && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => setCommentToDelete(comment)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>

                      {comment.content && <p className="text-foreground text-sm mb-2">{comment.content}</p>}

                      {comment.image_path && (
                        <div className="mt-2">
                          <Image
                            src={comment.image_path || "/placeholder.svg"}
                            alt="Comment image"
                            width={200}
                            height={150}
                            className="rounded-lg object-cover border border-border cursor-pointer hover:opacity-90 transition-opacity"
                            unoptimized={comment.image_path.startsWith("data:")}
                            onClick={() => setFullScreenImage(comment.image_path)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Comment Button and Form */}
            {user && (
              <div className="border-t border-border p-4">
                {!showCommentForm ? (
                  <Button
                    onClick={() => setShowCommentForm(true)}
                    className="w-full bg-foreground hover:bg-foreground/90 text-background font-heading"
                  >
                    Add Comment
                  </Button>
                ) : (
                  <div className="space-y-3 h-[280px] flex flex-col">
                    <div className="flex justify-between items-center">
                      <Label className="text-foreground font-medium font-heading">Add a comment</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowCommentForm(false)
                          setNewComment("")
                          clearImage()
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </Button>
                    </div>

                    <form onSubmit={handleSubmitComment} className="flex flex-col h-full">
                      <div className="flex-1 overflow-y-auto space-y-3 max-h-[200px]">
                        <Textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Share your thoughts about this event..."
                          rows={3}
                          className="border-border focus:border-foreground focus:ring-foreground resize-none"
                        />

                        {imagePreview && (
                          <div className="relative inline-block max-w-full">
                            <Image
                              src={imagePreview || "/placeholder.svg"}
                              alt="Preview"
                              width={150}
                              height={100}
                              className="rounded-lg object-cover border border-border cursor-pointer max-w-full h-auto"
                              onClick={() => setFullScreenImage(imagePreview)}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full"
                              onClick={clearImage}
                            >
                              ×
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center gap-2 pt-3 border-t border-border mt-3">
                        <div>
                          <input
                            type="file"
                            id="image-upload"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById("image-upload")?.click()}
                            className="border-border text-muted-foreground hover:bg-muted font-heading"
                          >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Add Photo
                          </Button>
                        </div>

                        <Button
                          type="submit"
                          disabled={isSubmitting || (!newComment.trim() && !selectedImage)}
                          className="bg-foreground hover:bg-foreground/90 text-background font-heading"
                        >
                          {isSubmitting ? (
                            "Posting..."
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Post Comment
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Screen Image Modal */}
      <Dialog open={!!fullScreenImage} onOpenChange={(open) => !open && setFullScreenImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
          <div className="relative w-full h-full min-h-[50vh] flex items-center justify-center bg-black/90">
            {fullScreenImage && (
              <Image
                src={fullScreenImage || "/placeholder.svg"}
                alt="Full size image"
                width={1200}
                height={800}
                className="w-full h-full object-contain"
                unoptimized={fullScreenImage.startsWith("data:")}
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-background border border-border text-foreground hover:bg-muted z-10 rounded-full"
              onClick={() => setFullScreenImage(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Comment Confirmation */}
      <AlertDialog open={!!commentToDelete} onOpenChange={(open) => !open && setCommentToDelete(null)}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground font-heading">Delete Comment</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="border-border text-muted-foreground hover:bg-muted font-heading"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteComment}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-heading"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
