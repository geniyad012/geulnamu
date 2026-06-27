import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 날짜 포맷팅 함수
export function formatDate(date: Date, format: "date" | "time" | "datetime" = "datetime"): string {
  if (format === "date") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
  } else if (format === "time") {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
  } else {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
  }
}

// 오늘 날짜인지 확인하는 함수
export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

// QR 코드 생성 함수 (실제 구현은 프론트엔드 라이브러리 사용 필요)
export function generateQrCodeUrl(eventId: string, userId: string): string {
  const data = `글나무-${eventId}-${userId}`
  // 실제 구현에서는 QR 코드 생성 라이브러리 사용
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`
}
