"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import type { Database } from "@/lib/types/database.types"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ArrowRight, ZoomIn, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth/auth-context"
import { useToast } from "@/hooks/use-toast"
import { deleteGalleryItem } from "./actions"
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

type GalleryItem = Database["public"]["Tables"]["gallery"]["Row"]

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)
  const [itemToDelete, setItemToDelete] = useState<GalleryItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isMobile, setIsMobile] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Initial check
    checkIfMobile()

    // Add event listener
    window.addEventListener("resize", checkIfMobile)

    // Clean up
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  const handleDelete = async () => {
    if (!user || !itemToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteGalleryItem(itemToDelete.id, itemToDelete.uploaded_by, user.email || "")

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
        description: "Gallery item deleted successfully",
      })

      // If the deleted item is currently selected, close the dialog
      if (selectedItem && selectedItem.id === itemToDelete.id) {
        setSelectedItem(null)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete gallery item",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setItemToDelete(null)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent, item: GalleryItem) => {
    e.stopPropagation()
    setItemToDelete(item)
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No photos have been added yet.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {items.map((item) => {
          const isUploader = user?.email === item.uploaded_by

          return (
            <div
              key={item.id}
              className="minimal-card cursor-pointer relative group overflow-hidden"
              onClick={() => setSelectedItem(item)}
            >
              {isUploader && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-20 text-muted-foreground hover:text-destructive bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleDeleteClick(e, item)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              )}

              {/* Zoom icon overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 z-10">
                <div className="bg-background/80 backdrop-blur-sm rounded-full p-2 transform scale-75 group-hover:scale-100 transition-all duration-300">
                  <ZoomIn className="h-5 w-5 text-foreground" />
                </div>
              </div>

              <div className="aspect-square relative">
                <Image
                  src={item.image_url || "/placeholder.svg"}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  unoptimized={item.image_url?.startsWith("data:")}
                />
              </div>
              <div className="p-4 relative">
                <h3 className="font-medium mb-2">{item.title}</h3>
                {!isMobile && item.description && (
                  <p className="text-muted-foreground text-sm mb-2">{item.description}</p>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">By {item.uploaded_by}</span>
                  <span className="text-primary text-sm flex items-center gap-1 font-medium">
                    View <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        {selectedItem && (
          <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden mt-6">
            <div className="relative h-[80vh]">
              <Image
                src={selectedItem.image_url || "/placeholder.svg"}
                alt={selectedItem.title}
                fill
                className="object-contain"
                unoptimized={selectedItem.image_url?.startsWith("data:")}
              />
            </div>
            <div className="bg-background p-4 border-t">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{selectedItem.title}</h3>
                  {selectedItem.description && <p className="text-muted-foreground mt-1">{selectedItem.description}</p>}
                  <p className="text-sm text-muted-foreground mt-2">
                    Uploaded by {selectedItem.uploaded_by} on {formatDate(selectedItem.created_at)}
                  </p>
                </div>

                {user?.email === selectedItem.uploaded_by && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setItemToDelete(selectedItem)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this photo.
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
