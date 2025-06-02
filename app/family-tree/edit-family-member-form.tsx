"use client"

import type React from "react"

import { useState } from "react"
import { updateFamilyMember } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/lib/types/database.types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth/auth-context"
import { Users, Heart, Info, MapPin, Loader2 } from "lucide-react"

type FamilyMember = Database["public"]["Tables"]["family_members"]["Row"]

export function EditFamilyMemberForm({
  member,
  existingMembers,
  onSuccess,
}: {
  member: FamilyMember
  existingMembers: FamilyMember[]
  onSuccess: () => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [relationship, setRelationship] = useState(member.relationship || "")
  const [parentId, setParentId] = useState(member.parent_id || "none")
  const [parent2Id, setParent2Id] = useState(member.parent2_id || "none")
  const [spouseId, setSpouseId] = useState(member.spouse_id || "none")
  const [gender, setGender] = useState(member.gender || "not_specified")
  const { toast } = useToast()
  const { user } = useAuth()
  const [location, setLocation] = useState(member.location || "")
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  // Filter out the current member from potential relationships
  const otherMembers = existingMembers.filter((m) => m.id !== member.id)

  // Filter out already selected parents from the other parent dropdown
  const availableParent2Options = otherMembers.filter((m) => m.id !== parentId)
  const availableParent1Options = otherMembers.filter((m) => m.id !== parent2Id)

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
        description: "You must be logged in to edit a family member",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    const formData = new FormData(event.currentTarget)
    formData.set("id", member.id)
    formData.set("relationship", relationship)
    formData.set("parent_id", parentId === "none" ? "" : parentId)
    formData.set("parent2_id", parent2Id === "none" ? "" : parent2Id)
    formData.set("spouse_id", spouseId === "none" ? "" : spouseId)
    formData.set("gender", gender)
    formData.set("current_user_email", user.email || "")
    formData.set("location", location)

    try {
      const result = await updateFamilyMember(formData)

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
        description: "Family member updated successfully! The family tree will now show the new relationships.",
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

  const relationshipOptions = [
    "Grandparent",
    "Parent",
    "Child",
    "Sibling",
    "Cousin",
    "Aunt/Uncle",
    "Niece/Nephew",
    "Spouse",
    "Other",
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" name="name" required placeholder="Enter full name" defaultValue={member.name} />
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
        <Input
          id="birth_date"
          name="birth_date"
          type="date"
          defaultValue={member.birth_date ? member.birth_date.split("T")[0] : ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="relationship">Relationship Type</Label>
        <Select value={relationship} onValueChange={setRelationship}>
          <SelectTrigger>
            <SelectValue placeholder="Select relationship type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {relationshipOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {otherMembers.length > 0 && (
        <>
          <div className="border border-amber-200 rounded-lg p-4 bg-amber-50/50">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-amber-700" />
              <h3 className="font-medium text-amber-900">Parent Relationships</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parent1">Parent 1 (optional)</Label>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select first parent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableParent1Options.map((otherMember) => (
                      <SelectItem key={otherMember.id} value={otherMember.id}>
                        {otherMember.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parent2">Parent 2 (optional)</Label>
                <Select value={parent2Id} onValueChange={setParent2Id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select second parent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableParent2Options.map((otherMember) => (
                      <SelectItem key={otherMember.id} value={otherMember.id}>
                        {otherMember.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-start gap-2 mt-3 p-2 bg-blue-50 rounded-md">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                When both parents are selected, the family tree will show lines from both parents that merge at a
                junction point before connecting to this person.
              </p>
            </div>
          </div>

          <div className="border border-pink-200 rounded-lg p-4 bg-pink-50/50">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="h-5 w-5 text-pink-700" />
              <h3 className="font-medium text-pink-900">Spouse Relationship</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="spouse">Spouse (optional)</Label>
              <Select value={spouseId} onValueChange={setSpouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select spouse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {otherMembers
                    .filter((m) => m.id !== parentId && m.id !== parent2Id)
                    .map((otherMember) => (
                      <SelectItem key={otherMember.id} value={otherMember.id}>
                        {otherMember.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start gap-2 mt-3 p-2 bg-pink-100 rounded-md">
              <Info className="h-4 w-4 text-pink-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-pink-700">
                This creates a horizontal dashed line with a heart symbol between spouses in the family tree.
              </p>
            </div>
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="bio">Bio (optional)</Label>
        <Textarea
          id="bio"
          name="bio"
          rows={3}
          placeholder="Enter biographical information"
          defaultValue={member.bio || ""}
        />
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

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Updating..." : "Update Family Member & Relationships"}
      </Button>
    </form>
  )
}
