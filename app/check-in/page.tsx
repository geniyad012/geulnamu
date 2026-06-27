"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, XCircle, User, Clock, QrCode, Phone, BookOpen } from 'lucide-react'
import Link from "next/link"
import { saveAttendance } from "@/lib/attendance"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function CheckInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userName, setUserName] = useState("")
  const [phoneLast4, setPhoneLast4] = useState("")
  const [bookGenre, setBookGenre] = useState("")
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [readingOnly, setReadingOnly] = useState(false)
  const [nameError, setNameError] = useState(false)
  const [phoneError, setPhoneError] = useState(false)
  const [genreError, setGenreError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string; isLate?: boolean } | null>(null)
  const [showLatePopup, setShowLatePopup] = useState(false)
  const [lateStats, setLateStats] = useState<{
    lateCount: number
    totalCount: number
    year: number
    quarter: number
  } | null>(null)

  const eventId = searchParams.get("event") || "기본이벤트"
  const userId = searchParams.get("code") || ""

  const bookGenres = ["소설", "시/에세이", "자기계발", "경제/경영", "역사", "과학", "철학", "예술", "종교", "기타"]

  useEffect(() => {
    if (!userId) {
      setSubmitResult({
        success: false,
        message: "유효하지 않은 QR 코드입니다.",
      })
    }
  }, [userId])

  const handleSubmit = async () => {
    let hasError = false

    if (!userName.trim()) {
      setNameError(true)
      hasError = true
    }

    if (!phoneLast4.trim() || phoneLast4.length !== 4 || !/^\d{4}$/.test(phoneLast4)) {
      setPhoneError(true)
      hasError = true
    }

    if (!bookGenre) {
      setGenreError(true)
      hasError = true
    }

    if (hasError) {
      return
    }

    if (!userId) {
      setSubmitResult({
        success: false,
        message: "유효하지 않은 QR 코드입니다.",
      })
      return
    }

    setNameError(false)
    setPhoneError(false)
    setGenreError(false)
    setIsSubmitting(true)
    setIsLoading(true)

    try {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const isLate = currentHour > 10 || (currentHour === 10 && currentMinute >= 45)

      const result = await saveAttendance({
        eventId,
        userId,
        name: userName.trim(),
        phoneLast4: phoneLast4.trim(),
        bookGenre: bookGenre,
        isFirstTime: isFirstTime,
        readingOnly: readingOnly,
      })

      if (result.success) {
        if (isLate) {
          try {
            const countResponse = await fetch(
              `/api/late-count?name=${encodeURIComponent(userName.trim())}&phone_last4=${encodeURIComponent(phoneLast4.trim())}`,
            )
            if (countResponse.ok) {
              const countData = await countResponse.json()
              setLateStats(countData)
            }
          } catch (error) {
            console.error("[v0] Error fetching late count:", error)
          }
        }

        setSubmitResult({
          success: true,
          message: `${userName}님, 출석이 성공적으로 등록되었습니다!`,
          isLate: isLate,
        })

        if (isLate) {
          setShowLatePopup(true)
        }
      } else {
        setSubmitResult({
          success: false,
          message: result.error || "출석 등록 중 오류가 발생했습니다.",
        })
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        message: "오류가 발생했습니다. 다시 시도해주세요.",
      })
    } finally {
      setIsLoading(false)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="px-4 py-4 flex items-center justify-center">
          <h1 className="text-xl font-bold text-green-600">출석 체크</h1>
        </div>
      </header>

      <div className="px-4 py-6">
        <Card className="border-0 shadow-lg rounded-2xl">
          <CardHeader className="bg-gradient-to-br from-green-50 to-blue-50 rounded-t-2xl">
            <CardTitle className="flex items-center gap-2 text-green-700">
              <QrCode className="h-5 w-5" />
              글나무 출석 체크
            </CardTitle>
            <CardDescription>이름을 입력하고 출석을 완료하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {!userId ? (
              <Alert className="bg-red-50 border-red-200">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertTitle>오류!</AlertTitle>
                <AlertDescription>유효하지 않은 QR 코드입니다.</AlertDescription>
              </Alert>
            ) : isLoading ? (
              <div className="bg-white p-8 rounded-2xl border-2 border-green-500 shadow-lg text-center">
                <div className="flex justify-center mb-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
                <h3 className="text-xl font-bold text-center text-green-700 mb-2">로딩 중...</h3>
                <p className="text-gray-600">출석을 처리하고 있습니다</p>
              </div>
            ) : submitResult ? (
              submitResult.success ? (
                <div className="bg-white p-6 rounded-2xl border-2 border-green-500 shadow-lg text-center">
                  <div className="flex justify-center mb-4">
                    <div className="rounded-full bg-green-100 p-3">
                      <CheckCircle2 className="h-12 w-12 text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-center text-green-700 mb-2">출석 완료!</h3>

                  {submitResult.isLate ? (
                    <div className="mb-4">
                      <Badge
                        variant="outline"
                        className="bg-amber-50 text-amber-600 border-amber-200 text-sm px-2 py-1"
                      >
                        지각 처리되었습니다 (10:45 이후 출석)
                      </Badge>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-600 border-green-200 text-sm px-2 py-1"
                      >
                        출석
                      </Badge>
                    </div>
                  )}

                  <p className="text-gray-600 mb-6">{submitResult.message}</p>
                  <Button
                    className="bg-green-600 hover:bg-green-700 w-full rounded-xl"
                    onClick={() => router.push("/status")}
                  >
                    출석 현황 보기
                  </Button>
                </div>
              ) : (
                <Alert className="bg-red-50 border-red-200">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertTitle>오류!</AlertTitle>
                  <AlertDescription>{submitResult.message}</AlertDescription>
                </Alert>
              )
            ) : (
              <>
                <Alert className="bg-amber-50 border-amber-200">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <AlertTitle>출석 안내</AlertTitle>
                  <AlertDescription>오전 10시 45분 이후 출석은 지각으로 처리됩니다.</AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="user-name" className="flex items-center gap-1 font-semibold">
                    <User className="h-4 w-4" />
                    이름
                  </Label>
                  <Input
                    id="user-name"
                    placeholder="이름을 입력하세요"
                    value={userName}
                    onChange={(e) => {
                      setUserName(e.target.value)
                      setNameError(false)
                    }}
                    className={`rounded-xl ${nameError ? "border-red-500" : ""}`}
                    disabled={isSubmitting}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSubmit()
                      }
                    }}
                  />
                  {nameError && <p className="text-red-500 text-sm">이름을 입력해주세요.</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone-last4" className="flex items-center gap-1 font-semibold">
                    <Phone className="h-4 w-4" />
                    휴대폰 번호 뒷자리 4자리
                  </Label>
                  <Input
                    id="phone-last4"
                    placeholder="예: 1234"
                    value={phoneLast4}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 4)
                      setPhoneLast4(value)
                      setPhoneError(false)
                    }}
                    className={`rounded-xl ${phoneError ? "border-red-500" : ""}`}
                    disabled={isSubmitting}
                    maxLength={4}
                    inputMode="numeric"
                  />
                  {phoneError && <p className="text-red-500 text-sm">휴대폰 번호 뒷자리 4자리를 입력해주세요.</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="book-genre" className="flex items-center gap-1 font-semibold">
                    <BookOpen className="h-4 w-4" />
                    오늘 가져온 책 분야
                  </Label>
                  <Select
                    value={bookGenre}
                    onValueChange={(value) => {
                      setBookGenre(value)
                      setGenreError(false)
                    }}
                  >
                    <SelectTrigger className={`rounded-xl ${genreError ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="책 분야를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {bookGenres.map((genre) => (
                        <SelectItem key={genre} value={genre}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {genreError && <p className="text-red-500 text-sm">책 분야를 선택해주세요.</p>}
                </div>

                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-xl">
                  <input
                    type="checkbox"
                    id="first-time"
                    checked={isFirstTime}
                    onChange={(e) => setIsFirstTime(e.target.checked)}
                    className="w-4 h-4 text-green-600 bg-white border-gray-300 rounded focus:ring-green-500"
                  />
                  <Label htmlFor="first-time" className="text-sm font-medium text-gray-700 cursor-pointer">
                    정기모임에 처음 참여해요
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-xl">
                  <input
                    type="checkbox"
                    id="reading-only"
                    checked={readingOnly}
                    onChange={(e) => setReadingOnly(e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500"
                  />
                  <Label htmlFor="reading-only" className="text-sm font-medium text-gray-700 cursor-pointer">
                    독서만 할게요 (조편성 제외)
                  </Label>
                </div>
              </>
            )}
          </CardContent>
          {!submitResult && userId && (
            <CardFooter className="pt-4">
              <Button
                className="w-full bg-green-600 hover:bg-green-700 rounded-xl font-semibold"
                onClick={handleSubmit}
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting || isLoading ? "처리 중..." : "출석 완료"}
              </Button>
            </CardFooter>
          )}
          {submitResult && !submitResult.success && (
            <CardFooter className="pt-4">
              <Button
                className="w-full bg-green-600 hover:bg-green-700 rounded-xl font-semibold"
                onClick={() => {
                  setSubmitResult(null)
                  setUserName("")
                  setPhoneLast4("")
                  setBookGenre("")
                }}
              >
                다시 시도
              </Button>
            </CardFooter>
          )}
        </Card>

        <div className="mt-6 text-center">
          <Link href="/" className="text-green-600 hover:text-green-700 text-sm font-medium">
            홈으로 돌아가기
          </Link>
        </div>
      </div>

      <Dialog open={showLatePopup} onOpenChange={setShowLatePopup}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-gray-900">지각 안내</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center space-y-4">
            <p className="text-lg text-gray-700">
              다음 모임에는 지각하지 말아주세요..!
              <br />
              부탁드립니다!
            </p>
            {lateStats && (
              <p className="text-red-600 font-semibold text-lg">
                {lateStats.year}년 {lateStats.quarter}분기 지각횟수: {lateStats.lateCount}회 ({lateStats.totalCount}회
                중)
              </p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowLatePopup(false)} className="w-full bg-green-600 hover:bg-green-700">
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function CheckInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      }
    >
      <CheckInContent />
    </Suspense>
  )
}
