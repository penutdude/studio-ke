"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddPhotoForm } from "./add-photo-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth/auth-context"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export function AddPhotoButton() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleClick = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to log in to add a photo",
        variant: "destructive",
      })
      router.push("/login")
      return
    }
    setOpen(true)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button onClick={handleClick}>
        <Plus className="h-4 w-4 mr-2" />
        Add Photo
      </Button>
      {open && (
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Photo</DialogTitle>
          </DialogHeader>
          <AddPhotoForm onSuccess={() => setOpen(false)} />
        </DialogContent>
      )}
    </Dialog>
  )
}
