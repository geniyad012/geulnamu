"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, MessageSquare, Users, ChevronRight, Calendar, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface Question {
  id: string
  question_date: string
  group_number: number
  author_name: string
  phone_last4: string
  content: string
  created_at: string
}

export default function QuestionsPage() {
  const [dates, setDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null)
  const [availableGroups, setAvailableGroups] = useState<number[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    groupNumber: "",
    authorName: "",
    content: "",
    password: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null)
  const [passwordInput, setPasswordInput] = useState("")
  const [editContent, setEditContent] = useState("")

  useEffect(() => {
    loadDates()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      loadAvailableGroups(selectedDate)
    }
  }, [selectedDate])

  useEffect(() => {
    if (selectedDate && selectedGroup) {
      loadQuestions(selectedDate, selectedGroup)
    }
  }, [selectedDate, selectedGroup])

  const loadDates = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("questions")
        .select("question_date")
        .order("question_date", { ascending: false })

      if (error) throw error

      const uniqueDates = Array.from(
        new Set(
          (data || [])
            .map((item) => item.question_date)
            .filter((date): date is string => typeof date === "string" && date.length > 0)
        )
      )
      setDates(uniqueDates)
    } catch (error) {
      console.error("[v0] Failed to load dates:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableGroups = async (date: string) => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from("questions")
        .select("group_number")
        .eq("question_date", date)
        .order("group_number", { ascending: true })

      if (error) throw error

      const validGroups = (data || [])
        .map((item) => item.group_number)
        .filter((num): num is number => num !== null && num !== undefined && typeof num === "number" && !isNaN(num))

      const groups = [...new Set(validGroups)].sort((a, b) => a - b)
      setAvailableGroups(groups)
    } catch (error) {
      console.error("[v0] Failed to load available groups:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadQuestions = async (date: string, group: number) => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("question_date", date)
        .eq("group_number", group)
        .order("created_at", { ascending: false })

      if (error) throw error
      setQuestions(data || [])
    } catch (error) {
      console.error("[v0] Failed to load questions:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTodayDateString = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const questionDate = selectedDate ?? getTodayDateString()

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("questions")
        .insert([{
          question_date: questionDate,
          group_number: parseInt(formData.groupNumber),
          author_name: formData.authorName,
          content: formData.content,
          password: formData.password,
        }])

      if (error) throw error

      setIsDialogOpen(false)
      setFormData({
        groupNumber: "",
        authorName: "",
        content: "",
        password: "",
      })
      if (!selectedDate) {
        setSelectedDate(questionDate)
      }
      loadDates()
      const groupNum = parseInt(formData.groupNumber)
      if (groupNum && !isNaN(groupNum)) {
        setSelectedGroup(groupNum)
        loadQuestions(questionDate, groupNum)
      } else if (selectedDate && selectedGroup) {
        loadQuestions(selectedDate, selectedGroup)
      }
    } catch (error) {
      console.error("[v0] Failed to submit question:", error)
      alert("질문 등록에 실패했습니다")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (question: Question) => {
    setEditingQuestion(question)
    setEditContent(question.content)
    setPasswordInput("")
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingQuestion) return

    setSubmitting(true)
    try {
      const supabase = createClient()
      
      // First verify password
      const { data: question, error: fetchError } = await supabase
        .from("questions")
        .select("password")
        .eq("id", editingQuestion.id)
        .single()

      if (fetchError || !question) {
        alert("질문을 찾을 수 없습니다")
        return
      }

      if (question.password !== passwordInput) {
        alert("비밀번호가 일치하지 않습니다")
        return
      }

      const { error } = await supabase
        .from("questions")
        .update({ content: editContent })
        .eq("id", editingQuestion.id)

      if (error) throw error

      setIsEditDialogOpen(false)
      setEditingQuestion(null)
      setPasswordInput("")
      setEditContent("")
      if (selectedDate && selectedGroup) {
        loadQuestions(selectedDate, selectedGroup)
      }
    } catch (error) {
      console.error("[v0] Failed to update question:", error)
      alert("질문 수정에 실패했습니다")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteClick = (questionId: string) => {
    setDeletingQuestionId(questionId)
    setPasswordInput("")
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deletingQuestionId) return

    setSubmitting(true)
    try {
      const supabase = createClient()
      
      // First verify password
      const { data: question, error: fetchError } = await supabase
        .from("questions")
        .select("password")
        .eq("id", deletingQuestionId)
        .single()

      if (fetchError || !question) {
        alert("질문을 찾을 수 없습니다")
        return
      }

      if (question.password !== passwordInput) {
        alert("비밀번호가 일치하지 않습니다")
        return
      }

      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", deletingQuestionId)

      if (error) throw error

      setIsDeleteDialogOpen(false)
      setDeletingQuestionId(null)
      setPasswordInput("")
      if (selectedDate && selectedGroup) {
        loadQuestions(selectedDate, selectedGroup)
      }
    } catch (error) {
      console.error("[v0] Failed to delete question:", error)
      alert("질문 삭제에 실패했습니다")
    } finally {
      setSubmitting(false)
    }
  }

  const getGroupsForDate = () => {
    return Array.from({ length: 8 }, (_, i) => i + 1)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-[430px] mx-auto flex items-center justify-between px-4 py-3">
          <Link href="/" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </Link>
          <h1 className="text-base font-bold text-gray-900">토론 질문</h1>
          <div className="w-8"></div>
        </div>
      </header>

      <div className="max-w-[430px] mx-auto p-4">
        <div className="mb-5">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg py-2 font-semibold text-sm">
                <Plus className="w-4 h-4 mr-1.5" />
                질문 작성하기
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[380px] bg-white rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">질문 작성</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="groupNumber" className="text-sm font-medium text-gray-700">
                    조 선택
                  </Label>
                  <Select
                    value={formData.groupNumber}
                    onValueChange={(value) => setFormData({ ...formData, groupNumber: value })}
                    required
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="조를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {getGroupsForDate().map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}조
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="authorName" className="text-sm font-medium text-gray-700">
                    이름 (or 별명)
                  </Label>
                  <Input
                    id="authorName"
                    placeholder="이름 또는 별명을 입력하세요"
                    value={formData.authorName}
                    onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="content" className="text-sm font-medium text-gray-700">
                    질문 내용
                  </Label>
                  <Textarea
                    id="content"
                    placeholder="질문을 작성하세요"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    required
                    className="mt-1 min-h-[120px]"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    비밀번호 (4자리 숫자)
                  </Label>
                  <Input
                    id="password"
                    type="text"
                    inputMode="numeric"
                    placeholder="1234"
                    maxLength={4}
                    value={formData.password}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "")
                      setFormData({ ...formData, password: value })
                    }}
                    required
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">수정/삭제 시 필요합니다</p>
                </div>

                <Button type="submit" disabled={submitting} className="w-full bg-green-600 hover:bg-green-700">
                  {submitting ? "등록 중..." : "질문 등록"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-[380px] bg-white rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">질문 수정</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <Label htmlFor="editContent" className="text-sm font-medium text-gray-700">
                  질문 내용
                </Label>
                <Textarea
                  id="editContent"
                  placeholder="질문을 작성하세요"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  required
                  className="mt-1 min-h-[120px]"
                />
              </div>

              <div>
                <Label htmlFor="editPassword" className="text-sm font-medium text-gray-700">
                  비밀번호
                </Label>
                <Input
                  id="editPassword"
                  type="text"
                  inputMode="numeric"
                  placeholder="1234"
                  maxLength={4}
                  value={passwordInput}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "")
                    setPasswordInput(value)
                  }}
                  required
                  className="mt-1"
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full bg-green-600 hover:bg-green-700">
                {submitting ? "수정 중..." : "수정 완료"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-[380px] bg-white rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">질문 삭제</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleConfirmDelete} className="space-y-4">
              <p className="text-sm text-gray-600">정말 이 질문을 삭제하시겠습니까?</p>

              <div>
                <Label htmlFor="deletePassword" className="text-sm font-medium text-gray-700">
                  비밀번호
                </Label>
                <Input
                  id="deletePassword"
                  type="text"
                  inputMode="numeric"
                  placeholder="1234"
                  maxLength={4}
                  value={passwordInput}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "")
                    setPasswordInput(value)
                  }}
                  required
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1">
                  취소
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1 bg-red-600 hover:bg-red-700">
                  {submitting ? "삭제 중..." : "삭제"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {!selectedDate && (
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              날짜별 질문
            </h2>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  </div>
                ))}
              </div>
            ) : dates.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 text-center text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>아직 등록된 질문이 없습니다</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {dates.map((date) => (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className="w-full bg-white rounded-lg p-3 flex items-center justify-between hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <span className="font-semibold text-gray-900 text-sm">{formatDate(date)}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedDate && !selectedGroup && (
          <div>
            <button
              onClick={() => setSelectedDate(null)}
              className="flex items-center gap-2 text-gray-600 mb-4 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">뒤로 가기</span>
            </button>

            <h2 className="text-sm font-bold text-gray-900 mb-3">{formatDate(selectedDate)} - 조 선택</h2>
            {loading ? (
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-10 mx-auto mb-1.5"></div>
                    <div className="h-3 bg-gray-200 rounded w-6 mx-auto"></div>
                  </div>
                ))}
              </div>
            ) : availableGroups.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5 text-center text-gray-500">
                  <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">이 날짜에는 등록된 질문이 없습니다</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-2">

                {availableGroups.map((num) => (
                  <button
                    key={num}
                    onClick={() => setSelectedGroup(num)}
                    className="bg-white rounded-lg p-4 flex flex-col items-center justify-center hover:bg-green-50 transition-colors shadow-sm"
                  >
                    <Users className="w-6 h-6 text-green-600 mb-1.5" />
                    <span className="font-bold text-gray-900 text-sm">{num}조</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedDate && selectedGroup && (
          <div>
            <button
              onClick={() => setSelectedGroup(null)}
              className="flex items-center gap-2 text-gray-600 mb-4 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">뒤로 가기</span>
            </button>

            <h2 className="text-sm font-bold text-gray-900 mb-3">
              {formatDate(selectedDate)} - {selectedGroup}조
            </h2>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-lg p-3 animate-pulse">
                    <div className="h-3 bg-gray-200 rounded w-1/4 mb-1.5"></div>
                    <div className="h-5 bg-gray-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : questions.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5 text-center text-gray-500">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">이 조에는 아직 질문이 없습니다</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {questions.map((question) => (
                  <Card key={question.id} className="border-0 shadow-sm rounded-lg">
                    <CardHeader className="pb-2 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-xs font-semibold text-gray-900">{question.author_name}</CardTitle>
                          <p className="text-[10px] text-gray-500 mt-1">
                            {new Date(question.created_at).toLocaleDateString("ko-KR")}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleEdit(question)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(question.id)}
                            className="p-1 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 p-3">
                      <p className="text-gray-700 text-xs whitespace-pre-wrap leading-relaxed">{question.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
