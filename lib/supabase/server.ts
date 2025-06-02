import { createClient } from "@supabase/supabase-js"
import type { Database } from "../types/database.types"

export function createServerSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log("Supabase environment check:", {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    urlLength: supabaseUrl?.length,
    keyLength: supabaseKey?.length,
  })

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables:", {
      SUPABASE_URL: !!supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: !!supabaseKey,
    })
    throw new Error("Missing Supabase environment variables")
  }

  try {
    const client = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          "X-Client-Info": "thazguthedath-family-server",
        },
      },
    })

    console.log("Supabase server client created successfully")
    return client
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    throw new Error("Failed to initialize database connection")
  }
}

// Export the function with the correct name
export const getSupabaseServerClient = createServerSupabaseClient
