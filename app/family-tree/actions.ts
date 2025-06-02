"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Helper function to extract location and position from bio
function extractDataFromBio(bio: string | null): {
  cleanBio: string
  location: string
  position: { x: number; y: number } | null
  customPosition: boolean
} {
  if (!bio) return { cleanBio: "", location: "", position: null, customPosition: false }

  let workingBio = bio
  let location = ""
  let position = null
  let customPosition = false

  // Extract location
  const locationMatch = workingBio.match(/\[LOCATION:(.*?)\]/s)
  if (locationMatch) {
    location = locationMatch[1].trim()
    workingBio = workingBio.replace(/\[LOCATION:.*?\]/s, "").trim()
  }

  // Extract position - use a more robust regex that can handle decimal numbers
  const positionMatch = workingBio.match(/\[POSITION:(-?\d+\.?\d*),(-?\d+\.?\d*)\]/s)
  if (positionMatch) {
    position = {
      x: Number.parseFloat(positionMatch[1]),
      y: Number.parseFloat(positionMatch[2]),
    }
    customPosition = true
    workingBio = workingBio.replace(/\[POSITION:.*?\]/s, "").trim()
  }

  return { cleanBio: workingBio, location, position, customPosition }
}

// Helper function to combine bio, location, and position
function combineDataToBio(bio: string, location: string, position: { x: number; y: number } | null): string {
  const cleanBio = bio.trim()
  const cleanLocation = location.trim()

  let result = cleanBio

  if (cleanLocation) {
    result = result ? `${result}\n\n[LOCATION:${cleanLocation}]` : `[LOCATION:${cleanLocation}]`
  }

  if (position) {
    result = result ? `${result}\n\n[POSITION:${position.x},${position.y}]` : `[POSITION:${position.x},${position.y}]`
  }

  return result
}

export async function getFamilyMembers() {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.from("family_members").select("*").order("name", { ascending: true })

    if (error) {
      console.error("Error fetching family members:", error)
      return []
    }

    // Process the data to extract location and position from bio
    const processedData = (data || []).map((member) => {
      const { cleanBio, location, position, customPosition } = extractDataFromBio(member.bio)

      // Debug log to check extraction
      console.log(`Member ${member.name}: Position=${JSON.stringify(position)}, Custom=${customPosition}`)

      return {
        ...member,
        bio: cleanBio,
        location: location,
        position_x: position?.x || null,
        position_y: position?.y || null,
        custom_position: customPosition,
      }
    })

    return processedData
  } catch (error) {
    console.error("Unexpected error fetching family members:", error)
    return []
  }
}

export async function updateMemberPosition(memberId: string, x: number, y: number, currentUserEmail: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Validate inputs
    if (!memberId || !currentUserEmail) {
      return { error: "Member ID and user information are required" }
    }

    if (typeof x !== "number" || typeof y !== "number") {
      return { error: "Invalid position coordinates" }
    }

    // Get current member data
    const { data: member, error: fetchError } = await supabase
      .from("family_members")
      .select("bio, added_by, name")
      .eq("id", memberId)
      .single()

    if (fetchError) {
      console.error("Error fetching family member:", fetchError)
      return { error: "Family member not found" }
    }

    // For now, allow anyone to move members (you can restrict this later)
    // if (member.added_by !== currentUserEmail) {
    //   return { error: "You don't have permission to move this family member" }
    // }

    // Extract existing data from bio
    const { cleanBio, location } = extractDataFromBio(member.bio)

    // Combine with new position
    const updatedBio = combineDataToBio(cleanBio, location, { x, y })

    // Debug log
    console.log(`Saving position for ${member.name}: x=${x}, y=${y}`)
    console.log(`Updated bio: ${updatedBio}`)

    const { data, error } = await supabase
      .from("family_members")
      .update({
        bio: updatedBio || null,
      })
      .eq("id", memberId)
      .select()
      .single()

    if (error) {
      console.error("Error updating member position:", error)
      return { error: "Failed to update position. Please try again." }
    }

    // DON'T revalidate path to prevent re-fetching and layout recalculation
    // revalidatePath("/family-tree")

    return {
      success: true,
      data: {
        ...data,
        position_x: x,
        position_y: y,
        custom_position: true,
      },
    }
  } catch (error) {
    console.error("Unexpected error updating member position:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function resetTreeLayout(currentUserEmail: string) {
  try {
    const supabase = createServerSupabaseClient()

    if (!currentUserEmail) {
      return { error: "User information is required" }
    }

    // Get all members
    const { data: members, error: fetchError } = await supabase.from("family_members").select("id, bio")

    if (fetchError) {
      console.error("Error fetching family members:", fetchError)
      return { error: "Failed to fetch family members. Please try again." }
    }

    // Update each member to remove position data
    for (const member of members || []) {
      const { cleanBio, location } = extractDataFromBio(member.bio)
      const updatedBio = combineDataToBio(cleanBio, location, null)

      await supabase
        .from("family_members")
        .update({ bio: updatedBio || null })
        .eq("id", member.id)
    }

    revalidatePath("/family-tree")
    return { success: true }
  } catch (error) {
    console.error("Unexpected error resetting tree layout:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function createFamilyMember(formData: FormData) {
  try {
    const supabase = createServerSupabaseClient()

    const name = formData.get("name") as string
    const birthDate = formData.get("birth_date") as string
    const bio = formData.get("bio") as string
    const addedBy = formData.get("added_by") as string
    const gender = formData.get("gender") as string
    const location = formData.get("location") as string

    // Validate required fields
    if (!name?.trim()) {
      return {
        error: "Name is required",
      }
    }

    if (!addedBy?.trim()) {
      return {
        error: "Added by information is required",
      }
    }

    // Validate field lengths
    if (name.length > 100) {
      return {
        error: "Name must be less than 100 characters",
      }
    }

    if (bio && bio.length > 1600) {
      // Reduced to account for location and position storage
      return {
        error: "Bio must be less than 1,600 characters",
      }
    }

    if (location && location.length > 300) {
      return {
        error: "Location must be less than 300 characters",
      }
    }

    // Validate birth date if provided
    if (birthDate) {
      const dateObj = new Date(birthDate)
      if (isNaN(dateObj.getTime())) {
        return {
          error: "Invalid birth date format",
        }
      }

      // Check if birth date is not in the future
      if (dateObj > new Date()) {
        return {
          error: "Birth date cannot be in the future",
        }
      }
    }

    // Validate gender
    const validGenders = ["male", "female", "non_binary", "not_specified"]
    if (gender && !validGenders.includes(gender)) {
      return {
        error: "Invalid gender selection",
      }
    }

    // Combine bio and location (no position for new members)
    const combinedBio = combineDataToBio(bio || "", location || "", null)

    const { data, error } = await supabase
      .from("family_members")
      .insert({
        name: name.trim(),
        birth_date: birthDate || null,
        relationship: null,
        parent_id: null,
        parent2_id: null,
        spouse_id: null,
        bio: combinedBio || null,
        added_by: addedBy.trim(),
        gender: gender || "not_specified",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating family member:", error)
      return {
        error: "Failed to create family member. Please try again.",
      }
    }

    revalidatePath("/family-tree")
    return { success: true, data }
  } catch (error) {
    console.error("Unexpected error creating family member:", error)
    return {
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function updateFamilyMember(formData: FormData) {
  try {
    const supabase = createServerSupabaseClient()

    const id = formData.get("id") as string
    const name = formData.get("name") as string
    const birthDate = formData.get("birth_date") as string
    const relationship = formData.get("relationship") as string
    const parentId = formData.get("parent_id") as string
    const parent2Id = formData.get("parent2_id") as string
    const spouseId = formData.get("spouse_id") as string
    const bio = formData.get("bio") as string
    const gender = formData.get("gender") as string
    const currentUserEmail = formData.get("current_user_email") as string
    const location = formData.get("location") as string

    // Validate required fields
    if (!id || !name?.trim() || !currentUserEmail?.trim()) {
      return {
        error: "ID, name, and user information are required",
      }
    }

    // Validate field lengths
    if (name.length > 100) {
      return {
        error: "Name must be less than 100 characters",
      }
    }

    if (bio && bio.length > 1600) {
      // Reduced to account for location and position storage
      return {
        error: "Bio must be less than 1,600 characters",
      }
    }

    if (location && location.length > 300) {
      return {
        error: "Location must be less than 300 characters",
      }
    }

    // Validate birth date if provided
    if (birthDate) {
      const dateObj = new Date(birthDate)
      if (isNaN(dateObj.getTime())) {
        return {
          error: "Invalid birth date format",
        }
      }

      if (dateObj > new Date()) {
        return {
          error: "Birth date cannot be in the future",
        }
      }
    }

    // Validate gender
    const validGenders = ["male", "female", "non_binary", "not_specified"]
    if (gender && !validGenders.includes(gender)) {
      return {
        error: "Invalid gender selection",
      }
    }

    // Check if the current user is the creator
    const { data: member, error: fetchError } = await supabase
      .from("family_members")
      .select("added_by, bio")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("Error fetching family member:", fetchError)
      return {
        error: "Family member not found",
      }
    }

    if (member.added_by !== currentUserEmail) {
      return {
        error: "You don't have permission to edit this family member",
      }
    }

    // Validate relationships to prevent circular references
    if (parentId === id || parent2Id === id || spouseId === id) {
      return {
        error: "A person cannot be related to themselves",
      }
    }

    if (parentId && parent2Id && parentId === parent2Id) {
      return {
        error: "Both parents cannot be the same person",
      }
    }

    // Extract existing position data and preserve it
    const { position } = extractDataFromBio(member.bio)

    // Combine bio, location, and preserve existing position
    const combinedBio = combineDataToBio(bio || "", location || "", position)

    const { data, error } = await supabase
      .from("family_members")
      .update({
        name: name.trim(),
        birth_date: birthDate || null,
        relationship: relationship === "none" ? null : relationship || null,
        parent_id: parentId === "none" ? null : parentId || null,
        parent2_id: parent2Id === "none" ? null : parent2Id || null,
        spouse_id: spouseId === "none" ? null : spouseId || null,
        bio: combinedBio || null,
        gender: gender || "not_specified",
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating family member:", error)
      return {
        error: "Failed to update family member. Please try again.",
      }
    }

    revalidatePath("/family-tree")
    return { success: true, data }
  } catch (error) {
    console.error("Unexpected error updating family member:", error)
    return {
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function deleteFamilyMember(id: string, addedBy: string, currentUserEmail: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Validate inputs
    if (!id || !addedBy || !currentUserEmail) {
      return {
        error: "Missing required information",
      }
    }

    if (addedBy !== currentUserEmail) {
      return {
        error: "You don't have permission to delete this family member",
      }
    }

    // Verify the member exists and belongs to the user
    const { data: member, error: fetchError } = await supabase
      .from("family_members")
      .select("id, added_by")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("Error fetching family member for deletion:", fetchError)
      return {
        error: "Family member not found",
      }
    }

    if (member.added_by !== currentUserEmail) {
      return {
        error: "You don't have permission to delete this family member",
      }
    }

    // Remove any relationships pointing to this member
    const { error: updateError1 } = await supabase
      .from("family_members")
      .update({ parent_id: null })
      .eq("parent_id", id)

    const { error: updateError2 } = await supabase
      .from("family_members")
      .update({ parent2_id: null })
      .eq("parent2_id", id)

    const { error: updateError3 } = await supabase
      .from("family_members")
      .update({ spouse_id: null })
      .eq("spouse_id", id)

    if (updateError1 || updateError2 || updateError3) {
      console.error("Error updating relationships:", { updateError1, updateError2, updateError3 })
      // Continue with deletion even if relationship updates fail
    }

    const { error: deleteError } = await supabase.from("family_members").delete().eq("id", id)

    if (deleteError) {
      console.error("Error deleting family member:", deleteError)
      return {
        error: "Failed to delete family member. Please try again.",
      }
    }

    revalidatePath("/family-tree")
    return { success: true }
  } catch (error) {
    console.error("Unexpected error deleting family member:", error)
    return {
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function updateMemberProfile(data: {
  id: string
  name: string
  bio: string
  instagram_username: string
  twitter_username: string
  facebook_username: string
  location: string
  currentUserEmail: string
}) {
  try {
    const supabase = createServerSupabaseClient()

    // Validate required fields
    if (!data.id || !data.name?.trim() || !data.currentUserEmail?.trim()) {
      return { error: "ID, name, and user information are required" }
    }

    // Validate field lengths
    if (data.name.length > 100) {
      return { error: "Name must be less than 100 characters" }
    }

    if (data.bio && data.bio.length > 1600) {
      // Reduced to account for location and position storage
      return { error: "Bio must be less than 1,600 characters" }
    }

    if (data.instagram_username && data.instagram_username.length > 50) {
      return { error: "Instagram username must be less than 50 characters" }
    }

    if (data.twitter_username && data.twitter_username.length > 50) {
      return { error: "Twitter username must be less than 50 characters" }
    }

    if (data.facebook_username && data.facebook_username.length > 100) {
      return { error: "Facebook username must be less than 100 characters" }
    }

    if (data.location && data.location.length > 300) {
      return { error: "Location must be less than 300 characters" }
    }

    // Check if the current user is the creator
    const { data: member, error: fetchError } = await supabase
      .from("family_members")
      .select("added_by, bio")
      .eq("id", data.id)
      .single()

    if (fetchError) {
      console.error("Error fetching family member:", fetchError)
      return { error: "Family member not found" }
    }

    if (member.added_by !== data.currentUserEmail) {
      return { error: "You don't have permission to edit this family member" }
    }

    // Extract existing position data and preserve it
    const { position } = extractDataFromBio(member.bio)

    // Combine bio, location, and preserve existing position
    const combinedBio = combineDataToBio(data.bio || "", data.location || "", position)

    const { data: updatedMember, error } = await supabase
      .from("family_members")
      .update({
        name: data.name.trim(),
        bio: combinedBio || null,
        instagram_username: data.instagram_username?.trim() || null,
        twitter_username: data.twitter_username?.trim() || null,
        facebook_username: data.facebook_username?.trim() || null,
      })
      .eq("id", data.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating member profile:", error)
      return { error: "Failed to update profile. Please try again." }
    }

    revalidatePath("/family-tree")
    return { success: true, data: updatedMember }
  } catch (error) {
    console.error("Unexpected error updating member profile:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function uploadAvatar(file: File, memberId: string, currentUserEmail: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Validate inputs
    if (!file || !memberId || !currentUserEmail) {
      return { error: "File, member ID, and user information are required" }
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return { error: "File must be an image" }
    }

    // Validate file size (2MB limit for data URLs)
    if (file.size > 2 * 1024 * 1024) {
      return { error: "Image must be less than 2MB" }
    }

    // Check permissions
    const { data: member, error: fetchError } = await supabase
      .from("family_members")
      .select("added_by")
      .eq("id", memberId)
      .single()

    if (fetchError) {
      console.error("Error fetching family member:", fetchError)
      return { error: "Family member not found" }
    }

    if (member.added_by !== currentUserEmail) {
      return { error: "You don't have permission to edit this family member" }
    }

    // Convert file to data URL
    const fileBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(fileBuffer).toString("base64")
    const dataUrl = `data:${file.type};base64,${base64}`

    // Update member record with avatar URL
    const { data: updatedMember, error: updateError } = await supabase
      .from("family_members")
      .update({ avatar_url: dataUrl })
      .eq("id", memberId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating avatar URL:", updateError)
      return { error: "Failed to update avatar. Please try again." }
    }

    revalidatePath("/family-tree")
    return { success: true, avatarUrl: dataUrl, data: updatedMember }
  } catch (error) {
    console.error("Unexpected error uploading avatar:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}
