"use client"

import type React from "react"

import Link from "next/link"
import { Settings } from "lucide-react"
import { usePathname } from "next/navigation"
import FloatingBottomNav from "./floating-bottom-nav"

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // 관리자 페이지인지 확인
  const isAdminPage = pathname.startsWith("/admin")

  // 관리자 페이지면 레이아웃 적용하지 않음
  if (isAdminPage) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-[430px] mx-auto flex items-center justify-between px-4 py-3">
          <Link href="/">
            <h1 className="text-xl font-bold text-black tracking-wide cursor-pointer hover:text-green-600 transition-colors">
              GEULNAMU
            </h1>
          </Link>
          <Link href="/admin/login" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="h-5 w-5 text-gray-700" />
          </Link>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main>{children}</main>

      {/* 플로팅 하단 네비게이터 */}
      <FloatingBottomNav />
    </div>
  )
}
