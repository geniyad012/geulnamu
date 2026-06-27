import { createClient } from "./supabase/client"

export type ExpectedAttendee = {
  id: string
  name: string
  eventId: string
  createdAt: string
}

// 예상 참석자 추가
export async function addExpectedAttendee(
  name: string,
  eventId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const { error } = await supabase.from("expected_attendees").insert({
      name,
      event_id: eventId,
    })

    if (error) {
      console.error("예상 참석자 추가 오류:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("예상 참석자 추가 중 예외 발생:", error)
    return { success: false, error: "서버 오류가 발생했습니다." }
  }
}

// 예상 참석자 목록 가져오기
export async function getExpectedAttendees(eventId: string): Promise<ExpectedAttendee[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("expected_attendees")
      .select("*")
      .eq("event_id", eventId)
      .order("name", { ascending: true })

    if (error) {
      console.error("예상 참석자 목록 조회 오류:", error)
      return []
    }

    return (data || []).map((item) => ({
      id: item.id,
      name: item.name,
      eventId: item.event_id,
      createdAt: item.created_at,
    }))
  } catch (error) {
    console.error("예상 참석자 목록 조회 중 예외 발생:", error)
    return []
  }
}

// 예상 참석자 삭제
export async function deleteExpectedAttendee(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const { error } = await supabase.from("expected_attendees").delete().eq("id", id)

    if (error) {
      console.error("예상 참석자 삭제 오류:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("예상 참석자 삭제 중 예외 발생:", error)
    return { success: false, error: "서버 오류가 발생했습니다." }
  }
}

// 예상 참석자 일괄 추가 (여러 이름을 한 번에 추가)
export async function addMultipleExpectedAttendees(
  names: string[],
  eventId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    // 중복 이름 제거 및 빈 문자열 제거
    const uniqueNames = [...new Set(names.filter((name) => name.trim() !== ""))]

    if (uniqueNames.length === 0) {
      return { success: false, error: "유효한 이름이 없습니다." }
    }

    const { error } = await supabase.from("expected_attendees").insert(
      uniqueNames.map((name) => ({
        name: name.trim(),
        event_id: eventId,
      })),
    )

    if (error) {
      console.error("예상 참석자 일괄 추가 오류:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("예상 참석자 일괄 추가 중 예외 발생:", error)
    return { success: false, error: "서버 오류가 발생했습니다." }
  }
}

// 미출석자 목록 가져오기 (예상 참석자 중 실제 출석하지 않은 사람들)
export async function getAbsentees(eventId: string, attendances: { name: string }[]): Promise<string[]> {
  try {
    // 예상 참석자 목록 가져오기
    const expectedAttendees = await getExpectedAttendees(eventId)

    // 실제 출석자 이름 목록
    const attendeeNames = attendances.map((a) => a.name.trim().toLowerCase())

    // 예상 참석자 중 출석하지 않은 사람들 필터링
    const absentees = expectedAttendees
      .filter((expected) => !attendeeNames.includes(expected.name.trim().toLowerCase()))
      .map((a) => a.name)

    return absentees
  } catch (error) {
    console.error("미출석자 목록 조회 중 예외 발생:", error)
    return []
  }
}
