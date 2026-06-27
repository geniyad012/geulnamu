"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Copy, Check, Calendar, MapPin } from "lucide-react"

interface Event {
  id: string
  title: string
  description: string
  content?: string
  thumbnail_url: string
  detail_image_url: string
  status: string
  price: string
  account_number?: string
  account_holder_name?: string
  event_date?: string
  event_time?: string
  location?: string
}

export default function RunplayEventDetailClient() {
  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${params.id}`)
        if (!response.ok) throw new Error("Failed to fetch event")
        const data = await response.json()
        setEvent(data)
      } catch (error) {
        console.error("[v0] Error fetching event:", error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchEvent()
    }
  }, [params.id])

  const handleCopyAccount = async () => {
    if (!event?.account_number) return

    try {
      await navigator.clipboard.writeText(event.account_number)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const handleApply = () => {
    router.push(`/runplay/events/${event?.id}/apply`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">이벤트를 찾을 수 없습니다</p>
      </div>
    )
  }

  const canApply = event.status === "ongoing"

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-32">
        <div className="w-full overflow-x-hidden">
          <div className="mx-auto">
            {/* 썸네일 이미지를 히어로 섹션으로 표시 */}
            <img
              src={event.thumbnail_url || "/placeholder.svg?height=400&width=400"}
              alt={event.title}
              className="w-full aspect-square object-cover"
            />

            <div className="px-4 sm:px-6 py-6 bg-white">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{event.title}</h1>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-6">{event.description}</p>

              {event.content && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="prose prose-sm max-w-none">
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words">{event.content}</div>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">상태</span>
                  <span
                    className={`font-semibold ${
                      event.status === "ongoing"
                        ? "text-yellow-600"
                        : event.status === "coming_soon"
                          ? "text-blue-600"
                          : "text-gray-500"
                    }`}
                  >
                    {event.status === "ongoing" ? "진행 중" : event.status === "coming_soon" ? "커밍순" : "완료"}
                  </span>
                </div>

                {event.event_date && (
                  <div className="flex items-start gap-2">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700">날짜:</p>
                      <p className="text-sm text-gray-600 break-words">
                        {new Date(event.event_date).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          weekday: "short",
                        })}
                        {event.event_time && ` ${event.event_time.substring(0, 5)}`}
                      </p>
                    </div>
                  </div>
                )}

                {event.location && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700">장소:</p>
                      <p className="text-sm text-gray-600 break-words">{event.location}</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-600">참가비</span>
                  <span className="font-semibold text-gray-900">{event.price}</span>
                </div>

                {event.account_number && (
                  <div className="pt-2 border-t border-gray-100 space-y-2">
                    {event.account_holder_name && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">예금주</span>
                        <span className="font-medium text-gray-900">{event.account_holder_name}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-gray-600">계좌번호</span>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-sm text-gray-900 overflow-x-auto">{event.account_number}</span>
                        <button
                          onClick={handleCopyAccount}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                          title="계좌번호 복사"
                          type="button"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-yellow-600" />
                          ) : (
                            <Copy className="h-4 w-4 text-gray-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 상세 이미지를 하단에 표시 */}
              {event.detail_image_url && (
                <div className="mt-6">
                  <img
                    src={event.detail_image_url || "/placeholder.svg"}
                    alt={`${event.title} 상세 이미지`}
                    className="w-full rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]"
        style={{ zIndex: 9999, paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="w-full mx-auto p-4">
          <div className="max-w-[430px] mx-auto">
            <button
              onClick={handleApply}
              disabled={!canApply}
              type="button"
              className={`w-full py-4 text-lg font-bold rounded-xl transition-all ${
                canApply
                  ? "bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black shadow-lg active:scale-[0.98]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {event.status === "ongoing" ? "신청하기" : event.status === "coming_soon" ? "준비 중입니다" : "신청 마감"}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
