import { createClient } from "./supabase/client"

export type Attendance = {
  id: string
  name: string
  eventId: string
  userId: string
  timestamp: string
  isLate: boolean
  phoneLast4?: string
  bookGenre?: string
  isFirstTime?: boolean
  readingOnly?: boolean
}

// 데이터베이스에 출석 정보 저장
export async function saveAttendance(
  attendance: Omit<Attendance, "id" | "timestamp" | "isLate"> & {
    phoneLast4?: string
    bookGenre?: string
    isFirstTime?: boolean
    readingOnly?: boolean
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const isLate = currentHour > 10 || (currentHour === 10 && currentMinute >= 45)

    const { data, error } = await supabase
      .from("attendances")
      .insert({
        name: attendance.name,
        event_id: attendance.eventId,
        user_id: attendance.userId,
        is_late: isLate,
        phone_last4: attendance.phoneLast4,
        book_genre: attendance.bookGenre,
        is_first_time: attendance.isFirstTime || false,
        reading_only: attendance.readingOnly || false,
      })
      .select()

    if (error) {
      console.error("출석 저장 오류:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("출석 저장 중 예외 발생:", error)
    return { success: false, error: "서버 오류가 발생했습니다." }
  }
}

// 데이터베이스에서 오늘의 출석 목록 가져오기
export async function getTodayAttendances(): Promise<Attendance[]> {
  try {
    const supabase = createClient()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data, error } = await supabase
      .from("attendances")
      .select("*")
      .gte("created_at", today.toISOString())
      .lt("created_at", tomorrow.toISOString())
      .order("created_at", { ascending: false })

    if (error) {
      console.error("출석 목록 조회 오류:", error)
      return []
    }

    return (data || []).map((item) => ({
      id: item.id,
      name: item.name,
      eventId: item.event_id,
      userId: item.user_id,
      timestamp: item.created_at,
      isLate: item.is_late || false,
      phoneLast4: item.phone_last4,
      bookGenre: item.book_genre,
      isFirstTime: item.is_first_time || false,
      readingOnly: item.reading_only || false,
    }))
  } catch (error) {
    console.error("출석 목록 조회 중 예외 발생:", error)
    return []
  }
}

// 특정 이벤트의 출석 목록 가져오기
export async function getAttendancesByEvent(eventId: string): Promise<Attendance[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("attendances")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("이벤트별 출석 목록 조회 오류:", error)
      return []
    }

    return (data || []).map((item) => ({
      id: item.id,
      name: item.name,
      eventId: item.event_id,
      userId: item.user_id,
      timestamp: item.created_at,
      isLate: item.is_late || false,
      phoneLast4: item.phone_last4,
      bookGenre: item.book_genre,
      isFirstTime: item.is_first_time || false,
      readingOnly: item.reading_only || false,
    }))
  } catch (error) {
    console.error("이벤트별 출석 목록 조회 중 예외 발생:", error)
    return []
  }
}

// 모든 출석 목록 가져오기
export async function getAllAttendances(): Promise<Attendance[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("attendances").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("전체 출석 목록 조회 오류:", error)
      return []
    }

    return (data || []).map((item) => ({
      id: item.id,
      name: item.name,
      eventId: item.event_id,
      userId: item.user_id,
      timestamp: item.created_at,
      isLate: item.is_late || false,
      phoneLast4: item.phone_last4,
      bookGenre: item.book_genre,
      isFirstTime: item.is_first_time || false,
      readingOnly: item.reading_only || false,
    }))
  } catch (error) {
    console.error("전체 출석 목록 조회 중 예외 발생:", error)
    return []
  }
}

// 출석 기록 삭제하기
export async function deleteAttendance(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("출석 기록 삭제 시도:", id)
    const supabase = createClient()

    const { error } = await supabase.from("attendances").delete().eq("id", id)

    if (error) {
      console.error("출석 삭제 오류:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("출석 삭제 중 예외 발생:", error)
    return { success: false, error: "서버 오류가 발생했습니다." }
  }
}

// 여러 출석 기록 삭제하기
export async function deleteMultipleAttendances(ids: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("여러 출석 기록 삭제 시도:", ids)
    const supabase = createClient()

    const { error } = await supabase.from("attendances").delete().in("id", ids)

    if (error) {
      console.error("여러 출석 삭제 오류:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("여러 출석 삭제 중 예외 발생:", error)
    return { success: false, error: "서버 오류가 발생했습니다." }
  }
}
