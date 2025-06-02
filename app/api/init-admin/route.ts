import { NextResponse } from "next/server"
import { initializeDefaultAdmin } from "@/lib/auth/admin-utils"

export async function GET() {
  try {
    await initializeDefaultAdmin()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error initializing admin:", error)
    return NextResponse.json({ error: "Failed to initialize admin" }, { status: 500 })
  }
}
