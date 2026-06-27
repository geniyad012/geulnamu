"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Lock, User } from "lucide-react"
import { login, isLoggedIn } from "@/lib/auth"

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isLoggedIn()) {
      router.push("/admin")
    }
  }, [router])

  const handleLogin = () => {
    setError("")
    setLoading(true)

    if (!username || !password) {
      setError("아이디와 비밀번호를 모두 입력해주세요.")
      setLoading(false)
      return
    }

    const success = login(username, password)

    if (success) {
      router.push("/admin")
    } else {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="px-4 py-4 flex items-center justify-between">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </Link>
          <h1 className="text-xl font-bold text-green-600">관리자 로그인</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <div className="px-4 py-8">
        <Card className="border-0 shadow-lg rounded-2xl">
          <CardHeader className="bg-gradient-to-br from-green-50 to-blue-50 rounded-t-2xl">
            <CardTitle className="text-green-700">관리자 로그인</CardTitle>
            <CardDescription>QR 코드 생성을 위해 로그인하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-1 font-semibold">
                <User className="h-4 w-4" />
                아이디
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="관리자 아이디 입력"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-1 font-semibold">
                <Lock className="h-4 w-4" />
                비밀번호
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleLogin()
                  }
                }}
                className="rounded-xl"
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-xl">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-green-600 hover:bg-green-700 rounded-xl font-semibold"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
