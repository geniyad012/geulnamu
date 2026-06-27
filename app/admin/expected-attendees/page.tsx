"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, UserPlus, Trash2, Users, RefreshCw, QrCode } from "lucide-react"
import { isLoggedIn } from "@/lib/auth"
import {
  addExpectedAttendee,
  getExpectedAttendees,
  deleteExpectedAttendee,
  addMultipleExpectedAttendees,
  type ExpectedAttendee,
} from "@/lib/expected-attendees"

export default function ExpectedAttendeesPage() {
  const router = useRouter()
  const [eventId, setEventId] = useState("기본이벤트")
  const [newName, setNewName] = useState("")
  const [bulkNames, setBulkNames] = useState("")
  const [expectedAttendees, setExpectedAttendees] = useState<ExpectedAttendee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [addingAttendee, setAddingAttendee] = useState(false)
  const [showBulkAdd, setShowBulkAdd] = useState(false)

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/admin/login")
    } else {
      fetchExpectedAttendees()
    }
  }, [router])

  const fetchExpectedAttendees = async () => {
    try {
      setLoading(true)
      setError(null)
      const attendees = await getExpectedAttendees(eventId)
      setExpectedAttendees(attendees)
    } catch (err) {
      console.error("예상 참석자 목록 로딩 오류:", err)
      setError("예상 참석자 목록을 불러오는 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const handleAddAttendee = async () => {
    if (!newName.trim()) {
      setError("이름을 입력해주세요.")
      return
    }

    try {
      setAddingAttendee(true)
      setError(null)

      const result = await addExpectedAttendee(newName.trim(), eventId)

      if (result.success) {
        setNewName("")
        setSuccessMessage("예상 참석자가 추가되었습니다.")
        fetchExpectedAttendees()

        setTimeout(() => {
          setSuccessMessage(null)
        }, 3000)
      } else {
        setError(result.error || "예상 참석자 추가 중 오류가 발생했습니다.")
      }
    } catch (err) {
      setError("예상 참석자 추가 중 오류가 발생했습니다.")
    } finally {
      setAddingAttendee(false)
    }
  }

  const handleDeleteAttendee = async (id: string) => {
    try {
      setError(null)

      const result = await deleteExpectedAttendee(id)

      if (result.success) {
        setSuccessMessage("예상 참석자가 삭제되었습니다.")
        fetchExpectedAttendees()

        setTimeout(() => {
          setSuccessMessage(null)
        }, 3000)
      } else {
        setError(result.error || "예상 참석자 삭제 중 오류가 발생했습니다.")
      }
    } catch (err) {
      setError("예상 참석자 삭제 중 오류가 발생했습니다.")
    }
  }

  const handleBulkAdd = async () => {
    if (!bulkNames.trim()) {
      setError("이름을 입력해주세요.")
      return
    }

    try {
      setAddingAttendee(true)
      setError(null)

      const names = bulkNames
        .split("\n")
        .map((name) => name.trim())
        .filter((name) => name !== "")

      const result = await addMultipleExpectedAttendees(names, eventId)

      if (result.success) {
        setBulkNames("")
        setSuccessMessage(`${names.length}명의 예상 참석자가 추가되었습니다.`)
        fetchExpectedAttendees()
        setShowBulkAdd(false)

        setTimeout(() => {
          setSuccessMessage(null)
        }, 3000)
      } else {
        setError(result.error || "예상 참석자 일괄 추가 중 오류가 발생했습니다.")
      }
    } catch (err) {
      setError("예상 참석자 일괄 추가 중 오류가 발생했습니다.")
    } finally {
      setAddingAttendee(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/admin/generate-qr" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </Link>
          <h1 className="text-xl font-bold text-green-600">참석자 관리</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl relative mb-4">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-4">
            {error}
          </div>
        )}

        <Card className="border-0 shadow-lg rounded-2xl mb-6">
          <CardHeader className="bg-gradient-to-br from-green-50 to-blue-50 rounded-t-2xl">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              이벤트 선택
            </CardTitle>
            <CardDescription>예상 참석자를 관리할 이벤트를 선택하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-6">
            <Label htmlFor="event-id" className="font-semibold">
              이벤트 ID
            </Label>
            <Input
              id="event-id"
              placeholder="이벤트 ID 입력"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="rounded-xl"
            />
            <p className="text-xs text-gray-500">기본값은 "기본이벤트" 입니다.</p>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-green-600 hover:bg-green-700 rounded-xl font-semibold"
              onClick={fetchExpectedAttendees}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              목록 불러오기
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-0 shadow-lg rounded-2xl mb-6">
          <CardHeader className="bg-gradient-to-br from-green-50 to-blue-50 rounded-t-2xl">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-green-600" />
              참석자 추가
            </CardTitle>
            <CardDescription>이벤트에 참석할 것으로 예상되는 인원을 추가하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {!showBulkAdd ? (
              <div className="space-y-2">
                <Label htmlFor="new-name" className="font-semibold">
                  이름
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="new-name"
                    placeholder="이름 입력"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddAttendee()
                      }
                    }}
                    className="rounded-xl"
                  />
                  <Button
                    className="bg-green-600 hover:bg-green-700 rounded-xl font-semibold"
                    onClick={handleAddAttendee}
                    disabled={addingAttendee}
                  >
                    추가
                  </Button>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-2 rounded-xl bg-transparent hover:bg-gray-100"
                  onClick={() => setShowBulkAdd(true)}
                >
                  여러 명 한번에 추가하기
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="bulk-names" className="font-semibold">
                  여러 이름 (줄바꿈으로 구분)
                </Label>
                <Textarea
                  id="bulk-names"
                  placeholder="홍길동&#10;김철수&#10;이영희"
                  value={bulkNames}
                  onChange={(e) => setBulkNames(e.target.value)}
                  className="min-h-[120px] rounded-xl"
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl bg-transparent hover:bg-gray-100"
                    onClick={() => setShowBulkAdd(false)}
                  >
                    취소
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 rounded-xl font-semibold"
                    onClick={handleBulkAdd}
                    disabled={addingAttendee}
                  >
                    일괄 추가
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg rounded-2xl">
          <CardHeader className="bg-gradient-to-br from-green-50 to-blue-50 rounded-t-2xl">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              참석자 목록
            </CardTitle>
            <CardDescription>총 {expectedAttendees.length}명의 예상 참석자가 등록되어 있습니다</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
              </div>
            ) : expectedAttendees.length === 0 ? (
              <p className="text-gray-500 text-center py-4">등록된 예상 참석자가 없습니다</p>
            ) : (
              <div className="space-y-2">
                {expectedAttendees.map((attendee) => (
                  <div
                    key={attendee.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <p className="font-medium text-gray-900">{attendee.name}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteAttendee(attendee.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
