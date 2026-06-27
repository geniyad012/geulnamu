"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Users, RefreshCw, Eye, EyeOff, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import AuthGuard from "@/components/auth-guard"

interface GroupMember {
  id?: string
  event_id: string
  member_name: string
  phone_last4: string | null
  group_number: number
  is_published: boolean
}

export default function GroupsPage() {
  const [eventId, setEventId] = useState("기본이벤트")
  const [groupSize, setGroupSize] = useState(4)
  const [groups, setGroups] = useState<GroupMember[]>([])
  const [isPublished, setIsPublished] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadGroups()
  }, [eventId])

  const loadGroups = async () => {
    try {
      const res = await fetch(`/api/groups?eventId=${encodeURIComponent(eventId)}`)
      const data = await res.json()

      if (data.groups && data.groups.length > 0) {
        setGroups(data.groups)
        setIsPublished(data.groups[0]?.is_published || false)
      } else {
        setGroups([])
        setIsPublished(false)
      }
    } catch (error) {
      console.error("Error loading groups:", error)
    }
  }

  const generateGroups = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/groups/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, groupSize }),
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: "조 편성 완료",
          description: `${data.groups.length}명을 ${Math.ceil(data.groups.length / groupSize)}개 조로 편성했습니다.`,
        })
        await loadGroups()
      } else {
        toast({
          title: "오류",
          description: data.error || "조 편성에 실패했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "오류",
        description: "조 편성 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const togglePublish = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/groups/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, isPublished: !isPublished }),
      })

      if (res.ok) {
        setIsPublished(!isPublished)
        toast({
          title: isPublished ? "조 편성 비공개" : "조 편성 공개",
          description: isPublished ? "조 편성이 비공개되었습니다." : "조 편성이 공개되었습니다.",
        })
      }
    } catch (error) {
      toast({
        title: "오류",
        description: "공개 상태 변경에 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const moveToGroup = (memberId: string, newGroupNumber: number) => {
    setGroups((prev) =>
      prev.map((member) => (member.id === memberId ? { ...member, group_number: newGroupNumber } : member)),
    )
  }

  const saveChanges = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/groups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          groups: groups.map((g) => ({
            event_id: g.event_id,
            member_name: g.member_name,
            phone_last4: g.phone_last4,
            group_number: g.group_number,
            is_published: g.is_published,
          })),
        }),
      })

      if (res.ok) {
        toast({
          title: "저장 완료",
          description: "조 편성 변경사항이 저장되었습니다.",
        })
        await loadGroups()
      }
    } catch (error) {
      toast({
        title: "오류",
        description: "저장에 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

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
    <AuthGuard>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center gap-3 mb-6">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">조 편성 관리</h1>
            <p className="text-muted-foreground">당일 출석자를 기반으로 조를 편성하고 관리합니다</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>조 편성 설정</CardTitle>
            <CardDescription>이벤트 ID와 조 크기를 설정하고 조를 생성하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventId">이벤트 ID</Label>
                <Input
                  id="eventId"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  placeholder="기본이벤트"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupSize">조 인원 수</Label>
                <Input
                  id="groupSize"
                  type="number"
                  min="2"
                  max="10"
                  value={groupSize}
                  onChange={(e) => setGroupSize(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={generateGroups} disabled={loading} className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />조 자동 편성
              </Button>
              {groups.length > 0 && (
                <>
                  <Button onClick={saveChanges} disabled={loading} variant="secondary">
                    <Save className="mr-2 h-4 w-4" />
                    변경사항 저장
                  </Button>
                  <Button onClick={togglePublish} disabled={loading} variant={isPublished ? "destructive" : "default"}>
                    {isPublished ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                    {isPublished ? "비공개" : "공개"}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {groups.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                조 편성 결과 ({groups.length}명 / {totalGroups}개 조)
              </h2>
              {isPublished && (
                <Badge variant="default" className="text-base">
                  <Eye className="mr-1 h-4 w-4" />
                  공개됨
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(groupedMembers)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([groupNum, members]) => (
                  <Card key={groupNum}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {groupNum}조<Badge variant="secondary">{members.length}명</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {members.map((member, idx) => (
                          <li
                            key={member.id || idx}
                            className="flex items-center justify-between p-2 bg-muted rounded-lg"
                          >
                            <span className="font-medium">
                              {member.member_name}
                              {member.phone_last4 && (
                                <span className="text-muted-foreground ml-1">({member.phone_last4})</span>
                              )}
                            </span>
                            <div className="flex gap-1">
                              {Number(groupNum) > 1 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => moveToGroup(member.id!, Number(groupNum) - 1)}
                                >
                                  ←
                                </Button>
                              )}
                              {Number(groupNum) < totalGroups && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => moveToGroup(member.id!, Number(groupNum) + 1)}
                                >
                                  →
                                </Button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {groups.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                아직 조 편성이 없습니다.
                <br />
                위의 &apos;조 자동 편성&apos; 버튼을 눌러 조를 생성하세요.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthGuard>
  )
}
