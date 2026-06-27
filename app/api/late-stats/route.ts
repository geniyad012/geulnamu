import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

interface MonthlyStats {
  month: number // 1-12
  lateRate: number // 지각률
  totalAttendees: number
  lateAttendees: number
}

export async function GET() {
  try {
    const supabase = await createClient()

    const currentYear = new Date().getFullYear()

    const startOfYear = new Date(currentYear, 0, 1).toISOString()
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59).toISOString()

    const { data: attendances, error } = await supabase
      .from("attendances")
      .select("created_at, is_late")
      .gte("created_at", startOfYear)
      .lte("created_at", endOfYear)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching attendance data:", error)
      return NextResponse.json({ error: "Failed to fetch attendance data" }, { status: 500 })
    }

    if (!attendances || attendances.length === 0) {
      return NextResponse.json({ year: currentYear, stats: [] })
    }

    const monthlyData = new Map<number, { total: number; late: number }>()

    attendances.forEach((record) => {
      const date = new Date(record.created_at)
      const month = date.getMonth() + 1 // 1-12

      if (!monthlyData.has(month)) {
        monthlyData.set(month, { total: 0, late: 0 })
      }

      const stats = monthlyData.get(month)!
      stats.total += 1
      if (record.is_late) {
        stats.late += 1
      }
    })

    const result: MonthlyStats[] = Array.from(monthlyData.entries()).map(([month, stats]) => ({
      month,
      lateRate: stats.total > 0 ? Math.round((stats.late / stats.total) * 100) : 0,
      totalAttendees: stats.total,
      lateAttendees: stats.late,
    }))

    return NextResponse.json({ year: currentYear, stats: result })
  } catch (error) {
    console.error("Error in late-stats API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
