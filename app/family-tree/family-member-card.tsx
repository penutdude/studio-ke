"use client"

import type React from "react"

import { useState } from "react"
import type { Database } from "@/lib/types/database.types"
import { cn } from "@/lib/utils"
import { Trash2, ChevronRight, Instagram, Twitter, Facebook, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth/auth-context"
import { useToast } from "@/hooks/use-toast"
import { deleteFamilyMember } from "./actions"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type FamilyMember = Database["public"]["Tables"]["family_members"]["Row"]

export function FamilyMemberCard({
  member,
  onClick,
}: {
  member: FamilyMember
  onClick: () => void
}) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const isCreator = user?.email === member.added_by

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) return

    setIsDeleting(true)
    try {
      const result = await deleteFamilyMember(member.id, member.added_by || "", user.email || "")

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
        description: "Family member deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete family member",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDeleteDialogOpen(true)
  }

  return (
    <>
      <div
        className={cn(
          "relative cursor-pointer transition-all duration-300 group elegant-card p-4",
          "animate-scale-in hover:scale-[1.02]",
        )}
        onClick={onClick}
      >
        {isCreator && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity",
              "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            )}
            onClick={handleDeleteClick}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        )}

        <div className="flex items-start gap-3">
          <Avatar className="w-12 h-12 border-2 border-gray-200 dark:border-gray-700">
            <AvatarImage src={member.avatar_url || undefined} alt={member.name} />
            <AvatarFallback className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              {member.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold mb-1 text-foreground">{member.name}</h4>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {member.relationship && (
              <div className="mb-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                  {member.relationship}
                </span>
              </div>
            )}

            {member.birth_date && (
              <p className="text-xs text-muted-foreground mb-2">
                Born: {new Date(member.birth_date).toLocaleDateString()}
              </p>
            )}

            {(member.instagram_username || member.twitter_username || member.facebook_username) && (
              <div className="flex gap-2 mb-2">
                {member.instagram_username && (
                  <div
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-pink-100 dark:bg-pink-900/30"
                    title="Instagram"
                  >
                    <Instagram className="w-3 h-3 text-pink-600 dark:text-pink-400" />
                    <span className="text-xs text-pink-700 dark:text-pink-300">IG</span>
                  </div>
                )}
                {member.twitter_username && (
                  <div
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800"
                    title="X (Twitter)"
                  >
                    <Twitter className="w-3 h-3 text-gray-700 dark:text-gray-300" />
                    <span className="text-xs text-gray-700 dark:text-gray-300">X</span>
                  </div>
                )}
                {member.facebook_username && (
                  <div
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30"
                    title="Facebook"
                  >
                    <Facebook className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs text-blue-700 dark:text-blue-300">FB</span>
                  </div>
                )}
              </div>
            )}

            {member.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{member.location}</span>
              </div>
            )}

            {member.bio && (
              <div className="text-xs text-muted-foreground line-clamp-2 italic mb-2">
                "{member.bio.substring(0, 60)}..."
              </div>
            )}

            <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              Click to view options
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="elegant-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="page-title text-foreground">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. This will permanently delete this family member.
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
