"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Copy, Calendar, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Event {
  id: string
  title: string
  price: string
  account_number?: string
  account_holder_name?: string
  event_date?: string
  event_time?: string
  location?: string
}

export default function RunplayEventApplicationPage() {
  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    gender: "",
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => alert("계좌번호가 복사되었습니다!"),
      (err) => console.error("[v0] Failed to copy:", err),
    )
  }

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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowPaymentModal(true)
  }

  const handlePaymentConfirmation = async () => {
    setSubmitting(true)

    try {
      const response = await fetch("/api/events/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: event?.id,
          ...formData,
        }),
      })

      const contentType = response.headers.get("content-type")
      let responseData

      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json()
      } else {
        const text = await response.text()
        console.error("[v0] Non-JSON response received:", text.substring(0, 200))
        throw new Error("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.")
      }

      if (!response.ok) {
        throw new Error(responseData.error || responseData.details || "Failed to submit application")
      }

      setShowPaymentModal(false)
      alert("신청이 완료되었습니다!")
      router.push(`/runplay/events/${params.id}`)
    } catch (error) {
      console.error("[v0] Error submitting application:", error)
      alert(`신청 중 오류가 발생했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handlePaymentCancel = () => {
    setShowPaymentModal(false)
    setSubmitting(false)
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

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-[430px] mx-auto p-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">{event.title}</h2>

          {event.event_date && (
            <div className="flex items-start gap-2 mb-2">
              <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">일시</p>
                <p className="text-sm text-gray-700">
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
            <div className="flex items-start gap-2 mb-2">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">장소</p>
                <p className="text-sm text-gray-700">{event.location}</p>
              </div>
            </div>
          )}

          <p className="text-gray-600 mb-2">가격: {event.price}</p>

          {event.account_number && (
            <div className="bg-yellow-50 rounded-lg p-3 mt-3 space-y-2">
              <p className="text-xs text-gray-500">입금 계좌</p>
              {event.account_holder_name && (
                <p className="text-sm text-gray-700">
                  예금주: <span className="font-medium">{event.account_holder_name}</span>
                </p>
              )}
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">{event.account_number}</p>
                <button
                  onClick={() => copyToClipboard(event.account_number!)}
                  className="p-2 hover:bg-yellow-100 rounded-lg transition-colors"
                  type="button"
                >
                  <Copy className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">(반드시 실명으로 입금 부탁드립니다!)</p>
            </div>
          )}
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                placeholder="이름을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                전화번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                placeholder="01012345678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                성별 <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white"
              >
                <option value="">성별을 선택하세요</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
              </select>
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black py-6 text-lg font-semibold rounded-xl disabled:bg-gray-400"
          >
            {submitting ? "신청 중..." : "신청 완료"}
          </Button>
        </form>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">입금 안내</h2>
            <p className="text-gray-700 text-center mb-6 leading-relaxed">실명으로 입금해야 신청이 완료됩니다!</p>
            <div className="space-y-3">
              <Button
                onClick={handlePaymentConfirmation}
                disabled={submitting}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black py-4 text-lg font-semibold rounded-xl disabled:bg-gray-400"
              >
                {submitting ? "신청 중..." : "입금 했어요!"}
              </Button>
              <Button
                onClick={handlePaymentCancel}
                disabled={submitting}
                variant="outline"
                className="w-full border-2 border-gray-300 hover:bg-gray-50 text-gray-700 py-4 text-lg font-semibold rounded-xl bg-transparent disabled:opacity-50"
              >
                아직 입금 안했어요
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
