import { getSupabaseBrowserClient } from "@/lib/supabase/client"

// Hardcoded admin list for now - this will work immediately
const HARDCODED_ADMINS = ["altros421@gmail.com"]

export async function isUserAdmin(email?: string): Promise<boolean> {
  if (!email) return false

  // First check hardcoded admins
  if (HARDCODED_ADMINS.includes(email.toLowerCase())) {
    return true
  }

  try {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase.from("admins").select("*").eq("email", email.toLowerCase()).single()

    return !!data && !error
  } catch (error) {
    console.error("Error checking admin status:", error)
    // Fallback to hardcoded list
    return HARDCODED_ADMINS.includes(email.toLowerCase())
  }
}

export async function initializeDefaultAdmin() {
  // For now, we rely on hardcoded admins
  console.log("Using hardcoded admin list:", HARDCODED_ADMINS)
}

export async function addAdmin(email: string): Promise<boolean> {
  try {
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.from("admins").insert({
      email: email.toLowerCase(),
      created_at: new Date().toISOString(),
    })

    return !error
  } catch (error) {
    console.error("Error adding admin:", error)
    return false
  }
}

export async function removeAdmin(email: string): Promise<boolean> {
  // Don't allow removing hardcoded admins
  if (HARDCODED_ADMINS.includes(email.toLowerCase())) {
    return false
  }

  try {
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.from("admins").delete().eq("email", email.toLowerCase())

    return !error
  } catch (error) {
    console.error("Error removing admin:", error)
    return false
  }
}
