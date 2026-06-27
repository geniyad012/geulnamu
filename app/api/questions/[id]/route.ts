import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { password, content } = body

    if (!password || !content) {
      return NextResponse.json({ error: "비밀번호와 질문 내용은 필수입니다" }, { status: 400 })
    }

    const supabase = getSupabase()

    const { data: question, error: fetchError } = await supabase
      .from("questions")
      .select("password")
      .eq("id", params.id)
      .single()

    if (fetchError || !question) {
      return NextResponse.json({ error: "질문을 찾을 수 없습니다" }, { status: 404 })
    }

    if (question.password !== password) {
      return NextResponse.json({ error: "비밀번호가 일치하지 않습니다" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("questions")
      .update({ content })
      .eq("id", params.id)
      .select("id, author_name, content, group_number, question_date, created_at")
      .single()

    if (error) {
      console.error("[v0] Question update error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      id: data.id,
      author_name: data.author_name,
      content: data.content,
      group_number: data.group_number,
      question_date: data.question_date,
      created_at: data.created_at,
    })
  } catch (error: any) {
    console.error("[v0] Question update error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ error: "비밀번호가 필요합니다" }, { status: 400 })
    }

    const supabase = getSupabase()

    const { data: question, error: fetchError } = await supabase
      .from("questions")
      .select("password")
      .eq("id", params.id)
      .single()

    if (fetchError || !question) {
      return NextResponse.json({ error: "질문을 찾을 수 없습니다" }, { status: 404 })
    }

    if (question.password !== password) {
      return NextResponse.json({ error: "비밀번호가 일치하지 않습니다" }, { status: 401 })
    }

    const { error } = await supabase.from("questions").delete().eq("id", params.id)

    if (error) {
      console.error("[v0] Question delete error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Question delete error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
