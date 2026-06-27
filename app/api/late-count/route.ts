import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const name = searchParams.get("name")
    const phoneLast4 = searchParams.get("phone_last4")

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const quarter = Math.ceil(month / 3)

    const quarterStartMonth = (quarter - 1) * 3 + 1
    const quarterEndMonth = quarter * 3 + 1
    const quarterStart = new Date(year, quarterStartMonth - 1, 1)
    const quarterEnd = new Date(year, quarterEndMonth - 1, 1)

    let totalQuery = supabase
      .from("attendances")
      .select("*", { count: "exact", head: true })
      .eq("name", name)
      .gte("created_at", quarterStart.toISOString())
      .lt("created_at", quarterEnd.toISOString())

    // 휴대폰 번호가 있으면: 해당 번호 또는 NULL 데이터만 조회 (기존 + 새 데이터)
    if (phoneLast4) {
      totalQuery = totalQuery.or(`phone_last4.eq.${phoneLast4},phone_last4.is.null`)
    }

    const { count: totalCount, error: totalError } = await totalQuery

    if (totalError) {
      console.error("[v0] Error fetching total count:", totalError)
      return NextResponse.json({ error: "Failed to fetch attendance count" }, { status: 500 })
    }

    let lateQuery = supabase
      .from("attendances")
      .select("*", { count: "exact", head: true })
      .eq("name", name)
      .eq("is_late", true)
      .gte("created_at", quarterStart.toISOString())
      .lt("created_at", quarterEnd.toISOString())

    // 휴대폰 번호가 있으면: 해당 번호 또는 NULL 데이터만 조회
    if (phoneLast4) {
      lateQuery = lateQuery.or(`phone_last4.eq.${phoneLast4},phone_last4.is.null`)
    }

    const { count: lateCount, error: lateError } = await lateQuery

    if (lateError) {
      console.error("[v0] Error fetching late count:", lateError)
      return NextResponse.json({ error: "Failed to fetch late count" }, { status: 500 })
    }

    return NextResponse.json({
      lateCount: lateCount || 0,
      totalCount: totalCount || 0,
      year,
      quarter,
    })
  } catch (error) {
    console.error("[v0] Late count API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
