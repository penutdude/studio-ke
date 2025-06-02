"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddBlogForm } from "./add-blog-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth/auth-context"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export function AddBlogButton() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleClick = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to log in to create a story",
        variant: "destructive",
      })
      router.push("/login")
      return
    }
    setOpen(true)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={handleClick}>
          <Plus className="h-4 w-4 mr-2" />
          New Story
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Your Story</DialogTitle>
        </DialogHeader>
        <AddBlogForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
