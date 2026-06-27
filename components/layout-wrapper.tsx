"use client"

import type React from "react"
import { useEffect } from "react"
import Link from "next/link"
import { Settings } from "lucide-react"
import { usePathname } from "next/navigation"
import FloatingBottomNav from "./floating-bottom-nav"

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isAdminPage = pathname.startsWith("/admin")
  const isMainPage = pathname === "/"
  const isRunplayPage = pathname.startsWith("/runplay")

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <>
      {!isAdminPage && !isMainPage && (
        <header className={`sticky top-0 z-50 border-b ${
          isRunplayPage 
            ? "bg-black border-yellow-500/20" 
            : "bg-white border-gray-200"
        }`}>
          <div className="max-w-[430px] mx-auto flex items-center justify-between px-4 py-3">
            <Link href={isRunplayPage ? "/runplay/events" : "/"}>
              <h1 className={`text-xl font-bold tracking-wide cursor-pointer transition-colors ${
                isRunplayPage 
                  ? "text-yellow-400 hover:text-yellow-300" 
                  : "text-black hover:text-green-600"
              }`}>
                {isRunplayPage ? "RUNPLAY" : "GEULNAMU"}
              </h1>
            </Link>
            {!isRunplayPage && (
              <Link href="/admin/login" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="h-5 w-5 text-gray-700" />
              </Link>
            )}
            {isRunplayPage && <div className="w-9" />}
          </div>
        </header>
      )}

      <main className={!isAdminPage ? "pb-24" : ""}>{children}</main>

      {!isAdminPage && !isRunplayPage && <FloatingBottomNav />}
    </>
  )
}
