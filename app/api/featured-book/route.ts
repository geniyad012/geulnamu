import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log("[v0] Featured book API 호출됨")
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("featured_book")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error("[v0] Featured book 조회 오류:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      console.log("[v0] Featured book 데이터 없음")
      return NextResponse.json(null)
    }

    console.log("[v0] Featured book 데이터:", data)

    const result = {
      id: data.id,
      title: data.title,
      description: data.description,
      imageUrl: data.image_url, // Convert to camelCase
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Featured book API 예외:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
