"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, RefreshCw, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface GroupMember {
  id: string
  event_id: string
  member_name: string
  phone_last4: string | null
  book_genre: string | null // book_genre 필드 추가
  group_number: number
  is_published: boolean
  is_first_time: boolean // Add is_first_time field
}

export default function GroupsViewPage() {
  const [groups, setGroups] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(true)
  const eventId = "기본이벤트"
  const router = useRouter()

  const loadGroups = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/groups?eventId=${encodeURIComponent(eventId)}`)
      const data = await res.json()

      if (data.groups) {
        const publishedGroups = data.groups.filter((g: GroupMember) => g.is_published)
        setGroups(publishedGroups)
      }
    } catch (error) {
      console.error("Error loading groups:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGroups()
  }, [])

  const groupedMembers = groups.reduce(
    (acc, member) => {
      if (!acc[member.group_number]) {
        acc[member.group_number] = []
      }
      acc[member.group_number].push(member)
      return acc
    },
    {} as Record<number, GroupMember[]>,
  )

  const totalGroups = Object.keys(groupedMembers).length

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.back()} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="text-base font-bold text-gray-900">조 편성</h1>
          <Button variant="ghost" size="sm" onClick={loadGroups} disabled={loading} className="p-1.5">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      <div className="px-4 py-6">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
          </div>
        ) : groups.length === 0 ? (
          <Card className="border-0 shadow-lg rounded-2xl bg-white">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-gray-500 text-center text-sm mb-3">아직 공개된 조 편성이 없습니다.</p>
              <Button
                onClick={loadGroups}
                variant="outline"
                size="sm"
                className="rounded-full border-green-500 text-green-600 hover:bg-green-50 bg-transparent"
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                새로고침
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-0 shadow-sm rounded-xl mb-5">
              <CardHeader className="bg-gradient-to-br from-green-50 to-blue-50 rounded-t-xl p-3">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-green-600" />조 편성 요약
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  총 <span className="font-semibold text-green-700">{groups.length}명</span> /{" "}
                  <span className="font-semibold text-green-700">{totalGroups}개 조</span>
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-2 gap-2">
              {Object.entries(groupedMembers)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([groupNum, members]) => (
                  <Card key={groupNum} className="border-0 shadow-sm rounded-xl overflow-hidden bg-white">
                    <CardHeader className="bg-gradient-to-br from-green-50 to-blue-50 p-2.5 border-b border-gray-100">
                      <CardTitle className="flex items-center gap-1 text-xs font-bold text-green-700">
                        <Users className="h-3 w-3" />
                        {groupNum}조
                        <Badge
                          variant="secondary"
                          className="ml-auto text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 border-0"
                        >
                          {members.length}명
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 space-y-1">
                      {members.map((member) => (
                        <div key={member.id} className="flex flex-col p-1.5 bg-gray-50 rounded-lg text-[10px] border-0">
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`font-medium leading-tight truncate ${member.is_first_time ? "text-blue-600" : "text-gray-900"}`}
                            >
                              {member.member_name}
                              {member.phone_last4 && (
                                <span className="text-gray-400 ml-0.5">({member.phone_last4})</span>
                              )}
                            </span>
                            <div className="flex items-center gap-0.5">
                              {member.is_first_time && (
                                <Badge
                                  variant="secondary"
                                  className="text-[8px] px-1 py-0 shrink-0 bg-blue-100 text-blue-600 border-0"
                                >
                                  new
                                </Badge>
                              )}
                              {member.book_genre && (
                                <Badge
                                  variant="secondary"
                                  className="text-[8px] px-1 py-0 shrink-0 bg-blue-50 text-blue-600 border-0"
                                >
                                  {member.book_genre}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
