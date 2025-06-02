import { createClient } from "@supabase/supabase-js"
import type { Database } from "../types/database.types"

let supabaseClient: ReturnType<typeof createBrowserSupabaseClient> | null = null

export function createBrowserSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables:", {
      url: !!supabaseUrl,
      anonKey: !!supabaseAnonKey,
    })
    throw new Error("Missing Supabase environment variables")
  }

  try {
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          "X-Client-Info": "thazguthedath-family-app",
        },
      },
    })
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    throw new Error("Failed to initialize database connection")
  }
}

// Singleton pattern to avoid multiple instances
export function getSupabaseBrowserClient() {
  if (!supabaseClient) {
    supabaseClient = createBrowserSupabaseClient()
  }
  return supabaseClient
}
