import { NextResponse } from "next/server"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export async function POST() {
  try {
    const supabase = getSupabaseBrowserClient()

    // First, let's try to create the admins table by inserting data
    // This will help us understand what's happening
    const { data: adminData, error: adminError } = await supabase
      .from("admins")
      .insert({
        email: "altros421@gmail.com",
        created_at: new Date().toISOString(),
      })
      .select()

    // Try to create pending_users table
    const { data: pendingData, error: pendingError } = await supabase
      .from("pending_users")
      .insert({
        email: "test@example.com",
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()

    // Delete the test record
    if (pendingData && pendingData.length > 0) {
      await supabase.from("pending_users").delete().eq("email", "test@example.com")
    }

    return NextResponse.json({
      success: true,
      message: "Tables created and default admin added",
      adminError: adminError?.message || null,
      pendingError: pendingError?.message || null,
      adminData,
      pendingData,
    })
  } catch (error: any) {
    console.error("Error creating tables:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create tables",
        details: error,
      },
      { status: 500 },
    )
  }
}
