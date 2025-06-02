"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddEventForm } from "./add-event-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth/auth-context"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export function AddEventButton() {
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(true)
  const { user } = useAuth()
  const router = useRouter()
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

  const handleClick = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to log in to create an event",
        variant: "destructive",
      })
      router.push("/login")
      return
    }
    setOpen(true)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div>
        {isMobile ? (
          <Button
            className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black flex items-center gap-2"
            onClick={handleClick}
          >
            <Plus className="h-4 w-4" />
            <span>Add New Event</span>
          </Button>
        ) : (
          <button
            className="px-6 py-3 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black font-medium rounded-full transition-colors shadow-sm"
            onClick={handleClick}
          >
            Create New Event
          </button>
        )}
      </div>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl text-black dark:text-white font-heading">Add New Event</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <AddEventForm onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
