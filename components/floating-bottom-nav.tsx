"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { BarChart3, Users, MessageSquare, Calendar } from "lucide-react"

const navItems = [
  { href: "/status", icon: BarChart3 },
  { href: "/groups", icon: Users },
  { href: "/questions", icon: MessageSquare },
  { href: "/events", icon: Calendar },
]

export default function FloatingBottomNav() {
  const pathname = usePathname()

  // 관리자 페이지나 특정 페이지에서는 보이지 않음
  const hiddenPages = ["/admin", "/scan", "/login", "/generate-qr"]
  if (hiddenPages.some((page) => pathname.startsWith(page))) {
    return null
  }

  // 현재 경로에 맞는 active item 찾기
  const activeItem = navItems.find((item) => pathname === item.href)

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <nav
        className="flex items-center gap-2 px-3 py-3 rounded-full bg-gradient-to-b from-emerald-800 to-emerald-900 shadow-2xl h-14"
        style={{
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeItem?.href === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                isActive
                  ? "bg-emerald-100 text-emerald-800"
                  : "text-emerald-200 hover:text-emerald-50"
              }`}
            >
              <Icon className="w-6 h-6" />
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
