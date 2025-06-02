"use client"

import type React from "react"

import { useState } from "react"
import { createEvent } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth/auth-context"
import { MapPin, Loader2, AlertCircle } from "lucide-react"

export function AddEventForm({ onSuccess }: { onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [location, setLocation] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services",
        variant: "destructive",
      })
      return
    }

    setIsGettingLocation(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          // Fallback to coordinates if geocoding fails
          setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
        } catch (error) {
          console.error("Error getting address:", error)
          setLocation(`${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`)
        } finally {
          setIsGettingLocation(false)
        }
      },
      (error) => {
        console.error("Error getting location:", error)
        toast({
          title: "Location access denied",
          description: "Please allow location access or enter the location manually",
          variant: "destructive",
        })
        setIsGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setFormError(null)

    if (!user) {
      setFormError("You must be logged in to create an event")
      setIsSubmitting(false)
      return
    }

    try {
      const formData = new FormData(event.currentTarget)

      // Add the user's email to the form data
      formData.set("created_by", user.email || "")

      // Add location if it was set via the location button
      if (location) {
        formData.set("location", location)
      }

      console.log("Submitting form with data:", Object.fromEntries(formData.entries()))

      const result = await createEvent(formData)

      if (result.error) {
        console.error("Event creation failed:", result.error)
        setFormError(result.error)
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Event created successfully!",
      })

      // Reset form
      event.currentTarget.reset()
      setLocation("")
      onSuccess()
    } catch (error) {
      console.error("Unexpected error:", error)
      const errorMessage = "Something went wrong. Please try again."
      setFormError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title" className="text-black font-medium">
          Event Title *
        </Label>
        <Input
          id="title"
          name="title"
          required
          placeholder="Enter event title"
          className="border-gray-300 focus:border-black focus:ring-black"
          maxLength={200}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-black font-medium">
          Description
        </Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Describe the event"
          className="border-gray-300 focus:border-black focus:ring-black"
          maxLength={1000}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="event_date" className="text-black font-medium">
            Date *
          </Label>
          <Input
            id="event_date"
            name="event_date"
            type="date"
            required
            className="border-gray-300 focus:border-black focus:ring-black"
            min={new Date().toISOString().split("T")[0]} // Prevent past dates
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="event_time" className="text-black font-medium">
            Time (optional)
          </Label>
          <Input
            id="event_time"
            name="event_time"
            type="time"
            className="border-gray-300 focus:border-black focus:ring-black"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location" className="text-black font-medium">
          Location
        </Label>
        <div className="flex gap-2">
          <Input
            id="location"
            name="location"
            placeholder="Event location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="border-gray-300 focus:border-black focus:ring-black"
            maxLength={300}
          />
          <Button
            type="button"
            variant="outline"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {isGettingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-gray-500">Click the location icon to use your current location</p>
      </div>

      <Button type="submit" className="w-full bg-black hover:bg-gray-800 text-white" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating Event...
          </>
        ) : (
          "Create Event"
        )}
      </Button>
    </form>
  )
}
