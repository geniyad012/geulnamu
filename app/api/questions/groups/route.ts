import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")

    if (!date) {
      return NextResponse.json({ error: "날짜가 필요합니다" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Missing environment variables" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { data, error } = await supabase
      .from("questions")
      .select("group_number")
      .eq("question_date", date)
      .order("group_number", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const validGroups = (data || [])
      .map((item) => item.group_number)
      .filter((num): num is number => num !== null && num !== undefined && typeof num === "number" && !isNaN(num))

    const groups = [...new Set(validGroups)].sort((a, b) => a - b)

    return NextResponse.json(groups)
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "조 목록을 불러오는데 실패했습니다",
      },
      { status: 500 },
    )
  }
}
