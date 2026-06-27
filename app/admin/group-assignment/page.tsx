"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Users, RefreshCw, QrCode, Shuffle } from "lucide-react"
import { isLoggedIn } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"

type GroupMember = {
  id?: string
  event_id: string
  member_name: string
  phone_last4: string
  group_number: number
  is_published: boolean
  created_at?: string
  updated_at?: string
  book_genre?: string
  is_first_time: boolean
}

type Group = {
  groupNumber: number
  members: GroupMember[]
}

export default function GroupAssignmentPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [groupSize, setGroupSize] = useState(6)
  const [attendanceCount, setAttendanceCount] = useState(0)
  const [firstTimerCount, setFirstTimerCount] = useState(0)

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/admin/login")
    } else {
      loadGroups()
    }
  }, [router])

  const loadGroups = async () => {
    try {
      setLoading(true)
      console.log("[v0] Loading groups for today")

      const response = await fetch("/api/groups?eventId=기본이벤트")

      if (!response.ok) {
        throw new Error("조 데이터를 불러오는데 실패했습니다")
      }

      const data = await response.json()
      console.log("[v0] Loaded groups:", data)

      if (data.groups && data.groups.length > 0) {
        // 데이터를 조별로 그룹화
        const groupedData: { [key: number]: GroupMember[] } = {}

        data.groups.forEach((member: GroupMember) => {
          if (!groupedData[member.group_number]) {
            groupedData[member.group_number] = []
          }
          groupedData[member.group_number].push(member)
        })

        const formattedGroups: Group[] = Object.entries(groupedData)
          .map(([groupNumber, members]) => ({
            groupNumber: Number.parseInt(groupNumber),
            members: members,
          }))
          .sort((a, b) => a.groupNumber - b.groupNumber)

        setGroups(formattedGroups)

        // 통계 계산
        const total = data.groups.length
        const firstTimers = data.groups.filter((m: GroupMember) => m.is_first_time).length
        setAttendanceCount(total)
        setFirstTimerCount(firstTimers)
      } else {
        setGroups([])
        setAttendanceCount(0)
        setFirstTimerCount(0)
      }
    } catch (err) {
      console.error("[v0] Error loading groups:", err)
      setError("조 데이터를 불러오는 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const generateGroups = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("[v0] Calling generate groups API for today's attendees, groupSize:", groupSize)

      const response = await fetch("/api/groups/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: "기본이벤트",
          groupSize: groupSize,
        }),
      })

      if (!response.ok) {
        throw new Error("조 편성에 실패했습니다")
      }

      const result = await response.json()
      console.log("[v0] Generate groups response:", result)

      if (result.success) {
        // 조 편성 후 다시 불러오기
        await loadGroups()
      } else {
        throw new Error(result.error || "조 편성에 실패했습니다")
      }
    } catch (err) {
      console.error("[v0] Error generating groups:", err)
      setError(err instanceof Error ? err.message : "조 편성 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/admin/generate-qr" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </Link>
          <h1 className="text-xl font-bold text-green-600">조편성</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-4">
            {error}
          </div>
        )}

        <Card className="border-0 shadow-lg rounded-2xl mb-6">
          <CardHeader className="bg-gradient-to-br from-green-50 to-blue-50 rounded-t-2xl">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              조편성 설정
            </CardTitle>
            <CardDescription>오늘 출석한 인원을 조로 나눕니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600 font-medium">총 출석</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{attendanceCount}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-gray-600 font-medium">처음 참여</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{firstTimerCount}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl">
                <p className="text-sm text-gray-600 font-medium">기존 멤버</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{attendanceCount - firstTimerCount}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">조당 인원 (권장)</label>
              <div className="flex gap-2">
                {[4, 5, 6, 7, 8].map((size) => (
                  <button
                    key={size}
                    onClick={() => setGroupSize(size)}
                    className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                      groupSize === size ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {size}명
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                예상 조 개수: {attendanceCount > 0 ? Math.ceil(attendanceCount / groupSize) : 0}개
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 rounded-xl font-semibold"
                onClick={generateGroups}
                disabled={loading || attendanceCount === 0}
              >
                <Shuffle className="mr-2 h-4 w-4" />조 자동 편성
              </Button>
              <Button
                variant="outline"
                className="rounded-xl font-semibold bg-transparent hover:bg-gray-100"
                onClick={loadGroups}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>

            {groups.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                <p className="text-sm font-semibold text-blue-800 mb-1">조편성 규칙</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 처음 참여하는 분들은 모두 1조에 배치됩니다</li>
                  <li>• 기존 멤버는 각 조에 랜덤으로 배분됩니다</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {groups.length > 0 && (
          <div className="space-y-4">
            {groups.map((group) => {
              const hasFirstTimers = group.members.some((m) => m.is_first_time)

              return (
                <Card key={group.groupNumber} className="border-0 shadow-lg rounded-2xl">
                  <CardHeader
                    className={`rounded-t-2xl ${
                      hasFirstTimers
                        ? "bg-gradient-to-br from-blue-50 to-purple-50"
                        : "bg-gradient-to-br from-green-50 to-blue-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">
                        {group.groupNumber}조
                        {hasFirstTimers && (
                          <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-600 border-blue-300 text-xs">
                            처음 참여자 포함
                          </Badge>
                        )}
                      </CardTitle>
                      <span className="text-sm font-semibold text-gray-600">{group.members.length}명</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {group.members.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">배정된 인원이 없습니다</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {group.members.map((member) => {
                          const displayName = member.phone_last4
                            ? `${member.member_name}(${member.phone_last4})`
                            : member.member_name || "이름 없음"

                          return (
                            <div
                              key={member.id || displayName}
                              className="p-3 rounded-xl bg-gray-50 border border-gray-200"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p
                                  className={`font-semibold text-sm ${member.is_first_time ? "text-blue-600" : "text-gray-900"}`}
                                >
                                  {displayName}
                                </p>
                                {member.is_first_time && (
                                  <Badge className="bg-blue-500 text-white border-0 text-xs px-2 py-0">new</Badge>
                                )}
                              </div>
                              {member.book_genre && <p className="text-xs text-gray-600 mt-1">{member.book_genre}</p>}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
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
