"use client"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Users, RefreshCw, Shuffle, Save, Eye, EyeOff } from 'lucide-react'
import { isLoggedIn } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

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
  reading_only?: boolean
  is_leader?: boolean
}

type Group = {
  groupNumber: number
  members: GroupMember[]
}

export default function GroupTogglePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [groupSize, setGroupSize] = useState(6)
  const [attendanceCount, setAttendanceCount] = useState(0)
  const [firstTimerCount, setFirstTimerCount] = useState(0)
  const [isPublished, setIsPublished] = useState(false)
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null)
  const MAX_GROUPS = 8 // Always show up to 8 groups
  const [totalGroupCount, setTotalGroupCount] = useState(0)

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/admin/login")
    } else {
      loadGroups()
      loadTodayAttendance()
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
        let maxGroupNumber = 0

        data.groups.forEach((member: GroupMember) => {
          if (!groupedData[member.group_number]) {
            groupedData[member.group_number] = []
          }
          groupedData[member.group_number].push(member)
          maxGroupNumber = Math.max(maxGroupNumber, member.group_number)
        })

        setTotalGroupCount(maxGroupNumber)

        const formattedGroups: Group[] = Object.entries(groupedData)
          .map(([groupNumber, members]) => ({
            groupNumber: Number.parseInt(groupNumber),
            members: members,
          }))
          .sort((a, b) => a.groupNumber - b.groupNumber)

        setGroups(formattedGroups)
        setIsPublished(data.groups[0]?.is_published || false)
      } else {
        setGroups([])
        setTotalGroupCount(0)
      }
    } catch (err) {
      console.error("[v0] Error loading groups:", err)
      setError("조 데이터를 불러오는 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const loadTodayAttendance = async () => {
    try {
      console.log("[v0] Loading today's attendance count")
      
      const supabase = createClient()
      
      // Get latest attendance date
      const { data: latestAttendance, error: latestError } = await supabase
        .from("attendances")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (latestError || !latestAttendance) {
        console.log("[v0] No attendance records found")
        setAttendanceCount(0)
        setFirstTimerCount(0)
        return
      }

      // Calculate today's date range in Korea timezone
      const latestDate = new Date(latestAttendance.created_at)
      const koreaDate = latestDate.toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
      const today = new Date(koreaDate)
      today.setHours(0, 0, 0, 0)
      
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      console.log("[v0] Fetching attendance for date:", today.toISOString())

      // Fetch today's attendance
      const { data: todayAttendees, error: fetchError } = await supabase
        .from("attendances")
        .select("name, is_first_time, reading_only")
        .gte("created_at", today.toISOString())
        .lt("created_at", tomorrow.toISOString())

      if (fetchError) {
        console.error("[v0] Error fetching today's attendance:", fetchError)
        return
      }

      if (todayAttendees && todayAttendees.length > 0) {
        const eligibleCount = todayAttendees.filter(a => !a.reading_only).length
        const firstTimers = todayAttendees.filter(a => a.is_first_time && !a.reading_only).length
        
        console.log("[v0] Today's attendance:", {
          total: todayAttendees.length,
          eligible: eligibleCount,
          firstTimers: firstTimers,
          readingOnly: todayAttendees.length - eligibleCount
        })
        
        setAttendanceCount(eligibleCount)
        setFirstTimerCount(firstTimers)
      } else {
        console.log("[v0] No attendance records for today")
        setAttendanceCount(0)
        setFirstTimerCount(0)
      }
    } catch (err) {
      console.error("[v0] Error loading today's attendance:", err)
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
        const calculatedGroups = Math.ceil(attendanceCount / groupSize)
        setTotalGroupCount(calculatedGroups)
        
        toast({
          title: "조 편성 완료",
          description: `${attendanceCount}명을 ${calculatedGroups}개 조로 편성했습니다.`,
        })
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

  const toggleGroup = (memberId: string, currentGroup: number) => {
    const totalGroups = groups.length
    const nextGroup = currentGroup >= totalGroups ? 1 : currentGroup + 1

    setGroups((prevGroups) => {
      const allMembers: GroupMember[] = []
      prevGroups.forEach((group) => {
        group.members.forEach((member) => {
          if (member.id === memberId) {
            allMembers.push({ ...member, group_number: nextGroup })
          } else {
            allMembers.push(member)
          }
        })
      })

      // Re-group members
      const newGrouped: { [key: number]: GroupMember[] } = {}
      allMembers.forEach((member) => {
        if (!newGrouped[member.group_number]) {
          newGrouped[member.group_number] = []
        }
        newGrouped[member.group_number].push(member)
      })

      return Object.entries(newGrouped)
        .map(([groupNumber, members]) => ({
          groupNumber: Number.parseInt(groupNumber),
          members: members,
        }))
        .sort((a, b) => a.groupNumber - b.groupNumber)
    })
  }

  const moveToGroup = (memberId: string, targetGroup: number) => {
    setGroups((prevGroups) => {
      const allMembers: GroupMember[] = []
      prevGroups.forEach((group) => {
        group.members.forEach((member) => {
          if (member.id === memberId) {
            allMembers.push({ ...member, group_number: targetGroup })
          } else {
            allMembers.push(member)
          }
        })
      })

      // Re-group members
      const newGrouped: { [key: number]: GroupMember[] } = {}
      allMembers.forEach((member) => {
        if (!newGrouped[member.group_number]) {
          newGrouped[member.group_number] = []
        }
        newGrouped[member.group_number].push(member)
      })

      return Object.entries(newGrouped)
        .map(([groupNumber, members]) => ({
          groupNumber: Number.parseInt(groupNumber),
          members: members,
        }))
        .sort((a, b) => a.groupNumber - b.groupNumber)
    })
    setExpandedMemberId(null)
  }

  const toggleLeader = (memberId: string) => {
    setGroups((prevGroups) => {
      const allMembers: GroupMember[] = []
      prevGroups.forEach((group) => {
        group.members.forEach((member) => {
          if (member.id === memberId) {
            allMembers.push({ ...member, is_leader: !member.is_leader })
          } else {
            allMembers.push(member)
          }
        })
      })

      // Re-group members
      const newGrouped: { [key: number]: GroupMember[] } = {}
      allMembers.forEach((member) => {
        if (!newGrouped[member.group_number]) {
          newGrouped[member.group_number] = []
        }
        newGrouped[member.group_number].push(member)
      })

      Object.keys(newGrouped).forEach((groupNum) => {
        newGrouped[Number(groupNum)].sort((a, b) => {
          if (a.is_leader && !b.is_leader) return -1
          if (!a.is_leader && b.is_leader) return 1
          return 0
        })
      })

      return Object.entries(newGrouped)
        .map(([groupNumber, members]) => ({
          groupNumber: Number.parseInt(groupNumber),
          members: members,
        }))
        .sort((a, b) => a.groupNumber - b.groupNumber)
    })
    setExpandedMemberId(null)
  }

  const saveChanges = async () => {
    try {
      setLoading(true)
      const allMembers: GroupMember[] = []
      groups.forEach((group) => {
        group.members.forEach((member) => {
          allMembers.push(member)
        })
      })

      const response = await fetch("/api/groups", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: "기본이벤트",
          groups: allMembers.map((m) => ({
            id: m.id,
            event_id: m.event_id,
            member_name: m.member_name,
            phone_last4: m.phone_last4,
            book_genre: m.book_genre,
            group_number: m.group_number,
            is_published: m.is_published,
            is_first_time: m.is_first_time,
            is_leader: m.is_leader,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error("저장에 실패했습니다")
      }

      toast({
        title: "저장 완료",
        description: "조 편성 변경사항이 저장되었습니다.",
      })
      await loadGroups()
    } catch (err) {
      toast({
        title: "오류",
        description: "저장에 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const togglePublish = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/groups/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId: "기본이벤트", isPublished: !isPublished }),
      })

      if (!response.ok) {
        throw new Error("공개 상태 변경에 실패했습니다")
      }

      setIsPublished(!isPublished)
      toast({
        title: isPublished ? "조 편성 비공개" : "조 편성 공개",
        description: isPublished ? "조 편성이 비공개되었습니다." : "조 편성이 공개되었습니다.",
      })
    } catch (err) {
      toast({
        title: "오류",
        description: "공개 상태 변경에 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleGroupButtons = (memberId: string) => {
    setExpandedMemberId(expandedMemberId === memberId ? null : memberId)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </Link>
          <h1 className="text-xl font-bold text-green-600">조편성 (토글)</h1>
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
                <Shuffle className="mr-2 h-4 w-4" />
                조 자동 편성
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
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold"
                  onClick={saveChanges}
                  disabled={loading}
                >
                  <Save className="mr-2 h-4 w-4" />
                  변경사항 저장
                </Button>
                <Button
                  variant={isPublished ? "outline" : "default"}
                  className="rounded-xl font-semibold"
                  onClick={togglePublish}
                  disabled={loading}
                >
                  {isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            )}

            {groups.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                <p className="text-sm font-semibold text-blue-800 mb-1">사용법</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 구성원 카드를 클릭하면 다음 조로 이동합니다</li>
                  <li>• 변경 후 반드시 '변경사항 저장' 버튼을 눌러주세요</li>
                  <li>• 눈 아이콘을 클릭하여 조편성을 공개/비공개할 수 있습니다</li>
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
                          
                          const isExpanded = expandedMemberId === member.id

                          return (
                            <div
                              key={member.id || displayName}
                              className="p-3 rounded-xl bg-gray-50 border-2 border-gray-200"
                            >
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <p
                                    className={`font-semibold text-sm ${member.is_first_time ? "text-blue-600" : "text-gray-900"}`}
                                  >
                                    {displayName}
                                  </p>
                                  {member.is_first_time && (
                                    <Badge className="bg-blue-500 text-white border-0 text-xs px-2 py-0">new</Badge>
                                  )}
                                  {member.reading_only && (
                                    <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200 text-xs">
                                      독서만
                                    </Badge>
                                  )}
                                  {member.is_leader && (
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200 text-xs">
                                      👑 조장
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {member.book_genre && <p className="text-xs text-gray-600 mb-2">{member.book_genre}</p>}
                              
                              {!isExpanded ? (
                                <button
                                  onClick={() => toggleGroupButtons(member.id!)}
                                  className="w-full py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-all"
                                >
                                  {member.is_leader && "👑 "}
                                  {member.group_number}조 (조 변경)
                                </button>
                              ) : (
                                <div className="space-y-2">
                                  <div className="grid grid-cols-4 gap-1">
                                    {Array.from({ length: 7 }, (_, i) => i + 1).map((groupNum) => (
                                      <button
                                        key={groupNum}
                                        onClick={() => moveToGroup(member.id!, groupNum)}
                                        className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                          groupNum === member.group_number
                                            ? "bg-green-600 text-white"
                                            : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                                        }`}
                                      >
                                        {groupNum}조
                                      </button>
                                    ))}
                                    <button
                                      onClick={() => toggleLeader(member.id!)}
                                      className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                        member.is_leader
                                          ? "bg-yellow-500 text-white"
                                          : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                                      }`}
                                    >
                                      👑 조장
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => setExpandedMemberId(null)}
                                    className="w-full py-1 rounded-lg text-xs font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
                                  >
                                    닫기
                                  </button>
                                </div>
                              )}
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

        {groups.length === 0 && !loading && (
          <Card className="border-0 shadow-lg rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500 text-center">
                조 편성이 없습니다.
                <br />
                '조 자동 편성' 버튼을 눌러 생성하세요.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
