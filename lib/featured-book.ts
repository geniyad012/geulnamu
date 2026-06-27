import { createClient } from "@/lib/supabase/client"

export type FeaturedBook = {
  id: string
  title: string
  description: string
  imageUrl: string
  createdAt: string
  updatedAt: string
}

// Get featured book
export async function getFeaturedBook(): Promise<FeaturedBook | null> {
  try {
    const response = await fetch("/api/featured-book")
    if (!response.ok) {
      console.error("[v0] Featured book API 오류:", response.statusText)
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("[v0] Featured book 조회 중 예외 발생:", error)
    return null
  }
}

// Update or create featured book
export async function updateFeaturedBook(
  imageUrl: string,
  title: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    // Check if featured book exists
    const { data: existingData, error: checkError } = await supabase
      .from("featured_book")
      .select("id")
      .limit(1)
      .maybeSingle()

    if (checkError) {
      console.error("[v0] Featured book 확인 오류:", checkError)
      return { success: false, error: checkError.message }
    }

    if (existingData) {
      // Update existing
      const { error } = await supabase
        .from("featured_book")
        .update({
          title: title,
          description: "",
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingData.id)

      if (error) {
        console.error("[v0] Featured book 업데이트 오류:", error)
        return { success: false, error: error.message }
      }
    } else {
      // Create new
      const { error } = await supabase.from("featured_book").insert({
        title: title,
        description: "",
        image_url: imageUrl,
      })

      if (error) {
        console.error("[v0] Featured book 생성 오류:", error)
        return { success: false, error: error.message }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Featured book 업데이트 중 예외 발생:", error)
    return { success: false, error: "서버 오류가 발생했습니다." }
  }
}
