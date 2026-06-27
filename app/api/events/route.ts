import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] Fetching events from database...")
    const supabase = await createServerClient()

    const { data: events, error } = await supabase.from("events").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Supabase error fetching events:", error)
      if (error.code === "PGRST116" || error.message.includes("does not exist")) {
        console.log("[v0] Events table does not exist yet, returning empty array")
        return NextResponse.json([])
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[v0] Successfully fetched ${events?.length || 0} events`)
    return NextResponse.json(events || [])
  } catch (error) {
    console.error("[v0] Unexpected error in events API:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    console.log("[v0] Creating new event...")
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    console.log("[v0] Service role key available:", !!serviceRoleKey)

    if (!serviceRoleKey) {
      console.error("[v0] SUPABASE_SERVICE_ROLE_KEY is not set")
      return NextResponse.json(
        {
          error: "서버 설정 오류: 서비스 역할 키가 설정되지 않았습니다.",
        },
        { status: 500 },
      )
    }

    const supabase = createAdminClient()
    const body = await request.json()

    console.log("[v0] Event data to insert:", body)

    const {
      title,
      description,
      content,
      thumbnail_url,
      detail_image_url,
      status,
      price,
      account_number,
      account_holder_name,
      event_date,
      event_time,
      short_location,
      location,
    } = body

    if (!title) {
      return NextResponse.json({ error: "제목은 필수입니다." }, { status: 400 })
    }

    const insertData = {
      title,
      description: description || "",
      content: content || "", // Added content field
      thumbnail_url: thumbnail_url || "",
      detail_image_url: detail_image_url || "",
      status: status || "ongoing",
      price: price || "",
      account_number: account_number || "",
      account_holder_name: account_holder_name || "",
      event_date: event_date || null,
      event_time: event_time || null,
      short_location: short_location || "",
      location: location || "",
    }

    console.log("[v0] Inserting event with data:", insertData)

    const { data, error } = await supabase.from("events").insert(insertData).select().single()

    if (error) {
      console.error("[v0] Error creating event:", error)
      console.error("[v0] Error details:", JSON.stringify(error, null, 2))
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Event created successfully:", data)
    return NextResponse.json({ event: data })
  } catch (error) {
    console.error("[v0] Unexpected error creating event:", error)
    return NextResponse.json({ error: "이벤트 생성 중 오류가 발생했습니다." }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    console.log("[v0] Updating event...")
    const supabase = createAdminClient()
    const body = await request.json()

    const {
      id,
      title,
      description,
      content,
      thumbnail_url,
      detail_image_url,
      status,
      price,
      account_number,
      account_holder_name,
      event_date,
      event_time,
      short_location,
      location,
    } = body

    if (!id || !title) {
      return NextResponse.json({ error: "ID와 제목은 필수입니다." }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("events")
      .update({
        title,
        description,
        content, // Added content field to update
        thumbnail_url,
        detail_image_url,
        status,
        price,
        account_number,
        account_holder_name,
        event_date,
        event_time,
        short_location,
        location,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating event:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Event updated successfully:", data)
    return NextResponse.json({ event: data })
  } catch (error) {
    console.error("[v0] Unexpected error updating event:", error)
    return NextResponse.json({ error: "이벤트 수정 중 오류가 발생했습니다." }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID가 필요합니다." }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase.from("events").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting event:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Unexpected error deleting event:", error)
    return NextResponse.json({ error: "이벤트 삭제 중 오류가 발생했습니다." }, { status: 500 })
  }
}
