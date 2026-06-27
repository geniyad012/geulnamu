"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Camera, CheckCircle2, XCircle, User, Clock, QrCode, Phone, BookOpen } from 'lucide-react'
import Link from "next/link"
import QrScanner from "@/components/qr-scanner"
import { saveAttendance } from "@/lib/attendance"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ScanPage() {
  const router = useRouter()
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; isLate?: boolean } | null>(null)
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
  const [showLatePopup, setShowLatePopup] = useState(false)
  const [lateStats, setLateStats] = useState<{
    lateCount: number
    totalCount: number
    year: number
    quarter: number
  } | null>(null)

  const bookGenres = ["소설", "시/에세이", "자기계발", "경제/경영", "역사", "과학", "철학", "예술", "종교", "기타"]

  const handleScan = async (decodedText: string) => {
    try {
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

      setNameError(false)
      setPhoneError(false)
      setGenreError(false)
      setIsSubmitting(true)
      setIsLoading(true)

      let eventId: string
      let userId: string

      if (decodedText.startsWith("http")) {
        try {
          const url = new URL(decodedText)
          eventId = url.searchParams.get("event") || "기본이벤트"
          userId = url.searchParams.get("code") || ""

          if (!userId) {
            setScanResult({
              success: false,
              message: "유효하지 않은 QR 코드입니다.",
            })
            setIsSubmitting(false)
            setIsLoading(false)
            return
          }
        } catch (error) {
          setScanResult({
            success: false,
            message: "QR 코드 형식이 올바르지 않습니다.",
          })
          setIsSubmitting(false)
          setIsLoading(false)
          return
        }
      } else if (decodedText.startsWith("글나무-")) {
        const parts = decodedText.split("-")
        if (parts.length !== 3) {
          setScanResult({
            success: false,
            message: "QR 코드 형식이 올바르지 않습니다.",
          })
          setIsSubmitting(false)
          setIsLoading(false)
          return
        }

        eventId = parts[1]
        userId = parts[2]
      } else {
        setScanResult({
          success: false,
          message: "유효하지 않은 QR 코드입니다.",
        })
        setIsSubmitting(false)
        setIsLoading(false)
        return
      }

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

        setScanResult({
          success: true,
          message: `${userName}님, 출석이 성공적으로 등록되었습니다!`,
          isLate: isLate,
        })

        if (isLate) {
          setShowLatePopup(true)
        }
      } else {
        setScanResult({
          success: false,
          message: result.error || "출석 등록 중 오류가 발생했습니다.",
        })
      }
    } catch (error) {
      setScanResult({
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
        <div className="px-4 py-4 flex items-center justify-between">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </Link>
          <h1 className="text-xl font-bold text-green-600">QR 스캔</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <div className="px-4 py-6">
        <Card className="border-0 shadow-lg rounded-2xl">
          <CardHeader className="bg-gradient-to-br from-green-50 to-blue-50 rounded-t-2xl">
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Camera className="h-5 w-5" />
              QR 코드 스캔
            </CardTitle>
            <CardDescription>카메라로 QR 코드를 스캔하여 출석체크하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
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
                disabled={isSubmitting || !!scanResult}
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
                disabled={isSubmitting || !!scanResult}
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
                disabled={isSubmitting || !!scanResult}
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

            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <input
                  type="checkbox"
                  id="first-time"
                  checked={isFirstTime}
                  onChange={(e) => setIsFirstTime(e.target.checked)}
                  disabled={isSubmitting || !!scanResult}
                  className="w-5 h-5 text-green-600 bg-white border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                />
                <Label htmlFor="first-time" className="text-base font-medium text-gray-700 cursor-pointer flex-1">
                  정기모임에 처음 참여해요
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-xl border border-purple-200">
                <input
                  type="checkbox"
                  id="reading-only"
                  checked={readingOnly}
                  onChange={(e) => setReadingOnly(e.target.checked)}
                  disabled={isSubmitting || !!scanResult}
                  className="w-5 h-5 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                />
                <Label htmlFor="reading-only" className="text-base font-medium text-gray-700 cursor-pointer flex-1">
                  독서만 할게요 (조편성 제외)
                </Label>
              </div>
            </div>

            {isLoading ? (
              <div className="bg-white p-8 rounded-2xl border-2 border-green-500 shadow-lg text-center">
                <div className="flex justify-center mb-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
                <h3 className="text-xl font-bold text-center text-green-700 mb-2">로딩 중...</h3>
                <p className="text-gray-600">출석을 처리하고 있습니다</p>
              </div>
            ) : scanResult ? (
              scanResult.success ? (
                <div className="bg-white p-6 rounded-2xl border-2 border-green-500 shadow-lg text-center">
                  <div className="flex justify-center mb-4">
                    <div className="rounded-full bg-green-100 p-3">
                      <CheckCircle2 className="h-12 w-12 text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-center text-green-700 mb-2">출석 완료!</h3>

                  {scanResult.isLate ? (
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

                  <p className="text-gray-600 mb-6">{scanResult.message}</p>
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
                  <AlertDescription>{scanResult.message}</AlertDescription>
                </Alert>
              )
            ) : (
              <>
                {scanning ? (
                  <div className="aspect-square w-full overflow-hidden rounded-2xl border-2 border-gray-200">
                    <QrScanner onScan={handleScan} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-2xl">
                    <Camera className="h-16 w-16 text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-4">카메라를 활성화하여 QR 코드를 스캔하세요</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
          <CardFooter className="flex gap-2 pt-4">
            {!scanResult && (
              <Button
                className={`w-full rounded-xl font-semibold ${scanning ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
                onClick={() => {
                  if (!scanning) {
                    let hasError = false
                    if (!userName.trim()) {
                      setNameError(true)
                      hasError = true
                    }
                    if (!phoneLast4.trim() || phoneLast4.length !== 4) {
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
                  }
                  setScanning(!scanning)
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "처리 중..." : scanning ? "스캔 중지" : "스캔 시작"}
              </Button>
            )}
            {scanResult && !scanResult.success && (
              <Button
                className="w-full bg-green-600 hover:bg-green-700 rounded-xl font-semibold"
                onClick={() => {
                  setScanResult(null)
                  setScanning(false)
                }}
              >
                다시 시도
              </Button>
            )}
          </CardFooter>
        </Card>
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

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="max-w-[430px] mx-auto flex items-center justify-center">
          <Link href="/scan" className="flex flex-col items-center py-4 text-green-600 hover:text-green-700">
            <QrCode className="h-8 w-8" />
            <span className="text-sm mt-2 font-medium">출석</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
