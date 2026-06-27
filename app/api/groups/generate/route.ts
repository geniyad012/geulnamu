import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { groupSize = 4 } = await request.json()

    console.log("[v0] Generating groups with groupSize:", groupSize)

    const supabase = await createClient()

    const { data: latestAttendance, error: latestError } = await supabase
      .from("attendances")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (latestError || !latestAttendance) {
      console.error("[v0] No attendance records found:", latestError)
      return NextResponse.json({ error: "출석 기록이 없습니다" }, { status: 404 })
    }

    // Get the date of the latest attendance (Korea timezone)
    const latestDate = new Date(latestAttendance.created_at)
    const koreaOffset = 9 * 60 // Korea is UTC+9
    const koreaTime = new Date(latestDate.getTime() + koreaOffset * 60 * 1000)

    const targetDateKorea = new Date(koreaTime)
    targetDateKorea.setUTCHours(0, 0, 0, 0)

    const nextDayKorea = new Date(targetDateKorea)
    nextDayKorea.setUTCDate(nextDayKorea.getUTCDate() + 1)

    const startUTC = new Date(targetDateKorea.getTime() - koreaOffset * 60 * 1000)
    const endUTC = new Date(nextDayKorea.getTime() - koreaOffset * 60 * 1000)

    console.log("[v0] Using latest attendance date:", {
      latestAttendance: latestAttendance.created_at,
      start: startUTC.toISOString(),
      end: endUTC.toISOString(),
      koreaDate: targetDateKorea.toISOString(),
    })

    const { data: attendees, error: fetchError } = await supabase
      .from("attendances")
      .select("name, phone_last4, event_id, book_genre, is_first_time, reading_only")
      .gte("created_at", startUTC.toISOString())
      .lt("created_at", endUTC.toISOString())
      .order("created_at", { ascending: true })

    console.log("[v0] Query result:", {
      count: attendees?.length || 0,
      dateRange: `${startUTC.toISOString()} ~ ${endUTC.toISOString()}`,
      first5: attendees?.slice(0, 5).map((a) => `${a.name}(${a.phone_last4 || "번호없음"})`),
      firstTimers: attendees?.filter((a) => a.is_first_time).map((a) => `${a.name}(${a.phone_last4})`),
      readingOnly: attendees?.filter((a) => a.reading_only).map((a) => `${a.name}(${a.phone_last4})`),
    })

    if (fetchError) {
      console.error("[v0] Error fetching attendees:", fetchError)
      return NextResponse.json({ error: "출석 데이터 조회 실패: " + fetchError.message }, { status: 500 })
    }

    if (!attendees || attendees.length === 0) {
      console.error("[v0] No attendees found for date range")
      return NextResponse.json({ error: "해당 날짜에 출석한 사람이 없습니다" }, { status: 404 })
    }

    const eligibleAttendees = attendees.filter((a) => !a.reading_only)

    if (eligibleAttendees.length === 0) {
      console.error("[v0] No eligible attendees for group assignment")
      return NextResponse.json({ error: "조편성 가능한 사람이 없습니다" }, { status: 404 })
    }

    const eventId = "기본이벤트"

    console.log("[v0] Deleting existing groups for event:", eventId)
    const { error: deleteError } = await supabase.from("groups").delete().eq("event_id", eventId)

    if (deleteError) {
      console.warn("[v0] Error deleting old groups:", deleteError)
    } else {
      console.log("[v0] Successfully deleted old groups")
    }

    const firstTimers = eligibleAttendees.filter((a) => a.is_first_time === true)
    const regularMembers = eligibleAttendees.filter((a) => a.is_first_time !== true)

    const shuffledRegular = [...regularMembers].sort(() => Math.random() - 0.5)

    const totalMembers = eligibleAttendees.length
    const numberOfGroups = Math.ceil(totalMembers / groupSize)

    console.log("[v0] Group assignment:", {
      totalMembers,
      firstTimersCount: firstTimers.length,
      regularCount: regularMembers.length,
      readingOnlyCount: attendees.length - eligibleAttendees.length,
      groupSize,
      numberOfGroups,
    })

    const groups = []

    for (const member of firstTimers) {
      groups.push({
        event_id: eventId,
        member_name: member.name,
        phone_last4: member.phone_last4,
        book_genre: member.book_genre,
        is_first_time: true,
        group_number: 1,
        is_published: false,
        is_leader: false,
      })
    }

    let currentGroupIndex = firstTimers.length > 0 ? 1 : 0
    for (const member of shuffledRegular) {
      groups.push({
        event_id: eventId,
        member_name: member.name,
        phone_last4: member.phone_last4,
        book_genre: member.book_genre,
        is_first_time: false,
        group_number: (currentGroupIndex % numberOfGroups) + 1,
        is_published: false,
        is_leader: false,
      })
      currentGroupIndex++
    }

    console.log("[v0] Creating", groups.length, "members in", numberOfGroups, "groups")

    const { error: insertError } = await supabase.from("groups").insert(groups)

    if (insertError) {
      console.error("[v0] Error inserting groups:", insertError)
      return NextResponse.json(
        {
          error: "조 편성 저장 실패",
          details: insertError.message,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Groups created successfully!")
    return NextResponse.json({
      success: true,
      groups,
      summary: `${eligibleAttendees.length}명을 ${numberOfGroups}개 조로 편성했습니다 (독서만: ${attendees.length - eligibleAttendees.length}명 제외)`,
    })
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 })
  }
}
