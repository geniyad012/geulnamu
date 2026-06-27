import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: "유효하지 않은 ID 목록입니다." }, { status: 400 })
    }

    console.log("[v0] 출석 기록 삭제 시도:", ids)

    const supabase = await createClient()

    // 단일 삭제 또는 다중 삭제
    const { error } = await supabase.from("attendances").delete().in("id", ids)

    console.log("[v0] 삭제 결과:", { error })

    if (error) {
      console.error("[v0] 출석 삭제 오류:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] 출석 삭제 중 예외 발생:", error)
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
