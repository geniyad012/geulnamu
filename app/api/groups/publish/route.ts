import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { eventId, isPublished } = await request.json()

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase.from("groups").update({ is_published: isPublished }).eq("event_id", eventId)

    if (error) {
      console.error("Error publishing groups:", error)
      return NextResponse.json({ error: "Failed to publish groups" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in publish API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
