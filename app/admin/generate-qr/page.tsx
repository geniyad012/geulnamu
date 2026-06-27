"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, QrCode, Download, LogOut, RefreshCw, Users, Calendar, Upload } from "lucide-react"
import { isLoggedIn, logout } from "@/lib/auth"
import { updateFeaturedBook } from "@/lib/featured-book"

export default function AdminGenerateQrPage() {
  const router = useRouter()
  const [eventName, setEventName] = useState("정기모임")
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)

  const [bookTitle, setBookTitle] = useState("")
  const [bookImage, setBookImage] = useState<File | null>(null)
  const [bookImagePreview, setBookImagePreview] = useState<string | null>(null)
  const [uploadingBook, setUploadingBook] = useState(false)
  const [bookMessage, setBookMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/admin/login")
    } else {
      generateQrCode()
    }
  }, [router])

  const generateQrCode = () => {
    const timestamp = Date.now()
    const uniqueId = `${timestamp}`
    const checkInUrl = `https://geulnamu.vercel.app/check-in?event=${encodeURIComponent(eventName)}&code=${uniqueId}`
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(checkInUrl)}`
    setQrCodeUrl(url)
  }

  const handleDownload = () => {
    if (!qrCodeUrl) return

    const finalEventName = eventName.trim() || "정기모임"
    const link = document.createElement("a")
    link.href = qrCodeUrl
    link.download = `qrcode-${finalEventName}-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleBookImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBookImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setBookImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmitFeaturedBook = async () => {
    if (!bookTitle.trim()) {
      setBookMessage({ type: "error", text: "책 제목을 입력해주세요." })
      return
    }

    if (!bookImagePreview) {
      setBookMessage({ type: "error", text: "사진을 선택해주세요." })
      return
    }

    try {
      setUploadingBook(true)
      setBookMessage(null)

      const result = await updateFeaturedBook(bookImagePreview, bookTitle)

      if (result.success) {
        setBookMessage({ type: "success", text: "이달의 지정독서가 업데이트되었습니다!" })
        setBookTitle("")
        setBookImage(null)
        setBookImagePreview(null)

        setTimeout(() => {
          setBookMessage(null)
        }, 3000)
      } else {
        setBookMessage({ type: "error", text: result.error || "업로드 중 오류가 발생했습니다." })
      }
    } catch (error) {
      setBookMessage({ type: "error", text: "업로드 중 오류가 발생했습니다." })
    } finally {
      setUploadingBook(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="px-4 py-4 flex items-center justify-between">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </Link>
          <h1 className="text-xl font-bold text-green-600">QR 생성</h1>
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-500" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="px-4 py-6">
        <Card className="border-0 shadow-lg rounded-2xl mb-6">
          <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-t-2xl">
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Upload className="h-5 w-5" />
              이달의 지정독서
            </CardTitle>
            <CardDescription>책 제목과 사진을 업로드하면 홈페이지에 자동으로 표시됩니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {bookMessage && (
              <div
                className={`p-3 rounded-lg text-sm font-medium ${
                  bookMessage.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {bookMessage.text}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="book-title" className="font-semibold">
                책 제목
              </Label>
              <Input
                id="book-title"
                placeholder="예: 인간 실격"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="book-image" className="font-semibold">
                책 표지 사진
              </Label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-green-500 transition-colors">
                <input
                  id="book-image"
                  type="file"
                  accept="image/*"
                  onChange={handleBookImageChange}
                  className="hidden"
                />
                <label htmlFor="book-image" className="cursor-pointer">
                  {bookImagePreview ? (
                    <div className="space-y-2">
                      <img
                        src={bookImagePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-64 object-contain rounded-lg"
                      />
                      <p className="text-sm text-gray-600">클릭하여 다른 이미지 선택</p>
                    </div>
                  ) : (
                    <div className="space-y-2 py-8">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                      <p className="text-sm text-gray-600">클릭하여 책 표지 이미지 선택</p>
                      <p className="text-xs text-gray-500">책 표지가 히어로 섹션에 표시됩니다</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold"
              onClick={handleSubmitFeaturedBook}
              disabled={uploadingBook}
            >
              {uploadingBook ? "업로드 중..." : "업로드"}
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-0 shadow-lg rounded-2xl mb-6">
          <CardHeader className="bg-gradient-to-br from-green-50 to-blue-50 rounded-t-2xl">
            <CardTitle className="flex items-center gap-2 text-green-700">
              <QrCode className="h-5 w-5" />
              QR 코드 생성
            </CardTitle>
            <CardDescription>출석체크용 QR 코드를 생성합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="event-name" className="font-semibold">
                이벤트 이름 (선택사항)
              </Label>
              <Input
                id="event-name"
                placeholder="이벤트 이름을 입력하세요"
                value={eventName}
                onChange={(e) => setEventName(e.target.value || "정기모임")}
                className="rounded-xl"
              />
              <p className="text-xs text-gray-500">이벤트 이름을 입력하지 않으면 '정기모임'으로 설정됩니다.</p>
            </div>

            {qrCodeUrl && (
              <div className="flex flex-col items-center mt-4">
                <img
                  src={qrCodeUrl || "/placeholder.svg"}
                  alt="생성된 QR 코드"
                  className="w-48 h-48 border-2 border-gray-200 rounded-2xl"
                />
                <p className="text-sm text-center mt-3 text-gray-600">이 QR 코드를 스캔하여 출석을 등록하세요</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 rounded-xl font-semibold"
              onClick={generateQrCode}
            >
              <RefreshCw className="mr-2 h-4 w-4" />새 QR 코드
            </Button>

            {qrCodeUrl && (
              <Button
                variant="outline"
                className="flex-1 border-green-600 text-green-600 hover:bg-green-50 rounded-xl font-semibold bg-transparent"
                onClick={handleDownload}
              >
                <Download className="mr-2 h-4 w-4" />
                다운로드
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card className="border-0 shadow-lg rounded-2xl">
          <CardHeader className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-t-2xl">
            <CardTitle className="text-lg">관리자 메뉴</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            <Link href="/admin/expected-attendees" className="w-full">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2 mb-2 rounded-xl hover:bg-green-50 bg-transparent"
              >
                <Users className="h-4 w-4" />
                예상 참석자 관리
              </Button>
            </Link>

            <Link href="/admin/attendance-records" className="w-full">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2 mb-2 rounded-xl hover:bg-green-50 bg-transparent"
              >
                <Calendar className="h-4 w-4" />
                출석 기록 관리
              </Button>
            </Link>

            <Link href="/admin/group-assignment" className="w-full">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2 rounded-xl hover:bg-green-50 bg-transparent"
              >
                <Users className="h-4 w-4" />
                조편성 관리
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

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
