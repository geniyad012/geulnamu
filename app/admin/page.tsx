"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
import {
  ArrowLeft,
  LogOut,
  QrCode,
  Upload,
  Users,
  Calendar,
  UsersRound,
  Download,
  RefreshCw,
  UserPlus,
  Trash2,
  Copy,
  FileDown,
  AlertTriangle,
} from "lucide-react"
import { isLoggedIn, logout } from "@/lib/auth"
import { updateFeaturedBook } from "@/lib/featured-book"
import { getHeroSettings, updateHeroSettings, type HeroSettings } from "@/lib/hero-settings"
import {
  addExpectedAttendee,
  getExpectedAttendees,
  deleteExpectedAttendee,
  addMultipleExpectedAttendees,
  type ExpectedAttendee,
} from "@/lib/expected-attendees"
import {
  getAllAttendances,
  getAttendancesByEvent,
  deleteAttendance,
  deleteMultipleAttendances,
  type Attendance,
} from "@/lib/attendance"
import { convertAttendancesToCSV, downloadCSV, copyToClipboard } from "@/lib/export-utils"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface GroupMember {
  id?: string
  event_id: string
  member_name: string
  phone_last4: string | null
  book_genre: string | null // book_genre 필드 추가
  group_number: number
  is_published: boolean
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"qr" | "hero" | "attendees" | "records" | "groups" | "events">("qr")

  // Hero settings state
  const [heroSettings, setHeroSettings] = useState<HeroSettings | null>(null)
  const [heroLoading, setHeroLoading] = useState(false)
  const [heroMessage, setHeroMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [heroMode, setHeroMode] = useState<"default" | "designated_reading">("default")
  const [defaultImageUrl, setDefaultImageUrl] = useState<string | null>(null)
  const [defaultImagePreview, setDefaultImagePreview] = useState<string | null>(null)
  const [designatedTitle, setDesignatedTitle] = useState("")
  const [designatedDescription, setDesignatedDescription] = useState("")
  const [designatedButtonText, setDesignatedButtonText] = useState("")
  const [designatedButtonLink, setDesignatedButtonLink] = useState("")
  const [designatedIsActive, setDesignatedIsActive] = useState(false)

  const [eventName, setEventName] = useState("정기모임")
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [bookTitle, setBookTitle] = useState("")
  const [bookImagePreview, setBookImagePreview] = useState<string | null>(null)
  const [uploadingBook, setUploadingBook] = useState(false)
  const [bookMessage, setBookMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [attendeesEventId, setAttendeesEventId] = useState("기본이벤트")
  const [newName, setNewName] = useState("")
  const [bulkNames, setBulkNames] = useState("")
  const [expectedAttendees, setExpectedAttendees] = useState<ExpectedAttendee[]>([])
  const [attendeesLoading, setAttendeesLoading] = useState(false)
  const [attendeesError, setAttendeesError] = useState<string | null>(null)
  const [attendeesSuccess, setAttendeesSuccess] = useState<string | null>(null)
  const [addingAttendee, setAddingAttendee] = useState(false)
  const [showBulkAdd, setShowBulkAdd] = useState(false)

  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [recordsError, setRecordsError] = useState<string | null>(null)
  const [recordsSuccess, setRecordsSuccess] = useState<string | null>(null)
  const [recordsEventId, setRecordsEventId] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [filteredAttendances, setFilteredAttendances] = useState<Attendance[]>([])
  const [selectedAttendances, setSelectedAttendances] = useState<string[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [selectAll, setSelectAll] = useState(false)

  const [groupsEventId, setGroupsEventId] = useState("기본이벤트")
  const [groupSize, setGroupSize] = useState(4)
  const [groups, setGroups] = useState<GroupMember[]>([])
  const [isPublished, setIsPublished] = useState(false)
  const [draggedMember, setDraggedMember] = useState<GroupMember | null>(null)
  const [groupsLoading, setGroupsLoading] = useState(false) // Add this line
  const [touchStartY, setTouchStartY] = useState(0)
  const [touchCurrentElement, setTouchCurrentElement] = useState<HTMLElement | null>(null)

  const [events, setEvents] = useState<any[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    content: "", // Added content field for event description
    thumbnail_url: "", // Changed from thumbnail to thumbnail_url
    detail_image_url: "", // Changed from detail_image to detail_image_url
    status: "ongoing" as "ongoing" | "completed" | "coming_soon",
    price: "", // Changed from number to string to accept text input
    account_number: "",
    account_holder_name: "", // Added account holder name field
    event_date: "",
    event_time: "",
    location: "", // Added location field
    short_location: "", // Added short_location field for thumbnails
  })
  const [selectedEventApplicants, setSelectedEventApplicants] = useState<any>(null)
  const [applicants, setApplicants] = useState<any[]>([])
  const [applicantsLoading, setApplicantsLoading] = useState(false)

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/admin/login")
    } else {
      generateQrCode()
    }
  }, [router])

  useEffect(() => {
    if (activeTab === "hero") {
      loadHeroSettings()
    }
  }, [activeTab])

  useEffect(() => {
    if (activeTab === "groups") {
      loadGroups()
    }
  }, [activeTab, groupsEventId])

  useEffect(() => {
    if (activeTab === "events") {
      fetchEvents()
    }
  }, [activeTab])

  const loadHeroSettings = async () => {
    try {
      setHeroLoading(true)
      const settings = await getHeroSettings()
      if (settings) {
        setHeroSettings(settings)
        setHeroMode(settings.hero_mode)
        setDefaultImageUrl(settings.default_image_url || null)
        setDesignatedTitle(settings.designated_title || "")
        setDesignatedDescription(settings.designated_description || "")
        setDesignatedButtonText(settings.designated_button_text || "")
        setDesignatedButtonLink(settings.designated_button_link || "")
        setDesignatedIsActive(settings.designated_is_active || false)
      }
    } catch (error) {
      console.error("Error loading hero settings:", error)
    } finally {
      setHeroLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleSaveHeroSettings = async () => {
    try {
      setHeroLoading(true)
      setHeroMessage(null)

      const updates: Partial<HeroSettings> = {
        hero_mode: heroMode,
        default_image_url: defaultImageUrl || undefined,
        designated_is_active: designatedIsActive,
        designated_title: designatedTitle,
        designated_description: designatedDescription,
        designated_button_text: designatedButtonText,
        designated_button_link: designatedButtonLink,
      }

      const result = await updateHeroSettings(updates)
      if (result.success) {
        setHeroMessage({ type: "success", text: "히어로 설정이 업데이트되었습니다." })
        setTimeout(() => setHeroMessage(null), 3000)
      } else {
        setHeroMessage({ type: "error", text: result.error || "저장에 실패했습니다." })
      }
    } catch (error) {
      setHeroMessage({ type: "error", text: "저장 중 오류가 발생했습니다." })
    } finally {
      setHeroLoading(false)
    }
  }

  const handleDefaultImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setDefaultImagePreview(reader.result as string)
        setDefaultImageUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const generateQrCode = () => {
    const timestamp = Date.now()
    const uniqueId = `${timestamp}`
    const checkInUrl = `https://geulnamu.vercel.app/check-in?event=${encodeURIComponent(eventName)}&code=${uniqueId}`
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(checkInUrl)}`
    setQrCodeUrl(url)
  }

  const handleDownloadQr = () => {
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
        setBookImagePreview(null)
        setTimeout(() => setBookMessage(null), 3000)
      } else {
        setBookMessage({ type: "error", text: result.error || "업로드 중 오류가 발생했습니다." })
      }
    } catch (error) {
      setBookMessage({ type: "error", text: "업로드 중 오류가 발생했습니다." })
    } finally {
      setUploadingBook(false)
    }
  }

  const fetchExpectedAttendees = async () => {
    try {
      setAttendeesLoading(true)
      setAttendeesError(null)
      const attendees = await getExpectedAttendees(attendeesEventId)
      setExpectedAttendees(attendees)
    } catch (err) {
      setAttendeesError("예상 참석자 목록을 불러오는 중 오류가 발생했습니다.")
    } finally {
      setAttendeesLoading(false)
    }
  }

  const handleAddAttendee = async () => {
    if (!newName.trim()) {
      setAttendeesError("이름을 입력해주세요.")
      return
    }

    try {
      setAddingAttendee(true)
      setAttendeesError(null)
      const result = await addExpectedAttendee(newName.trim(), attendeesEventId)

      if (result.success) {
        setNewName("")
        setAttendeesSuccess("예상 참석자가 추가되었습니다.")
        fetchExpectedAttendees()
        setTimeout(() => setAttendeesSuccess(null), 3000)
      } else {
        setAttendeesError(result.error || "예상 참석자 추가 중 오류가 발생했습니다.")
      }
    } catch (err) {
      setAttendeesError("예상 참석자 추가 중 오류가 발생했습니다.")
    } finally {
      setAddingAttendee(false)
    }
  }

  const handleDeleteAttendee = async (id: string) => {
    try {
      setAttendeesError(null)
      const result = await deleteExpectedAttendee(id)

      if (result.success) {
        setAttendeesSuccess("예상 참석자가 삭제되었습니다.")
        fetchExpectedAttendees()
        setTimeout(() => setAttendeesSuccess(null), 3000)
      } else {
        setAttendeesError(result.error || "예상 참석자 삭제 중 오류가 발생했습니다.")
      }
    } catch (err) {
      setAttendeesError("예상 참석자 삭제 중 오류가 발생했습니다.")
    }
  }

  const handleBulkAdd = async () => {
    if (!bulkNames.trim()) {
      setAttendeesError("이름을 입력해주세요.")
      return
    }

    try {
      setAddingAttendee(true)
      setAttendeesError(null)
      const names = bulkNames
        .split("\n")
        .map((name) => name.trim())
        .filter((name) => name !== "")
      const result = await addMultipleExpectedAttendees(names, attendeesEventId)

      if (result.success) {
        setBulkNames("")
        setAttendeesSuccess(`${names.length}명의 예상 참석자가 추가되었습니다.`)
        fetchExpectedAttendees()
        setShowBulkAdd(false)
        setTimeout(() => setAttendeesSuccess(null), 3000)
      } else {
        setAttendeesError(result.error || "예상 참석자 일괄 추가 중 오류가 발생했습니다.")
      }
    } catch (err) {
      setAttendeesError("예상 참석자 일괄 추가 중 오류가 발생했습니다.")
    } finally {
      setAddingAttendee(false)
    }
  }

  const fetchAttendances = async () => {
    try {
      setRecordsLoading(true)
      setRecordsError(null)
      setSelectedAttendances([])
      setSelectAll(false)

      let data: Attendance[]
      if (recordsEventId) {
        data = await getAttendancesByEvent(recordsEventId)
      } else {
        data = await getAllAttendances()
      }

      setAttendances(data)
      applyFilters(data)
    } catch (err) {
      setRecordsError("출석 데이터를 불러오는 중 오류가 발생했습니다.")
    } finally {
      setRecordsLoading(false)
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

  const handleDownloadCSV = () => {
    const csvContent = convertAttendancesToCSV(filteredAttendances)
    const filename = `attendance-records-${new Date().toISOString().slice(0, 10)}.csv`
    downloadCSV(csvContent, filename)
    setRecordsSuccess("CSV 파일이 다운로드되었습니다.")
    setTimeout(() => setRecordsSuccess(null), 3000)
  }

  const handleCopyToClipboard = async () => {
    const success = await copyToClipboard(filteredAttendances)
    if (success) {
      setRecordsSuccess("출석 데이터가 클립보드에 복사되었습니다.")
    } else {
      setRecordsError("클립보드 복사 중 오류가 발생했습니다.")
    }
    setTimeout(() => {
      setRecordsSuccess(null)
      setRecordsError(null)
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
      setRecordsError(null)

      let result
      if (selectedAttendances.length === 1) {
        result = await deleteAttendance(selectedAttendances[0])
      } else {
        result = await deleteMultipleAttendances(selectedAttendances)
      }

      if (result.success) {
        setRecordsSuccess(`${selectedAttendances.length}개의 출석 기록이 삭제되었습니다.`)
        setSelectedAttendances([])
        setSelectAll(false)
        const newData = await getAllAttendances()
        setAttendances(newData)
        applyFilters(newData)
      } else {
        setRecordsError(result.error || "출석 기록 삭제 중 오류가 발생했습니다.")
      }
    } catch (err) {
      setRecordsError("출석 기록 삭제 중 오류가 발생했습니다.")
    } finally {
      setDeleteLoading(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const loadGroups = async () => {
    try {
      const res = await fetch(`/api/groups?eventId=${encodeURIComponent(groupsEventId)}`)
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
    setGroupsLoading(true) // Use the declared variable
    console.log("[v0] Calling generate groups API for today's attendees, groupSize:", groupSize)
    try {
      const res = await fetch("/api/groups/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupSize }),
      })

      const data = await res.json()
      console.log("[v0] Generate groups response:", data)

      if (res.ok) {
        toast({
          title: "조 편성 완료",
          description: `오늘 출석한 ${data.groups.length}명을 ${Math.ceil(data.groups.length / groupSize)}개 조로 편성했습니다.`,
        })
        await loadGroups()
      } else {
        console.error("[v0] Generate groups failed:", data)
        toast({
          title: "오류",
          description: data.error || "조 편성에 실패했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Generate groups error:", error)
      toast({
        title: "오류",
        description: "조 편성 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setGroupsLoading(false) // Use the declared variable
    }
  }

  const togglePublish = async () => {
    setGroupsLoading(true)
    try {
      const res = await fetch("/api/groups/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: groupsEventId, isPublished: !isPublished }),
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
      setGroupsLoading(false)
    }
  }

  const moveToGroup = (memberId: string, newGroupNumber: number) => {
    setGroups((prev) =>
      prev.map((member) => (member.id === memberId ? { ...member, group_number: newGroupNumber } : member)),
    )
  }

  const handleDragStart = (member: GroupMember) => {
    setDraggedMember(member)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetGroupNumber: number) => {
    if (draggedMember && draggedMember.group_number !== targetGroupNumber) {
      moveToGroup(draggedMember.id!, targetGroupNumber)
    }
    setDraggedMember(null)
  }

  const handleTouchStart = (e: React.TouchEvent, member: GroupMember) => {
    setDraggedMember(member)
    setTouchStartY(e.touches[0].clientY)
    const target = e.currentTarget as HTMLElement
    setTouchCurrentElement(target)
    target.style.opacity = "0.5"
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggedMember || !touchCurrentElement) return

    e.preventDefault()
    const touch = e.touches[0]

    // Update element position to follow finger
    touchCurrentElement.style.position = "fixed"
    touchCurrentElement.style.zIndex = "1000"
    touchCurrentElement.style.top = `${touch.clientY - 20}px`
    touchCurrentElement.style.left = `${touch.clientX - 80}px`
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!draggedMember || !touchCurrentElement) return

    // Reset styles
    touchCurrentElement.style.opacity = "1"
    touchCurrentElement.style.position = "relative"
    touchCurrentElement.style.zIndex = "auto"
    touchCurrentElement.style.top = "auto"
    touchCurrentElement.style.left = "auto"

    // Find which group card is under the touch point
    const touch = e.changedTouches[0]
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY)

    for (const element of elements) {
      const groupCard = element.closest("[data-group-number]")
      if (groupCard) {
        const targetGroupNumber = Number(groupCard.getAttribute("data-group-number"))
        if (draggedMember.group_number !== targetGroupNumber) {
          moveToGroup(draggedMember.id!, targetGroupNumber)
        }
        break
      }
    }

    setDraggedMember(null)
    setTouchCurrentElement(null)
  }

  const saveChanges = async () => {
    setGroupsLoading(true)
    try {
      const res = await fetch("/api/groups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: groupsEventId,
          groups: groups.map((g) => ({
            event_id: g.event_id,
            member_name: g.member_name,
            phone_last4: g.phone_last4,
            book_genre: g.book_genre, // book_genre 필드 추가
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
      setGroupsLoading(false)
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

  const fetchEvents = async () => {
    try {
      setEventsLoading(true)
      console.log("[v0] Fetching events...")
      const res = await fetch("/api/events")
      const data = await res.json()
      console.log("[v0] Events response:", data)

      // API returns array directly
      if (Array.isArray(data)) {
        setEvents(data)
        console.log("[v0] Set events:", data.length, "events")
      } else {
        console.log("[v0] Unexpected response format, setting empty array")
        setEvents([])
      }
    } catch (error) {
      console.error("[v0] Error fetching events:", error)
      setEvents([])
    } finally {
      setEventsLoading(false)
    }
  }

  const fetchApplicants = async (eventId: string) => {
    try {
      setApplicantsLoading(true)
      console.log("[v0] Fetching applicants for event:", eventId)
      const res = await fetch(`/api/events/applications?eventId=${eventId}`)

      if (!res.ok) {
        console.error("[v0] API error:", res.status)
        setApplicants([])
        return
      }

      const data = await res.json()
      console.log("[v0] Applicants response:", data)

      if (Array.isArray(data)) {
        setApplicants(data)
        console.log("[v0] Set", data.length, "applicants")
      } else {
        console.log("[v0] Unexpected response format")
        setApplicants([])
      }
    } catch (error) {
      console.error("[v0] Error fetching applicants:", error)
      setApplicants([])
    } finally {
      setApplicantsLoading(false)
    }
  }

  const handleEventSubmit = async () => {
    console.log("[v0] Submitting event form:", eventForm)

    try {
      setEventsLoading(true)
      const method = editingEvent ? "PUT" : "POST"
      // Pass the content field to the body
      const body = editingEvent
        ? { ...eventForm, id: editingEvent.id, content: eventForm.content }
        : { ...eventForm, content: eventForm.content }

      console.log("[v0] Sending request:", { method, body })

      const res = await fetch("/api/events", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      console.log("[v0] Response:", { status: res.status, data })

      if (res.ok) {
        toast({
          title: editingEvent ? "이벤트 수정 완료" : "이벤트 생성 완료",
          description: editingEvent ? "이벤트가 수정되었습니다." : "새 이벤트가 생성되었습니다.",
        })
        setShowEventForm(false)
        setEditingEvent(null)
        setEventForm({
          title: "",
          description: "",
          content: "", // Reset content field
          thumbnail_url: "",
          detail_image_url: "",
          status: "ongoing",
          price: "", // Reset to empty string
          account_number: "",
          account_holder_name: "", // Reset account holder name
          event_date: "",
          event_time: "",
          location: "", // Reset location field
          short_location: "", // Reset short_location
        })
        fetchEvents()
      } else {
        console.error("[v0] Error response:", data)
        toast({
          title: "오류",
          description: data.error || "이벤트 저장에 실패했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Exception during event submit:", error)
      toast({
        title: "오류",
        description: "이벤트 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setEventsLoading(false)
    }
  }

  const handleEventDelete = async (id: string) => {
    if (!confirm("이벤트를 삭제하시겠습니까?")) return

    try {
      setEventsLoading(true)
      const res = await fetch(`/api/events/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast({
          title: "삭제 완료",
          description: "이벤트가 삭제되었습니다.",
        })
        fetchEvents()
      } else {
        toast({
          title: "오류",
          description: "이벤트 삭제에 실패했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "오류",
        description: "이벤트 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setEventsLoading(false)
    }
  }

  const handleEventImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "thumbnail_url" | "detail_image_url",
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement("canvas")
          let width = img.width
          let height = img.height

          // Max dimensions
          const MAX_WIDTH = 1200
          const MAX_HEIGHT = 1200

          // Calculate new dimensions
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = height * (MAX_WIDTH / width)
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = width * (MAX_HEIGHT / height)
              height = MAX_HEIGHT
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext("2d")
          ctx?.drawImage(img, 0, 0, width, height)

          // Compress image to JPEG with 0.7 quality
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7)

          console.log("[v0] Image compressed:", {
            originalSize: file.size,
            compressedSize: compressedDataUrl.length,
            dimensions: { width, height },
          })

          setEventForm((prev) => ({ ...prev, [field]: compressedDataUrl }))
        }
        img.src = reader.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="px-4 py-4 flex items-center justify-between">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </Link>
          <h1 className="text-xl font-bold text-green-600">관리자 대시보드</h1>
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-500" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="px-4 py-6">
        <div className="grid grid-cols-4 gap-2 mb-6">
          <button
            onClick={() => setActiveTab("qr")}
            className={`flex flex-col gap-1 items-center py-3 px-2 rounded-xl border-2 transition-colors ${
              activeTab === "qr"
                ? "bg-green-50 border-green-500 text-green-700"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <QrCode className="h-5 w-5" />
            <span className="text-xs font-medium">QR생성</span>
          </button>
          <button
            onClick={() => setActiveTab("hero")}
            className={`flex flex-col gap-1 items-center py-3 px-2 rounded-xl border-2 transition-colors ${
              activeTab === "hero"
                ? "bg-purple-50 border-purple-500 text-purple-700"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Upload className="h-5 w-5" />
            <span className="text-xs font-medium">히어로 관리</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("attendees")
              if (expectedAttendees.length === 0) fetchExpectedAttendees()
            }}
            className={`flex flex-col gap-1 items-center py-3 px-2 rounded-xl border-2 transition-colors ${
              activeTab === "attendees"
                ? "bg-blue-50 border-blue-500 text-blue-700"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Users className="h-5 w-5" />
            <span className="text-xs font-medium">참석자</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("records")
              if (attendances.length === 0) fetchAttendances()
            }}
            className={`flex flex-col gap-1 items-center py-3 px-2 rounded-xl border-2 transition-colors ${
              activeTab === "records"
                ? "bg-orange-50 border-orange-500 text-orange-700"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Calendar className="h-5 w-5" />
            <span className="text-xs font-medium">기록</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6">
          <Link href="/admin/group-toggle">
            <button className="w-full flex gap-2 items-center justify-center py-3 px-4 rounded-xl border-2 transition-colors bg-indigo-50 border-indigo-500 text-indigo-700 hover:bg-indigo-100">
              <UsersRound className="h-5 w-5" />
              <span className="font-medium">조 편성</span>
            </button>
          </Link>

          <button
            onClick={() => setActiveTab("events")}
            className={`flex gap-2 items-center justify-center py-3 px-4 rounded-xl border-2 transition-colors ${
              activeTab === "events"
                ? "bg-pink-50 border-pink-500 text-pink-700"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Calendar className="h-5 w-5" />
            <span className="font-medium">이벤트</span>
          </button>
        </div>

        {activeTab === "qr" && (
          <div className="space-y-6">
            <Card className="border-0 shadow-lg rounded-2xl">
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
                    onClick={handleDownloadQr}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    다운로드
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        )}

        {activeTab === "hero" && (
          <div className="space-y-6">
            {heroMessage && (
              <div
                className={`p-3 rounded-lg text-sm font-medium ${
                  heroMessage.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {heroMessage.text}
              </div>
            )}

            {/* Hero Mode Selection */}
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-t-2xl">
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <Upload className="h-5 w-5" />
                  히어로 모드 선택
                </CardTitle>
                <CardDescription>홈페이지 히어로 섹션의 표시 방식을 선택하세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer hover:bg-gray-50" style={{borderColor: heroMode === 'default' ? '#10b981' : '#e5e7eb'}}>
                    <input
                      type="radio"
                      name="hero_mode"
                      value="default"
                      checked={heroMode === "default"}
                      onChange={(e) => setHeroMode(e.target.value as "default")}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">기본 소개 모드</p>
                      <p className="text-sm text-gray-600">관리자가 업로드한 단체사진과 텍스트를 표시합니다</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer hover:bg-gray-50" style={{borderColor: heroMode === 'designated_reading' ? '#10b981' : '#e5e7eb'}}>
                    <input
                      type="radio"
                      name="hero_mode"
                      value="designated_reading"
                      checked={heroMode === "designated_reading"}
                      onChange={(e) => setHeroMode(e.target.value as "designated_reading")}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">지정독서 모드</p>
                      <p className="text-sm text-gray-600">책 표지 중심의 지정독서 정보를 표시합니다</p>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Default Mode Settings - Simple Image Upload */}
            {heroMode === "default" && (
              <Card className="border-0 shadow-lg rounded-2xl">
                <CardHeader className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-t-2xl">
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <Upload className="h-5 w-5" />
                    히어로 배경 이미지
                  </CardTitle>
                  <CardDescription>홈페이지 배경으로 표시될 단체사진을 업로드하세요</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <Label className="font-semibold">배경 이미지</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-green-500 transition-colors">
                      <input
                        id="default-image"
                        type="file"
                        accept="image/*"
                        onChange={handleDefaultImageChange}
                        className="hidden"
                      />
                      <label htmlFor="default-image" className="cursor-pointer">
                        {defaultImagePreview ? (
                          <div className="space-y-2">
                            <img
                              src={defaultImagePreview}
                              alt="Preview"
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <p className="text-sm text-gray-600">클릭하여 다른 이미지 선택</p>
                          </div>
                        ) : (
                          <div className="space-y-2 py-8">
                            <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                            <p className="text-sm text-gray-600">클릭하여 모임사진 업로드</p>
                            <p className="text-xs text-gray-500">권장: 16:9 또는 4:3 비율의 단체사진</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Designated Reading Mode Settings */}
            {heroMode === "designated_reading" && (
              <>
                <Card className="border-0 shadow-lg rounded-2xl">
                  <CardHeader className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-t-2xl">
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                      <Upload className="h-5 w-5" />
                      지정독서 노출 설정
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="designated-active"
                        checked={designatedIsActive}
                        onCheckedChange={(checked) => setDesignatedIsActive(checked as boolean)}
                      />
                      <label htmlFor="designated-active" className="font-semibold cursor-pointer">
                        지정독서 정보 노출 ON/OFF
                      </label>
                    </div>
                  </CardContent>
                </Card>

                {designatedIsActive && (
                  <Card className="border-0 shadow-lg rounded-2xl">
                    <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-t-2xl">
                      <CardTitle className="flex items-center gap-2 text-purple-700">
                        <Upload className="h-5 w-5" />
                        지정독서 상세 정보
                      </CardTitle>
                      <CardDescription>책 표지와 설명을 입력하세요</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                      <div className="space-y-2">
                        <Label className="font-semibold">책 제목</Label>
                        <Input
                          placeholder="예: 인간 실격"
                          value={designatedTitle}
                          onChange={(e) => setDesignatedTitle(e.target.value)}
                          className="rounded-xl"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="font-semibold">설명 문구</Label>
                        <Textarea
                          placeholder="책에 대한 설명을 입력하세요"
                          value={designatedDescription}
                          onChange={(e) => setDesignatedDescription(e.target.value)}
                          className="rounded-xl"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-semibold">버튼 문구</Label>
                          <Input
                            placeholder="예: 더 알아보기"
                            value={designatedButtonText}
                            onChange={(e) => setDesignatedButtonText(e.target.value)}
                            className="rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-semibold">버튼 링크</Label>
                          <Input
                            placeholder="/designated-reading"
                            value={designatedButtonLink}
                            onChange={(e) => setDesignatedButtonLink(e.target.value)}
                            className="rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="font-semibold">책 표지 업로드</Label>
                        <p className="text-sm text-gray-600 mb-2">이달의 지정독서 탭에서 책 표지를 업로드하세요</p>
                        <div className="bg-gray-50 p-4 rounded-xl text-center">
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">기본 소개 모드에서 "QR생성" 옆의 탭에서</p>
                          <p className="text-sm text-gray-600">이달의 지정독서 섹션으로 이동하여 업로드하세요</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Save Button */}
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardContent className="pt-6">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 rounded-xl font-semibold py-2"
                  onClick={handleSaveHeroSettings}
                  disabled={heroLoading}
                >
                  {heroLoading ? "저장 중..." : "히어로 설정 저장"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Keep book tab for featured book upload */}
        {activeTab === "hero" && heroMode === "designated_reading" && designatedIsActive && (
          <Card className="border-0 shadow-lg rounded-2xl mt-6">
            <CardHeader className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-t-2xl">
              <CardTitle className="flex items-center gap-2 text-pink-700">
                <Upload className="h-5 w-5" />
                지정독서 책 표지 업로드
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
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-pink-500 transition-colors">
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
                        <p className="text-xs text-gray-500">세로형 책 표지 이미지를 권장합니다</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-pink-600 hover:bg-pink-700 rounded-xl font-semibold"
                onClick={handleSubmitFeaturedBook}
                disabled={uploadingBook}
              >
                {uploadingBook ? "업로드 중..." : "책 표지 업로드"}
              </Button>
            </CardFooter>
          </Card>
        )}


        {activeTab === "attendees" && (
          <div className="space-y-6">
            {attendeesSuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl">
                {attendeesSuccess}
              </div>
            )}

            {attendeesError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">{attendeesError}</div>
            )}

            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-t-2xl">
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Users className="h-5 w-5" />
                  이벤트 선택
                </CardTitle>
                <CardDescription>예상 참석자를 관리할 이벤트를 선택하세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-6">
                <Label htmlFor="attendees-event-id" className="font-semibold">
                  이벤트 ID
                </Label>
                <Input
                  id="attendees-event-id"
                  placeholder="이벤트 ID 입력"
                  value={attendeesEventId}
                  onChange={(e) => setAttendeesEventId(e.target.value)}
                  className="rounded-xl"
                />
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold"
                  onClick={fetchExpectedAttendees}
                  disabled={attendeesLoading}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${attendeesLoading ? "animate-spin" : ""}`} />
                  목록 불러오기
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-t-2xl">
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <UserPlus className="h-5 w-5" />
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
                        className="bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold"
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
                        className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold"
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
              <CardHeader className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-t-2xl">
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Users className="h-5 w-5" />
                  참석자 목록
                </CardTitle>
                <CardDescription>총 {expectedAttendees.length}명의 예상 참석자가 등록되어 있습니다</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {attendeesLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
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
        )}

        {activeTab === "records" && (
          <div className="space-y-6">
            {recordsSuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl">
                {recordsSuccess}
              </div>
            )}

            {recordsError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">{recordsError}</div>
            )}

            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-t-2xl">
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <Calendar className="h-5 w-5" />
                  출석 데이터 필터
                </CardTitle>
                <CardDescription>날짜 범위와 이벤트 ID로 출석 데이터를 필터링하세요</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="records-event-id" className="font-semibold">
                      이벤트 ID (선택사항)
                    </Label>
                    <Input
                      id="records-event-id"
                      placeholder="이벤트 ID 입력"
                      value={recordsEventId}
                      onChange={(e) => setRecordsEventId(e.target.value)}
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
                  className="flex-1 bg-orange-600 hover:bg-orange-700 rounded-xl font-semibold"
                  onClick={fetchAttendances}
                  disabled={recordsLoading}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${recordsLoading ? "animate-spin" : ""}`} />
                  데이터 불러오기
                </Button>

                <Button
                  className="flex-1 rounded-xl font-semibold bg-transparent hover:bg-gray-100"
                  variant="outline"
                  onClick={() => applyFilters()}
                  disabled={recordsLoading}
                >
                  필터 적용
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-t-2xl">
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <FileDown className="h-5 w-5" />
                  데이터 관리
                </CardTitle>
                <CardDescription>출석 데이터를 내보내거나 삭제하세요</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 mb-4">
                  <Button
                    className="w-full bg-orange-600 hover:bg-orange-700 rounded-xl font-semibold"
                    onClick={handleDownloadCSV}
                    disabled={filteredAttendances.length === 0 || recordsLoading}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    CSV 다운로드
                  </Button>

                  <Button
                    className="w-full rounded-xl font-semibold bg-transparent hover:bg-gray-100"
                    variant="outline"
                    onClick={handleCopyToClipboard}
                    disabled={filteredAttendances.length === 0 || recordsLoading}
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
              <CardHeader className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-t-2xl">
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <Calendar className="h-5 w-5" />
                  출석 기록
                </CardTitle>
                <CardDescription>총 {filteredAttendances.length}개의 출석 기록이 있습니다</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {recordsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-700"></div>
                  </div>
                ) : filteredAttendances.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">출석 기록이 없습니다</p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} />
                      <span className="text-sm font-medium">모두 선택</span>
                    </div>
                    {filteredAttendances.map((attendance) => {
                      const date = new Date(attendance.timestamp)
                      const isSelected = selectedAttendances.includes(attendance.id)

                      return (
                        <div
                          key={attendance.id}
                          className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                            isSelected ? "bg-blue-50 border-2 border-blue-300" : "bg-gray-50 hover:bg-gray-100"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleSelectAttendance(attendance.id)}
                            />
                            <div>
                              <p className="font-medium text-gray-900">{attendance.name}</p>
                              <p className="text-xs text-gray-500">
                                {formatDate(date, "date")} {formatDate(date, "time")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {attendance.isLate ? (
                              <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                                지각
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                                출석
                              </Badge>
                            )}
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
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "groups" && (
          <div className="flex flex-col items-center justify-center py-12">
            <UsersRound className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">
              조 편성 기능이 이동되었습니다.
              <br />
              상단의 "조 편성" 버튼을 클릭하세요.
            </p>
          </div>
        )}

        {activeTab === "events" && (
          <div className="space-y-4">
            {selectedEventApplicants ? (
              <>
                <Card className="border-0 shadow-lg rounded-2xl">
                  <CardHeader className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-pink-700">{selectedEventApplicants.title}</CardTitle>
                        <CardDescription>신청자 목록</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedEventApplicants(null)
                          setApplicants([])
                        }}
                      >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        뒤로
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {applicantsLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-700"></div>
                      </div>
                    ) : applicants.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">신청자가 없습니다</p>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-3 mb-6">
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-blue-700">{applicants.length}</div>
                            <div className="text-xs text-blue-600 mt-1">전체 인원</div>
                          </div>
                          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-cyan-700">
                              {applicants.filter((a) => a.gender === "male").length}
                            </div>
                            <div className="text-xs text-cyan-600 mt-1">남자</div>
                          </div>
                          <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-rose-700">
                              {applicants.filter((a) => a.gender === "female").length}
                            </div>
                            <div className="text-xs text-rose-600 mt-1">여자</div>
                          </div>
                        </div>
                        {/* 신청자 목록 */}
                        <div className="space-y-2">
                          {applicants.map((applicant) => (
                            <div
                              key={applicant.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                            >
                              <div>
                                <p className="font-semibold text-gray-900">{applicant.applicant_name}</p>
                                <p className="text-sm text-gray-600">{applicant.phone}</p>
                                {applicant.gender && (
                                  <Badge variant="outline" className="mt-1 text-xs">
                                    {applicant.gender === "male" ? "남성" : "여성"}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(applicant.created_at).toLocaleDateString("ko-KR")}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card className="border-0 shadow-lg rounded-2xl">
                  <CardHeader className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-t-2xl">
                    <CardTitle className="flex items-center gap-2 text-pink-700">
                      <Calendar className="h-5 w-5" />
                      이벤트 관리
                    </CardTitle>
                    <CardDescription>이벤트를 생성하고 관리하세요</CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-6">
                    <Button
                      onClick={() => {
                        setShowEventForm(true)
                        setEditingEvent(null)
                        setEventForm({
                          title: "",
                          description: "",
                          content: "", // Reset content field
                          thumbnail_url: "",
                          detail_image_url: "",
                          status: "ongoing",
                          price: "",
                          account_number: "",
                          account_holder_name: "", // Reset account holder name
                          event_date: "", // Reset date
                          event_time: "", // Reset time
                          location: "", // Reset location field
                          short_location: "", // Reset short_location
                        })
                      }}
                      className="w-full bg-pink-600 hover:bg-pink-700 rounded-xl font-semibold"
                    >
                      새 이벤트 만들기
                    </Button>
                  </CardFooter>
                </Card>

                {showEventForm && (
                  <Card className="border-0 shadow-lg rounded-2xl">
                    <CardHeader className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-t-2xl">
                      <CardTitle className="text-pink-700">{editingEvent ? "이벤트 수정" : "새 이벤트"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                      <div className="space-y-2">
                        <Label htmlFor="event-title" className="font-semibold">
                          제목
                        </Label>
                        <Input
                          id="event-title"
                          value={eventForm.title}
                          onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                          placeholder="이벤트 제목"
                          className="rounded-xl"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="event-description" className="font-semibold">
                          설명
                        </Label>
                        <Textarea
                          id="event-description"
                          value={eventForm.description}
                          onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                          placeholder="이벤트 설명"
                          className="rounded-xl min-h-[100px]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="event-content" className="font-semibold">
                          이벤트 상세 설명 (게시글 형태)
                        </Label>
                        <Textarea
                          id="event-content"
                          value={eventForm.content}
                          onChange={(e) => setEventForm({ ...eventForm, content: e.target.value })}
                          placeholder="이벤트에 대한 상세한 설명을 작성하세요. 이 내용은 이벤트 상세 페이지에 게시글 형태로 표시됩니다."
                          className="rounded-xl min-h-[200px]"
                        />
                        <p className="text-xs text-gray-500">
                          마크다운 형식이나 일반 텍스트로 자유롭게 작성 가능합니다.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="event-status" className="font-semibold">
                          상태
                        </Label>
                        <select
                          id="event-status"
                          value={eventForm.status}
                          onChange={(e) =>
                            setEventForm({
                              ...eventForm,
                              status: e.target.value as "ongoing" | "completed" | "coming_soon",
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                        >
                          <option value="ongoing">진행중</option>
                          <option value="coming_soon">커밍순</option>
                          <option value="completed">완료</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="event-thumbnail" className="font-semibold">
                          썸네일 이미지
                        </Label>
                        <input
                          id="event-thumbnail"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleEventImageChange(e, "thumbnail_url")}
                          className="w-full"
                        />
                        {eventForm.thumbnail_url && (
                          <img
                            src={eventForm.thumbnail_url || "/placeholder.svg"}
                            alt="Thumbnail preview"
                            className="w-full h-32 object-cover rounded-lg mt-2"
                          />
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="event-detail-image" className="font-semibold">
                          상세 이미지
                        </Label>
                        <input
                          id="event-detail-image"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleEventImageChange(e, "detail_image_url")}
                          className="w-full"
                        />
                        {eventForm.detail_image_url && (
                          <img
                            src={eventForm.detail_image_url || "/placeholder.svg"}
                            alt="Detail image preview"
                            className="w-full h-48 object-cover rounded-lg mt-2"
                          />
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="event-price" className="font-semibold">
                          가격 (원)
                        </Label>
                        <Input
                          id="event-price"
                          type="text"
                          value={eventForm.price}
                          onChange={(e) => setEventForm({ ...eventForm, price: e.target.value })}
                          placeholder="예: 50,000원 또는 3분할 또는 무료"
                          className="rounded-xl"
                        />
                        <p className="text-xs text-gray-500">자유롭게 입력하세요 (예: "3분할", "무료", "50,000원")</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="event-account" className="font-semibold">
                          계좌번호
                        </Label>
                        <Input
                          id="event-account"
                          type="text"
                          value={eventForm.account_number}
                          onChange={(e) => setEventForm({ ...eventForm, account_number: e.target.value })}
                          placeholder="예: 카카오뱅크 3333-XX-XXXXXX"
                          className="rounded-xl"
                        />
                        <p className="text-xs text-gray-500">입금 받을 계좌번호를 입력하세요</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="event-account-holder" className="font-semibold">
                          예금주명
                        </Label>
                        <Input
                          id="event-account-holder"
                          type="text"
                          value={eventForm.account_holder_name}
                          onChange={(e) => setEventForm({ ...eventForm, account_holder_name: e.target.value })}
                          placeholder="예: 홍길동"
                          className="rounded-xl"
                        />
                        <p className="text-xs text-gray-500">계좌 소유자 이름을 입력하세요</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="event-date" className="font-semibold">
                          이벤트 날짜
                        </Label>
                        <Input
                          id="event-date"
                          type="date"
                          value={eventForm.event_date}
                          onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                          className="rounded-xl"
                        />
                        <p className="text-xs text-gray-500">이벤트가 열리는 날짜를 선택하세요</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="event-time" className="font-semibold">
                          이벤트 시간
                        </Label>
                        <Input
                          id="event-time"
                          type="time"
                          step="60"
                          value={eventForm.event_time}
                          onChange={(e) => setEventForm({ ...eventForm, event_time: e.target.value })}
                          className="rounded-xl"
                        />
                        <p className="text-xs text-gray-500">이벤트 시작 시간을 선택하세요</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="event-short-location" className="font-semibold">
                          썸네일 장소 (간단히)
                        </Label>
                        <Input
                          id="event-short-location"
                          type="text"
                          value={eventForm.short_location}
                          onChange={(e) => setEventForm({ ...eventForm, short_location: e.target.value })}
                          placeholder="예: 당산역 근처"
                          className="rounded-xl"
                        />
                        <p className="text-xs text-gray-500">이벤트 목록에 표시될 짧은 장소명</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="event-location" className="font-semibold">
                          상세 장소
                        </Label>
                        <Input
                          id="event-location"
                          type="text"
                          value={eventForm.location}
                          onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                          placeholder="예: 서울 영등포구 당산동3가 24 지하1층"
                          className="rounded-xl"
                        />
                        <p className="text-xs text-gray-500">이벤트 상세 페이지에 표시될 전체 주소</p>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowEventForm(false)
                          setEditingEvent(null)
                        }}
                        className="flex-1 rounded-xl"
                      >
                        취소
                      </Button>
                      <Button
                        onClick={handleEventSubmit}
                        disabled={eventsLoading || !eventForm.title}
                        className="flex-1 bg-pink-600 hover:bg-pink-700 rounded-xl font-semibold"
                      >
                        {eventsLoading ? "저장 중..." : editingEvent ? "수정" : "생성"}
                      </Button>
                    </CardFooter>
                  </Card>
                )}

                <Card className="border-0 shadow-lg rounded-2xl">
                  <CardHeader className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-t-2xl">
                    <CardTitle className="text-pink-700">이벤트 목록</CardTitle>
                    <CardDescription>총 {events.length}개의 이벤트가 있습니다</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {eventsLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-700"></div>
                      </div>
                    ) : events.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">등록된 이벤트가 없습니다</p>
                    ) : (
                      <div className="space-y-3">
                        {events.map((event) => (
                          <div
                            key={event.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                          >
                            {event.thumbnail_url && (
                              <img
                                src={event.thumbnail_url || "/placeholder.svg"}
                                alt={event.title}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{event.title}</h3>
                              <p className="text-xs text-gray-500 line-clamp-1">{event.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {event.status === "ongoing"
                                    ? "진행중"
                                    : event.status === "coming_soon"
                                      ? "커밍순"
                                      : "완료"}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedEventApplicants(event)
                                    fetchApplicants(event.id)
                                  }}
                                  className="text-xs text-green-600 hover:text-green-700 h-6 px-2"
                                >
                                  <Users className="h-3 w-3 mr-1" />
                                  신청자
                                </Button>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingEvent(event)
                                  setEventForm({
                                    title: event.title,
                                    description: event.description,
                                    content: event.content || "", // Load content when editing
                                    thumbnail_url: event.thumbnail_url || "",
                                    detail_image_url: event.detail_image_url || "",
                                    status: event.status,
                                    price: event.price || "",
                                    account_number: event.account_number || "",
                                    account_holder_name: event.account_holder_name || "",
                                    event_date: event.event_date || "",
                                    event_time: event.event_time || "",
                                    short_location: event.short_location || "", // Load short_location when editing
                                    location: event.location || "",
                                  })
                                  setShowEventForm(true)
                                }}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                수정
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEventDelete(event.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
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
