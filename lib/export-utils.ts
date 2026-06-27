import type { Attendance } from "./attendance"
import { formatDate } from "./utils"

// 출석 데이터를 CSV 문자열로 변환
export function convertAttendancesToCSV(attendances: Attendance[]): string {
  // CSV 헤더 (지각 여부 추가)
  const headers = ["이름", "날짜", "시간", "이벤트ID", "상태"]

  // 데이터 행 생성
  const rows = attendances.map((attendance) => {
    const date = new Date(attendance.timestamp)
    return [
      attendance.name,
      formatDate(date, "date"),
      formatDate(date, "time"),
      attendance.eventId,
      attendance.isLate ? "지각" : "출석",
    ]
  })

  // 헤더와 행을 합쳐서 CSV 문자열 생성
  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

  return csvContent
}

// CSV 문자열을 다운로드 가능한 파일로 변환
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 출석 데이터를 클립보드에 복사 (엑셀에 붙여넣기 가능한 형식)
export function copyToClipboard(attendances: Attendance[]): Promise<boolean> {
  try {
    // 엑셀에 붙여넣기 가능한 탭 구분 텍스트 형식으로 변환
    const headers = ["이름", "날짜", "시간", "이벤트ID", "상태"]

    const rows = attendances.map((attendance) => {
      const date = new Date(attendance.timestamp)
      return [
        attendance.name,
        formatDate(date, "date"),
        formatDate(date, "time"),
        attendance.eventId,
        attendance.isLate ? "지각" : "출석",
      ]
    })

    const tsvContent = [headers.join("\t"), ...rows.map((row) => row.join("\t"))].join("\n")

    // 클립보드에 복사
    return navigator.clipboard
      .writeText(tsvContent)
      .then(() => true)
      .catch((err) => {
        console.error("클립보드 복사 오류:", err)
        return false
      })
  } catch (error) {
    console.error("클립보드 복사 중 예외 발생:", error)
    return Promise.resolve(false)
  }
}
