"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Calendar, ChevronLeft, MapPin } from "lucide-react"

interface Event {
  id: string
  title: string
  description: string
  thumbnail_url: string
  status: string
  price: string
  created_at: string
  event_date?: string
  event_time?: string
  short_location?: string
}

export default function EventsListClient() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/events")

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "Failed to fetch events")
        }

        const data = await response.json()
        setEvents(Array.isArray(data) ? data : [])
        setError(null)
      } catch (error) {
        console.error("[v0] Error fetching events:", error)
        setError(error instanceof Error ? error.message : "Unknown error")
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const ongoingEvents = events.filter((e) => e.status === "ongoing")
  const comingSoonEvents = events.filter((e) => e.status === "coming_soon")
  const completedEvents = events.filter((e) => e.status === "completed")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ongoing":
        return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">진행중</span>
      case "completed":
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">완료</span>
      case "coming_soon":
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">Coming Soon</span>
        )
      default:
        return null
    }
  }

  const renderEventCard = (event: Event) => (
    <Link key={event.id} href={`/events/${event.id}`}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="relative aspect-square">
          <img
            src={event.thumbnail_url || "/placeholder.svg?height=200&width=200"}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          {event.status === "coming_soon" && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-lg font-bold">Coming Soon</span>
            </div>
          )}
          {event.status === "completed" && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-lg font-bold">완료</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="mb-2">{getStatusBadge(event.status)}</div>
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{event.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-1">{event.description}</p>

          {event.event_date && (
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>
                {new Date(event.event_date).toLocaleDateString("ko-KR", {
                  month: "numeric",
                  day: "numeric",
                })}
                {event.event_time && ` ${event.event_time.substring(0, 5)}`}
              </span>
            </div>
          )}

          {event.short_location && (
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
              <MapPin className="h-3 w-3" />
              <span>{event.short_location}</span>
            </div>
          )}

          <div className="flex items-center justify-between mt-3 gap-2">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold text-black">{event.price || "무료"}</p>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault()
                window.location.href = `/events/${event.id}`
              }}
              className="px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-md transition-colors whitespace-nowrap"
            >
              신청하기
            </button>
          </div>
        </div>
      </div>
    </Link>
  )

  return (
      <div className="min-h-screen bg-white pb-20">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-[430px] mx-auto flex items-center justify-between px-4 py-3">
          <Link href="/" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </Link>
          <h1 className="text-base font-bold text-gray-900">이벤트</h1>
          <div className="w-8" />
        </div>
      </header>

      <div className="max-w-[430px] mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                <div className="aspect-square bg-gray-200"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <p className="text-red-600 font-semibold mb-2">이벤트를 불러올 수 없습니다</p>
            <p className="text-gray-500 text-sm mb-4">관리자 대시보드에서 먼저 SQL 스크립트를 실행해주세요</p>
            <p className="text-xs text-gray-400">{error}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">등록된 이벤트가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-8">
            {(ongoingEvents.length > 0 || comingSoonEvents.length > 0) && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">진행중인 이벤트</h2>
                <div className="grid grid-cols-2 gap-4">
                  {ongoingEvents.map(renderEventCard)}
                  {comingSoonEvents.map(renderEventCard)}
                </div>
              </div>
            )}

            {completedEvents.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">완료된 이벤트</h2>
                <div className="grid grid-cols-2 gap-4">{completedEvents.map(renderEventCard)}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
