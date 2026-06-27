"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Download, Copy, Calendar, RefreshCw, FileDown, Trash2, AlertTriangle, QrCode } from "lucide-react"
import { isLoggedIn } from "@/lib/auth"
import {
  getAllAttendances,
  getAttendancesByEvent,
  deleteAttendance,
  deleteMultipleAttendances,
  type Attendance,
} from "@/lib/attendance"
import { convertAttendancesToCSV, downloadCSV, copyToClipboard } from "@/lib/export-utils"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

type MonthlyStats = {
  month: number
  attendanceRate: number | null // null이면 아직 안 온 달
  totalCount: number
  onTimeCount: number
  lateCount: number
}

export default function AttendanceRecordsPage() {
  const router = useRouter()
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [eventId, setEventId] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [filteredAttendances, setFilteredAttendances] = useState<Attendance[]>([])
  const [selectedAttendances, setSelectedAttendances] = useState<string[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [selectAll, setSelectAll] = useState(false)
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([])
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/admin/login")
    } else {
      fetchAttendances()
    }
  }, [router])

  const calculateMonthlyStats = (data: Attendance[]) => {
    const now = new Date()
    const currentMonth = now.getMonth() + 1 // 1-12
    const currentYearValue = now.getFullYear()
    setCurrentYear(currentYearValue)

    const stats: MonthlyStats[] = []

    for (let month = 1; month <= 12; month++) {
      // 미래 월인 경우
      if (month > currentMonth) {
        stats.push({
          month,
          attendanceRate: null,
          totalCount: 0,
          onTimeCount: 0,
          lateCount: 0,
        })
        continue
      }

      // 해당 월의 출석 데이터 필터링
      const monthData = data.filter((a) => {
        const date = new Date(a.timestamp)
        return date.getFullYear() === currentYearValue && date.getMonth() + 1 === month
      })

      if (monthData.length === 0) {
        stats.push({
          month,
          attendanceRate: 0,
          totalCount: 0,
          onTimeCount: 0,
          lateCount: 0,
        })
        continue
      }

      const onTimeCount = monthData.filter((a) => !a.isLate).length
      const lateCount = monthData.filter((a) => a.isLate).length
      const totalCount = monthData.length
      const attendanceRate = Math.round((onTimeCount / totalCount) * 100)

      stats.push({
        month,
        attendanceRate,
        totalCount,
        onTimeCount,
        lateCount,
      })
    }

    setMonthlyStats(stats)
  }

  const fetchAttendances = async () => {
    try {
      setLoading(true)
      setError(null)
      setSelectedAttendances([])
      setSelectAll(false)

      let data: Attendance[]

      if (eventId) {
        data = await getAttendancesByEvent(eventId)
      } else {
        data = await getAllAttendances()
      }

      setAttendances(data)
      applyFilters(data)
      calculateMonthlyStats(data)
    } catch (err) {
      console.error("출석 데이터 로딩 오류:", err)
      setError("출석 데이터를 불러오는 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = (data: Attendance[] = attendances) => {
    let filtered = [...data]

    if (startDate) {
      const startDateTime = new Date(startDate)
      startDateTime.setHours(0, 0, 0, 0)
      filtered = filtered.filter((a) => new Date(a.timestamp) >= startDateTime)
    }

    if (endDate) {
      const endDateTime = new Date(endDate)
      endDateTime.setHours(23, 59, 59, 999)
      filtered = filtered.filter((a) => new Date(a.timestamp) <= endDateTime)
    }

    setFilteredAttendances(filtered)
  }

  const handleApplyFilters = () => {
    applyFilters()
  }

  const handleDownloadCSV = () => {
    const csvContent = convertAttendancesToCSV(filteredAttendances)
    const filename = `attendance-records-${new Date().toISOString().slice(0, 10)}.csv`
    downloadCSV(csvContent, filename)

    setSuccessMessage("CSV 파일이 다운로드되었습니다.")
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleCopyToClipboard = async () => {
    const success = await copyToClipboard(filteredAttendances)

    if (success) {
      setSuccessMessage("출석 데이터가 클립보드에 복사되었습니다. 엑셀에 붙여넣기 할 수 있습니다.")
    } else {
      setError("클립보드 복사 중 오류가 발생했습니다.")
    }

    setTimeout(() => {
      setSuccessMessage(null)
      setError(null)
    }, 3000)
  }

  const handleSelectAttendance = (id: string) => {
    setSelectedAttendances((prev) => {
      if (prev.includes(id)) {
        return prev.filter((attendanceId) => attendanceId !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedAttendances([])
    } else {
      setSelectedAttendances(filteredAttendances.map((a) => a.id))
    }
    setSelectAll(!selectAll)
  }

  const handleDeleteSelected = async () => {
    if (selectedAttendances.length === 0) return

    try {
      setDeleteLoading(true)
      setError(null)

      let result

      if (selectedAttendances.length === 1) {
        result = await deleteAttendance(selectedAttendances[0])
      } else {
        result = await deleteMultipleAttendances(selectedAttendances)
      }

      if (result.success) {
        setSuccessMessage(`${selectedAttendances.length}개의 출석 기록이 성공적으로 삭제되었습니다.`)
        setSelectedAttendances([])
        setSelectAll(false)

        const newData = await getAllAttendances()
        setAttendances(newData)
        applyFilters(newData)
        calculateMonthlyStats(newData)
      } else {
        setError(result.error || "출석 기록 삭제 중 오류가 발생했습니다.")
      }
    } catch (err) {
      console.error("출석 기록 삭제 오류:", err)
      setError("출석 기록 삭제 중 오류가 발생했습니다.")
    } finally {
      setDeleteLoading(false)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/admin/generate-qr" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </Link>
          <h1 className="text-xl font-bold text-green-600">기록 관리</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl relative mb-4">
          <p className="font-medium">지각 기준: 오전 10시 45분 이후 출석</p>
          <p className="text-sm">오전 10시 45분 이후에 출석한 경우 지각으로 처리됩니다.</p>
        </div>

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
            <CardTitle className="text-2xl font-bold text-center">{currentYear}</CardTitle>
            <CardDescription className="text-center">월별 출석률 (정상 출석 기준)</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 1월 ~ 4월 */}
                <div className="grid grid-cols-4 gap-3">
                  {monthlyStats.slice(0, 4).map((stat) => (
                    <div
                      key={stat.month}
                      className="flex flex-col items-center p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-green-300 transition-colors"
                    >
                      <div className="text-sm font-semibold text-gray-600 mb-2">{stat.month}월</div>
                      {stat.attendanceRate === null ? (
                        <div className="text-2xl font-bold text-gray-300">-</div>
                      ) : (
                        <>
                          <div className="text-2xl font-bold text-green-600">{stat.attendanceRate}%</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {stat.onTimeCount}/{stat.totalCount}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* 5월 ~ 8월 */}
                <div className="grid grid-cols-4 gap-3">
                  {monthlyStats.slice(4, 8).map((stat) => (
                    <div
                      key={stat.month}
                      className="flex flex-col items-center p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-green-300 transition-colors"
                    >
                      <div className="text-sm font-semibold text-gray-600 mb-2">{stat.month}월</div>
                      {stat.attendanceRate === null ? (
                        <div className="text-2xl font-bold text-gray-300">-</div>
                      ) : (
                        <>
                          <div className="text-2xl font-bold text-green-600">{stat.attendanceRate}%</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {stat.onTimeCount}/{stat.totalCount}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* 9월 ~ 12월 */}
                <div className="grid grid-cols-4 gap-3">
                  {monthlyStats.slice(8, 12).map((stat) => (
                    <div
                      key={stat.month}
                      className="flex flex-col items-center p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-green-300 transition-colors"
                    >
                      <div className="text-sm font-semibold text-gray-600 mb-2">{stat.month}월</div>
                      {stat.attendanceRate === null ? (
                        <div className="text-2xl font-bold text-gray-300">-</div>
                      ) : (
                        <>
                          <div className="text-2xl font-bold text-green-600">{stat.attendanceRate}%</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {stat.onTimeCount}/{stat.totalCount}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg rounded-2xl mb-6">
          <CardHeader className="bg-gradient-to-br from-green-50 to-blue-50 rounded-t-2xl">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              출석 데이터 필터
            </CardTitle>
            <CardDescription>날짜 범위와 이벤트 ID로 출석 데이터를 필터링하세요</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-id" className="font-semibold">
                  이벤트 ID (선택사항)
                </Label>
                <Input
                  id="event-id"
                  placeholder="이벤트 ID 입력"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-date" className="font-semibold">
                  시작 날짜 (선택사항)
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date" className="font-semibold">
                  종료 날짜 (선택사항)
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 rounded-xl font-semibold"
              onClick={fetchAttendances}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              데이터 불러오기
            </Button>

            <Button
              className="flex-1 rounded-xl font-semibold bg-transparent hover:bg-gray-100"
              variant="outline"
              onClick={handleApplyFilters}
              disabled={loading}
            >
              필터 적용
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-0 shadow-lg rounded-2xl mb-6">
          <CardHeader className="bg-gradient-to-br from-green-50 to-blue-50 rounded-t-2xl">
            <CardTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5 text-green-600" />
              데이터 관리
            </CardTitle>
            <CardDescription>출석 데이터를 내보내거나 삭제하세요</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 rounded-xl font-semibold"
                onClick={handleDownloadCSV}
                disabled={filteredAttendances.length === 0 || loading}
              >
                <Download className="mr-2 h-4 w-4" />
                CSV 다운로드
              </Button>

              <Button
                className="flex-1 rounded-xl font-semibold bg-transparent hover:bg-gray-100"
                variant="outline"
                onClick={handleCopyToClipboard}
                disabled={filteredAttendances.length === 0 || loading}
              >
                <Copy className="mr-2 h-4 w-4" />
                클립보드에 복사
              </Button>
            </div>

            {selectedAttendances.length > 0 && (
              <div className="flex justify-between items-center p-3 bg-red-50 border border-red-200 rounded-xl">
                <span className="text-red-700 font-medium">{selectedAttendances.length}개 항목 선택됨</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={deleteLoading}
                  className="rounded-lg"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  선택 항목 삭제
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg rounded-2xl">
          <CardHeader className="bg-gradient-to-br from-green-50 to-blue-50 rounded-t-2xl">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              출석 기록
            </CardTitle>
            <CardDescription>총 {filteredAttendances.length}개의 출석 기록이 있습니다</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
              </div>
            ) : filteredAttendances.length === 0 ? (
              <p className="text-gray-500 text-center py-4">출석 기록이 없습니다</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 px-2 text-left">
                        <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} aria-label="모든 항목 선택" />
                      </th>
                      <th className="py-2 px-4 text-left font-semibold text-gray-700">이름</th>
                      <th className="py-2 px-4 text-left font-semibold text-gray-700">날짜</th>
                      <th className="py-2 px-4 text-left font-semibold text-gray-700">시간</th>
                      <th className="py-2 px-4 text-left font-semibold text-gray-700">이벤트 ID</th>
                      <th className="py-2 px-4 text-left font-semibold text-gray-700">상태</th>
                      <th className="py-2 px-4 text-right font-semibold text-gray-700">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttendances.map((attendance) => {
                      const date = new Date(attendance.timestamp)
                      const isSelected = selectedAttendances.includes(attendance.id)

                      return (
                        <tr
                          key={attendance.id}
                          className={`border-b hover:bg-gray-50 transition-colors ${isSelected ? "bg-blue-50" : ""}`}
                        >
                          <td className="py-3 px-2">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleSelectAttendance(attendance.id)}
                              aria-label={`${attendance.name} 선택`}
                            />
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-900">{attendance.name}</td>
                          <td className="py-3 px-4 text-gray-700">{formatDate(date, "date")}</td>
                          <td className="py-3 px-4 text-gray-700">{formatDate(date, "time")}</td>
                          <td className="py-3 px-4 text-gray-700">{attendance.eventId}</td>
                          <td className="py-3 px-4">
                            {attendance.isLate ? (
                              <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                                지각
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                                출석
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                              onClick={() => {
                                setSelectedAttendances([attendance.id])
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">삭제</span>
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              출석 기록 삭제
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAttendances.length === 1
                ? "선택한 출석 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                : `선택한 ${selectedAttendances.length}개의 출석 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading} className="rounded-lg">
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteSelected()
              }}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              {deleteLoading ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
