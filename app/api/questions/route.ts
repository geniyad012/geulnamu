import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get("date")
    const groupNumber = searchParams.get("group")

    const supabase = getSupabase()

    let query = supabase.from("questions").select("*").order("created_at", { ascending: false })

    if (date) {
      query = query.eq("question_date", date)
    }

    if (groupNumber) {
      query = query.eq("group_number", Number.parseInt(groupNumber))
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Questions fetch error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Questions API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { groupNumber, authorName, content, password } = body

    if (!groupNumber || !authorName || !content || !password) {
      return NextResponse.json({ error: "조, 이름, 질문 내용, 비밀번호는 필수입니다" }, { status: 400 })
    }

    if (password.length !== 4 || !/^\d{4}$/.test(password)) {
      return NextResponse.json({ error: "비밀번호는 4자리 숫자여야 합니다" }, { status: 400 })
    }

    const supabase = getSupabase()

    const { data, error } = await supabase
      .from("questions")
      .insert([
        {
          question_date: new Date().toISOString().split("T")[0],
          group_number: Number.parseInt(groupNumber),
          author_name: authorName,
          phone_last4: null,
          content,
          password,
        },
      ])
      .select()

    if (error) {
      console.error("[v0] Question insert error:", error)
      return NextResponse.json({ error: error.message || "질문 등록에 실패했습니다" }, { status: 500 })
    }

    return NextResponse.json(data[0], { status: 201 })
  } catch (error: any) {
    console.error("[v0] Question create error:", error)
    return NextResponse.json({ error: error.message || "질문 등록에 실패했습니다" }, { status: 500 })
  }
}
