import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.from("events").select("*").order("event_date", { ascending: true })

    if (error) {
      console.error("Error fetching events:", error)
      return NextResponse.json([], { status: 200 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Unexpected error fetching events:", error)
    return NextResponse.json([], { status: 200 })
  }
}
