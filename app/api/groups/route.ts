import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")

    console.log("[v0] Loading groups for eventId:", eventId)

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: groups, error } = await supabase
      .from("groups")
      .select("*") // book_genre 포함하여 모든 컬럼 조회
      .eq("event_id", eventId)
      .order("group_number", { ascending: true })
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching groups:", error.message, error.details)
      return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 })
    }

    console.log("[v0] Groups loaded:", groups?.length || 0, "records")
    console.log("[v0] Sample group data:", groups?.[0])
    return NextResponse.json({ groups: groups || [] })
  } catch (error) {
    console.error("[v0] Error in groups API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { eventId, groups } = await request.json()

    console.log("[v0] Updating groups for eventId:", eventId, "count:", groups?.length)

    if (!eventId || !groups) {
      return NextResponse.json({ error: "Event ID and groups are required" }, { status: 400 })
    }

    const supabase = await createClient()

    // 기존 조 편성 삭제
    const { error: deleteError } = await supabase.from("groups").delete().eq("event_id", eventId)

    if (deleteError) {
      console.error("[v0] Error deleting groups:", deleteError)
    }

    // 새 조 편성 저장
    const { error: insertError } = await supabase.from("groups").insert(groups)

    if (insertError) {
      console.error("[v0] Error updating groups:", insertError.message, insertError.details)
      return NextResponse.json(
        {
          error: "Failed to update groups",
          details: insertError.message,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Groups updated successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating groups:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
