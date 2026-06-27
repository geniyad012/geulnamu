"use client"

import { useEffect, useState } from "react"

interface MonthlyStats {
  month: number // 1-12
  lateRate: number // 지각률
  totalAttendees: number
  lateAttendees: number
}

export default function LatePreventionStats() {
  const [stats, setStats] = useState<MonthlyStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/late-stats")

        if (!response.ok) {
          setError("Failed to fetch")
          setLoading(false)
          return
        }
        const data = await response.json()
        setStats(data.stats)
        setCurrentYear(data.year)
      } catch (err) {
        setError("Failed to fetch")
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (error) {
    return null
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const now = new Date()
  const currentMonth = now.getMonth() + 1 // 1-12
  const isCurrentYear = now.getFullYear() === currentYear

  const statsMap = new Map<number, MonthlyStats>()
  stats.forEach((stat) => {
    statsMap.set(stat.month, stat)
  })

  const rows = [
    [1, 2, 3, 4], // 1월~4월
    [5, 6, 7, 8], // 5월~8월
    [9, 10, 11, 12], // 9월~12월
  ]

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h3 className="text-lg font-bold text-gray-900">{currentYear}</h3>
      </div>

      {rows.map((monthsInRow, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-4 gap-3">
          {monthsInRow.map((month) => {
            const stat = statsMap.get(month)
            const isFutureMonth = isCurrentYear && month > currentMonth

            return (
              <div key={month} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500 mb-1 text-center">{month}월</p>
                {isFutureMonth || !stat ? (
                  <p className="text-xl font-bold text-gray-300 text-center">-</p>
                ) : (
                  <>
                    <p
                      className={`text-xl font-bold text-center ${
                        stat.lateRate <= 10 ? "text-green-600" : stat.lateRate <= 30 ? "text-amber-600" : "text-red-500"
                      }`}
                    >
                      {stat.lateRate}%
                    </p>
                    <p className="text-xs text-gray-400 text-center mt-1">
                      {stat.lateAttendees}/{stat.totalAttendees}
                    </p>
                  </>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
