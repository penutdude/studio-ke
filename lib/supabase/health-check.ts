"use server"

import { createServerSupabaseClient } from "./server"

export async function checkDatabaseHealth() {
  try {
    const supabase = createServerSupabaseClient()

    // Test basic connection
    const { data, error } = await supabase.from("events").select("count").limit(1)

    if (error) {
      console.error("Database health check failed:", error)
      return {
        healthy: false,
        error: error.message,
        details: error,
      }
    }

    console.log("Database health check passed")
    return {
      healthy: true,
      message: "Database connection is working",
    }
  } catch (error) {
    console.error("Database health check error:", error)
    return {
      healthy: false,
      error: "Failed to connect to database",
      details: error,
    }
  }
}
