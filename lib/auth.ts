// 간단한 인증 로직을 위한 파일
// 실제 프로덕션 환경에서는 더 안전한 인증 방식을 사용해야 합니다

// 관리자 계정 정보 (실제 프로덕션에서는 환경 변수나 데이터베이스에서 관리)
const ADMIN_USERNAME = "geniyad012"
const ADMIN_PASSWORD = "895959"

// 로그인 함수
export function login(username: string, password: string): boolean {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // 로그인 성공 시 localStorage에 토큰 저장
    if (typeof window !== "undefined") {
      localStorage.setItem("adminToken", generateToken())
      localStorage.setItem("adminLoginTime", Date.now().toString())
    }
    return true
  }
  return false
}

// 로그아웃 함수
export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("adminToken")
    localStorage.removeItem("adminLoginTime")
  }
}

// 로그인 상태 확인 함수
export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false

  const token = localStorage.getItem("adminToken")
  const loginTime = localStorage.getItem("adminLoginTime")

  if (!token || !loginTime) return false

  // 로그인 후 24시간이 지나면 자동 로그아웃
  const now = Date.now()
  const loginTimeNum = Number.parseInt(loginTime, 10)
  const expirationTime = 24 * 60 * 60 * 1000 // 24시간

  if (now - loginTimeNum > expirationTime) {
    logout()
    return false
  }

  return true
}

// 간단한 토큰 생성 함수
function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}
