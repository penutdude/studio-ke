"use client"

import type React from "react"

import { useState } from "react"
import { createFamilyMember } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth/auth-context"
import { MapPin, Loader2 } from "lucide-react"

export function AddFamilyMemberForm({ onSuccess }: { onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [gender, setGender] = useState("not_specified")
  const { toast } = useToast()
  const { user } = useAuth()
  const [location, setLocation] = useState("")
  const [isGettingLocation, setIsGettingLocation] = useState(false)

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

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add a family member",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    const formData = new FormData(event.currentTarget)
    formData.set("added_by", user.email || "Anonymous")
    formData.set("gender", gender)
    formData.set("location", location)

    try {
      const result = await createFamilyMember(formData)

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
        description: "Family member added successfully! You can now edit them to add relationships.",
      })

      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" name="name" required placeholder="Enter full name" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gender">Gender</Label>
        <Select value={gender} onValueChange={setGender}>
          <SelectTrigger>
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                Male
              </div>
            </SelectItem>
            <SelectItem value="female">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                Female
              </div>
            </SelectItem>
            <SelectItem value="non_binary">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                Non-Binary
              </div>
            </SelectItem>
            <SelectItem value="not_specified">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                Not Specified
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="birth_date">Birth Date (optional)</Label>
        <Input id="birth_date" name="birth_date" type="date" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio (optional)</Label>
        <Textarea id="bio" name="bio" rows={3} placeholder="Enter biographical information" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location (optional)</Label>
        <div className="flex gap-2">
          <Input
            id="location"
            name="location"
            placeholder="Enter location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={300}
          />
          <Button type="button" variant="outline" onClick={getCurrentLocation} disabled={isGettingLocation}>
            {isGettingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Click the location icon to use your current location</p>
      </div>

      <div className="bg-muted/50 p-3 rounded-lg">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Tip:</strong> After adding a family member, you can edit them to establish relationships with other
          family members and upload a profile picture.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Adding..." : "Add Family Member"}
      </Button>
    </form>
  )
}
