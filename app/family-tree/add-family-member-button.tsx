"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddFamilyMemberForm } from "./add-family-member-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth/auth-context"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export function AddFamilyMemberButton() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleClick = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to log in to add a family member",
        variant: "destructive",
      })
      router.push("/login")
      return
    }
    setOpen(true)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={handleClick}>
        <Plus className="h-4 w-4 mr-2" />
        Add Family Member
      </Button>
      {open && (
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Family Member</DialogTitle>
          </DialogHeader>
          <AddFamilyMemberForm onSuccess={() => setOpen(false)} />
        </DialogContent>
      )}
    </Dialog>
  )
}
