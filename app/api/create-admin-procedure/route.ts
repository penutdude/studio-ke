import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const supabase = getSupabaseServerClient(cookies())

    // Create the stored procedure
    await supabase.rpc("exec_sql", {
      sql_string: `
        CREATE OR REPLACE FUNCTION create_admin_tables()
        RETURNS void AS $$
        BEGIN
          -- Create admins table if it doesn't exist
          CREATE TABLE IF NOT EXISTS admins (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Create pending_users table if it doesn't exist
          CREATE TABLE IF NOT EXISTS pending_users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email TEXT UNIQUE NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        END;
        $$ LANGUAGE plpgsql;
      `,
    })

    return NextResponse.json({
      success: true,
      message: "Admin procedure created successfully",
    })
  } catch (error) {
    console.error("Error creating admin procedure:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create admin procedure",
      },
      { status: 500 },
    )
  }
}
