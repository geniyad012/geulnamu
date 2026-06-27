import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from("questions").select("week").order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Weeks fetch error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get unique weeks
    const uniqueWeeks = [...new Set(data.map((item) => item.week))]

    return NextResponse.json(uniqueWeeks)
  } catch (error: any) {
    console.error("[v0] Weeks API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
