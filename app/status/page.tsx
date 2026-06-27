"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { ArrowLeft, User, RefreshCw, UserX, Clock, BookOpen } from "lucide-react"
import { getTodayAttendances, type Attendance } from "@/lib/attendance"
import { getAbsentees } from "@/lib/expected-attendees"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function StatusPage() {
  const [todayAttendances, setTodayAttendances] = useState<Attendance[]>([])
  const [absentees, setAbsentees] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [eventId, setEventId] = useState("기본이벤트")

  const fetchAttendances = async () => {
    try {
      setLoading(true)
      setError(null)

      const attendances = await getTodayAttendances()
      setTodayAttendances(attendances)

      const absents = await getAbsentees(eventId, attendances)
      setAbsentees(absents)
    } catch (err) {
      console.error("출석 데이터 로딩 오류:", err)
      setError("출석 데이터를 불러오는 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendances()
  }, [])

  const lateCount = todayAttendances.filter((a) => a.isLate).length

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link href="/" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </Link>
          <h1 className="text-base font-bold text-gray-900">출석 현황</h1>
          <Button variant="ghost" size="sm" onClick={fetchAttendances} disabled={loading} className="p-1.5">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      <div className="px-4 py-5">
        <Card className="border-0 shadow-sm rounded-xl mb-5">
          <CardHeader className="bg-gradient-to-br from-green-50 to-blue-50 rounded-t-xl p-3">
            <CardTitle className="text-base flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-green-600" />
              출석 요약
            </CardTitle>
            <CardDescription className="text-sm mt-1">오전 10시 45분 이후 출석은 지각으로 처리됩니다</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-2.5 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 font-medium">총 출석</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{todayAttendances.length}</p>
              </div>
              <div className="p-2.5 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 font-medium">출석</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{todayAttendances.length - lateCount}</p>
              </div>
              <div className="p-2.5 bg-amber-50 rounded-lg">
                <p className="text-sm text-gray-600 font-medium">지각</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{lateCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-xl mb-5">
          <CardHeader className="bg-gradient-to-br from-green-50 to-blue-50 rounded-t-xl p-3">
            <CardTitle className="text-base flex items-center gap-1.5">
              <User className="h-4 w-4 text-green-600" />
              오늘 출석
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              오늘 출석한 인원: <span className="font-semibold text-green-700">{todayAttendances.length}명</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="flex justify-center items-center py-6">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-green-700"></div>
              </div>
            ) : error ? (
              <div className="text-center py-3 text-red-500 text-base">{error}</div>
            ) : todayAttendances.length === 0 ? (
              <p className="text-gray-500 text-center py-3 text-base">오늘 등록된 출석이 없습니다</p>
            ) : (
              <div className="space-y-1.5">
                {todayAttendances.map((attendance) => {
                  const time = formatDate(new Date(attendance.timestamp), "time")
                  const displayName = attendance.phoneLast4
                    ? `${attendance.name}(${attendance.phoneLast4})`
                    : attendance.name || "이름 없음"

                  return (
                    <div
                      key={attendance.id}
                      className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-gray-900 text-base truncate">{displayName}</p>
                          {attendance.isFirstTime && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-600 border-0 text-[10px] px-1.5 py-0 shrink-0">
                              NEW
                            </Badge>
                          )}
                          {attendance.bookGenre && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-0 text-[10px] px-1.5 py-0 shrink-0">
                              <BookOpen className="h-2.5 w-2.5 mr-0.5" />
                              {attendance.bookGenre}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">{time}</p>
                      </div>
                      {attendance.isLate ? (
                        <Badge variant="outline" className="bg-amber-50 text-amber-600 border-0 text-[10px] px-1.5 py-0.5 shrink-0 ml-2">
                          지각
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-600 border-0 text-[10px] px-1.5 py-0.5 shrink-0 ml-2">
                          출석
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-xl">
          <CardHeader className="bg-gradient-to-br from-red-50 to-orange-50 rounded-t-xl p-3">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <UserX className="h-4 w-4 text-red-600" />
              미출석자
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              예상 참석자 중 미출석 인원: <span className="font-semibold text-red-600">{absentees.length}명</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="flex justify-center items-center py-6">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-green-700"></div>
              </div>
            ) : absentees.length === 0 ? (
              <p className="text-gray-500 text-center py-3 text-sm">
                모든 예상 참석자가 출석했거나, 등록된 예상 참석자가 없습니다
              </p>
            ) : (
              <div className="space-y-1.5">
                {absentees.map((name, index) => (
                  <div key={index} className="p-2.5 bg-red-50 rounded-lg">
                    <p className="font-semibold text-red-600 text-sm">{name}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
