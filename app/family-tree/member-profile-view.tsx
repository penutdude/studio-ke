"use client"

import type React from "react"

import { useState, useRef } from "react"
import type { Database } from "@/lib/types/database.types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth/auth-context"
import { updateMemberProfile, uploadAvatar } from "./actions"
import {
  Edit,
  Save,
  X,
  Camera,
  Instagram,
  Twitter,
  Facebook,
  ExternalLink,
  Calendar,
  User,
  MapPin,
  Loader2,
} from "lucide-react"

type FamilyMember = Database["public"]["Tables"]["family_members"]["Row"]

interface MemberProfileViewProps {
  member: FamilyMember
  onClose: () => void
  onUpdate: () => void
}

export function MemberProfileView({ member, onClose, onUpdate }: MemberProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [formData, setFormData] = useState({
    name: member.name,
    bio: member.bio || "",
    instagram_username: member.instagram_username || "",
    twitter_username: member.twitter_username || "",
    facebook_username: member.facebook_username || "",
    location: member.location || "",
  })
  const [avatarUrl, setAvatarUrl] = useState(member.avatar_url)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  const isOwner = user?.email === member.added_by

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getSocialMediaLink = (platform: string, username: string) => {
    if (!username) return null

    const baseUrls = {
      instagram: "https://instagram.com/",
      twitter: "https://x.com/",
      facebook: "https://www.facebook.com/search/top/?q=",
    }

    if (platform === "facebook") {
      return baseUrls.facebook + encodeURIComponent(username)
    }

    return baseUrls[platform as keyof typeof baseUrls] + username.replace("@", "")
  }

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
          const locationString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          setFormData((prev) => ({ ...prev, location: locationString }))
        } catch (error) {
          console.error("Error getting address:", error)
          const locationString = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
          setFormData((prev) => ({ ...prev, location: locationString }))
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

  const openInGoogleMaps = (location: string) => {
    if (!location) return

    // Encode the location for URL
    const encodedLocation = encodeURIComponent(location)

    // Create Google Maps URL with the location
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`

    // Open in new tab
    window.open(googleMapsUrl, "_blank")
  }

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case "male":
        return "bg-blue-50 text-blue-800 border-blue-200"
      case "female":
        return "bg-pink-50 text-pink-800 border-pink-200"
      case "non_binary":
        return "bg-purple-50 text-purple-800 border-purple-200"
      default:
        return "bg-gray-50 text-gray-800 border-gray-200"
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    setIsUploadingAvatar(true)
    try {
      const result = await uploadAvatar(file, member.id, user.email || "")

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      setAvatarUrl(result.avatarUrl)
      toast({
        title: "Success",
        description: "Avatar updated successfully!",
      })
      onUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive",
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setIsSubmitting(true)
    try {
      const result = await updateMemberProfile({
        id: member.id,
        name: formData.name,
        bio: formData.bio,
        instagram_username: formData.instagram_username,
        twitter_username: formData.twitter_username,
        facebook_username: formData.facebook_username,
        location: formData.location,
        currentUserEmail: user.email || "",
      })

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
        description: "Profile updated successfully!",
      })

      setIsEditing(false)
      onUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: member.name,
      bio: member.bio || "",
      instagram_username: member.instagram_username || "",
      twitter_username: member.twitter_username || "",
      facebook_username: member.facebook_username || "",
      location: member.location || "",
    })
    setIsEditing(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl text-gray-900 dark:text-white font-heading">Member Profile</CardTitle>
            <div className="flex gap-2">
              {isOwner && !isEditing && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={onClose}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-gray-200 dark:border-gray-700">
                <AvatarImage src={avatarUrl || undefined} alt={member.name} />
                <AvatarFallback className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-2xl">
                  {member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {isOwner && (
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              )}

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </div>

            {isUploadingAvatar && <p className="text-sm text-gray-600 dark:text-gray-400">Uploading avatar...</p>}
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <User className="h-5 w-5" />
              <h3 className="text-lg font-semibold font-heading">Basic Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Name</Label>
                {isEditing ? (
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white font-medium">{member.name}</p>
                )}
              </div>

              {member.birth_date && (
                <div>
                  <Label className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Birth Date
                  </Label>
                  <p className="text-gray-900 dark:text-white">{formatDate(member.birth_date)}</p>
                </div>
              )}

              {member.relationship && (
                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Relationship</Label>
                  <Badge
                    variant="secondary"
                    className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                  >
                    {member.relationship}
                  </Badge>
                </div>
              )}

              {member.gender && (
                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Gender</Label>
                  <Badge className={`${getGenderColor(member.gender)} capitalize`}>
                    {member.gender.replace("_", " ")}
                  </Badge>
                </div>
              )}

              {member.location && (
                <div>
                  <Label className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Location
                  </Label>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-900 dark:text-white flex-1">{member.location}</p>
                    <button
                      onClick={() => openInGoogleMaps(member.location || "")}
                      className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1 text-xs underline"
                      title="Open in Google Maps"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Navigate
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator className="bg-gray-200 dark:bg-gray-700" />

          {/* Biography */}
          <div className="space-y-3">
            <Label className="text-gray-700 dark:text-gray-300 text-lg font-semibold font-heading">Biography</Label>
            {isEditing ? (
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about this family member..."
                rows={4}
                className="border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400"
              />
            ) : (
              <p className="text-gray-900 dark:text-white leading-relaxed">{member.bio || "No biography available."}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-3">
            <Label className="text-gray-700 dark:text-gray-300 text-lg font-semibold font-heading flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location
            </Label>
            {isEditing ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="Enter location"
                    className="border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {isGettingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">Click the location icon to use your current location</p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-gray-900 dark:text-white leading-relaxed flex-1">
                  {member.location || "No location specified."}
                </p>
                {member.location && (
                  <button
                    onClick={() => openInGoogleMaps(member.location || "")}
                    className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1 text-sm underline"
                    title="Open in Google Maps"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Navigate
                  </button>
                )}
              </div>
            )}
          </div>

          <Separator className="bg-gray-200 dark:bg-gray-700" />

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 font-heading">Social Media</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Instagram */}
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </Label>
                {isEditing ? (
                  <Input
                    value={formData.instagram_username}
                    onChange={(e) => setFormData((prev) => ({ ...prev, instagram_username: e.target.value }))}
                    placeholder="username"
                    className="border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400"
                  />
                ) : member.instagram_username ? (
                  <a
                    href={getSocialMediaLink("instagram", member.instagram_username) || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    @{member.instagram_username}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Not provided</p>
                )}
              </div>

              {/* Twitter/X */}
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Twitter className="h-4 w-4" />X (Twitter)
                </Label>
                {isEditing ? (
                  <Input
                    value={formData.twitter_username}
                    onChange={(e) => setFormData((prev) => ({ ...prev, twitter_username: e.target.value }))}
                    placeholder="username"
                    className="border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400"
                  />
                ) : member.twitter_username ? (
                  <a
                    href={getSocialMediaLink("twitter", member.twitter_username) || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    @{member.twitter_username}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Not provided</p>
                )}
              </div>

              {/* Facebook */}
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Facebook className="h-4 w-4" />
                  Facebook
                </Label>
                {isEditing ? (
                  <Input
                    value={formData.facebook_username}
                    onChange={(e) => setFormData((prev) => ({ ...prev, facebook_username: e.target.value }))}
                    placeholder="name or username"
                    className="border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400"
                  />
                ) : member.facebook_username ? (
                  <a
                    href={getSocialMediaLink("facebook", member.facebook_username) || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Search: {member.facebook_username}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Not provided</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={handleSave}
                disabled={isSubmitting}
                className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Added by info */}
          {member.added_by && (
            <div className="text-right pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400">Added by {member.added_by}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
