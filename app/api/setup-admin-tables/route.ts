import { NextResponse } from "next/server"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export async function GET() {
  try {
    const supabase = getSupabaseBrowserClient()

    // Try to create admins table directly first
    try {
      // First check if table exists
      const { error: checkError } = await supabase.from("admins").select("count").limit(1)

      if (checkError) {
        console.log("Admin table doesn't exist, creating it...")

        // Create admins table
        await supabase.from("admins").insert({
          email: "altros421@gmail.com",
          created_at: new Date().toISOString(),
        })
      } else {
        console.log("Admin table exists, checking for default admin...")

        // Check if default admin exists
        const { data: existingAdmin } = await supabase
          .from("admins")
          .select("*")
          .eq("email", "altros421@gmail.com")
          .single()

        // Add default admin if not exists
        if (!existingAdmin) {
          console.log("Default admin doesn't exist, adding it...")
          await supabase.from("admins").insert({
            email: "altros421@gmail.com",
            created_at: new Date().toISOString(),
          })
        } else {
          console.log("Default admin already exists")
        }
      }
    } catch (err) {
      console.error("Error creating admin table:", err)
    }

    // Try to create pending_users table
    try {
      // Check if table exists
      const { error: checkError } = await supabase.from("pending_users").select("count").limit(1)

      if (checkError) {
        console.log("Pending users table doesn't exist, creating it...")

        // Create pending_users table by inserting a dummy record (will be removed)
        const { error: createError } = await supabase.from("pending_users").insert({
          email: "dummy@example.com",
          status: "pending",
          created_at: new Date().toISOString(),
        })

        if (createError) {
          console.error("Error creating pending_users table:", createError)
        } else {
          // Remove dummy record
          await supabase.from("pending_users").delete().eq("email", "dummy@example.com")
        }
      }
    } catch (err) {
      console.error("Error creating pending_users table:", err)
    }

    return NextResponse.json({
      success: true,
      message: "Admin tables setup attempted",
    })
  } catch (error) {
    console.error("Error in setup admin tables:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
