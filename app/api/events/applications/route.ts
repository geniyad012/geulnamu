import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")

    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 })
    }

    console.log("[v0] Fetching applicants for event:", eventId)
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("event_applications")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching applicants:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Found applicants:", data?.length || 0, "total")
    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] Error in GET applications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    console.log("[v0] POST /api/events/applications - Starting")

    const supabase = createAdminClient()
    console.log("[v0] Admin client created")

    const body = await request.json()
    console.log("[v0] Request body:", body)

    const { event_id, name, phone, gender } = body

    if (!event_id || !name || !phone) {
      console.error("[v0] Missing required fields:", { event_id, name, phone })
      return NextResponse.json({ error: "event_id, name, and phone are required" }, { status: 400 })
    }

    const insertData: any = {
      event_id,
      applicant_name: name,
      phone,
    }

    if (gender && gender.trim() !== "") {
      insertData.gender = gender
    }

    console.log("[v0] Inserting data:", JSON.stringify(insertData))

    const { data, error } = await supabase.from("event_applications").insert(insertData).select().single()

    if (error) {
      console.error("[v0] Supabase error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return NextResponse.json(
        {
          error: error.message,
          details: error.details,
          hint: error.hint,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Application created successfully:", data)
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("[v0] Caught exception in POST /api/events/applications:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
