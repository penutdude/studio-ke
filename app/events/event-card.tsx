"use client"

import { useState } from "react"
import { Calendar, MapPin, Clock, ChevronRight, Trash2, MessageCircle } from "lucide-react"
import type { Database } from "@/lib/types/database.types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth/auth-context"
import { useToast } from "@/hooks/use-toast"
import { deleteEvent } from "./actions"
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

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function EventCard({
  event,
  onViewDetails,
}: {
  event: Event
  onViewDetails: (event: Event) => void
}) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const isCreator = user?.email === event.created_by
  const isUpcoming = new Date(event.event_date) > new Date()

  const handleDelete = async () => {
    if (!user) return

    setIsDeleting(true)
    try {
      const result = await deleteEvent(event.id, event.created_by, user.email || "")

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
        description: "Event deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <>
      <div className="elegant-card p-6 hover:shadow-md transition-all duration-200 group relative">
        {isCreator && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        )}

        {isUpcoming && (
          <div className="absolute top-0 left-4 transform -translate-y-1/2 bg-foreground text-background px-3 py-1 rounded-full text-xs font-medium font-heading">
            Upcoming
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4">
          {/* Date display */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-muted border border-border rounded-lg shadow-sm flex flex-col items-center justify-center">
              <div className="text-xs text-muted-foreground uppercase font-medium font-heading">
                {new Date(event.event_date).toLocaleDateString("en-US", { month: "short" })}
              </div>
              <div className="text-2xl md:text-3xl font-bold text-foreground font-heading">
                {new Date(event.event_date).getDate()}
              </div>
              <div className="text-xs text-muted-foreground font-heading">
                {new Date(event.event_date).getFullYear()}
              </div>
            </div>
          </div>

          <div className="flex-1">
            {/* Title */}
            <h3 className="text-xl font-semibold mb-2 text-foreground font-heading">{event.title}</h3>

            {/* Category/Tag */}
            <div className="mb-3">
              <span className="inline-block bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-medium font-heading">
                Event
              </span>
            </div>

            {event.description && <p className="text-muted-foreground mb-4 text-sm">{event.description}</p>}

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-muted-foreground mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span className="font-heading">{formatDate(event.event_date)}</span>
              </div>

              {event.event_time && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span className="font-heading">{event.event_time}</span>
                </div>
              )}

              {event.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate max-w-[200px] font-heading">{event.location}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <div className="text-xs text-muted-foreground">
                <span className="font-heading">Added by {event.created_by}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onViewDetails(event)}
                  className={cn(
                    "flex items-center gap-1 text-foreground border border-border px-3 py-1 rounded-full text-sm font-heading",
                    "hover:bg-muted transition-all duration-300",
                  )}
                >
                  <MessageCircle className="h-3 w-3" />
                  View Details
                  <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground font-heading">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. This will permanently delete this event and all its comments.
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
              onClick={handleDelete}
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
