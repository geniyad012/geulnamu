"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { isLoggedIn } from "@/lib/auth"

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/admin/login")
    }
  }, [router])

  return <>{children}</>
}
