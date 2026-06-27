import { createClient } from "@/lib/supabase/client"

export interface HeroSettings {
  id: string
  hero_mode: "default" | "designated_reading"
  default_image_url?: string
  designated_is_active: boolean
  designated_title?: string
  designated_description?: string
  designated_image_url?: string
  designated_button_text?: string
  designated_button_link?: string
  updated_at: string
}

export async function getHeroSettings(): Promise<HeroSettings | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("hero_settings").select("*").limit(1).single()

    if (error) {
      console.error("Error fetching hero settings:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getHeroSettings:", error)
    return null
  }
}

export async function updateHeroSettings(updates: Partial<HeroSettings>): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    // Get the existing settings row id
    const { data: existing, error: fetchError } = await supabase
      .from("hero_settings")
      .select("id")
      .limit(1)
      .single()

    if (fetchError || !existing) {
      // No row exists yet, insert a new one
      const { error: insertError } = await supabase.from("hero_settings").insert([
        {
          ...updates,
          updated_at: new Date().toISOString(),
        },
      ])

      if (insertError) {
        console.error("Error inserting hero settings:", insertError)
        return { success: false, error: insertError.message }
      }
      return { success: true }
    }

    const { error } = await supabase
      .from("hero_settings")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)

    if (error) {
      console.error("Error updating hero settings:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in updateHeroSettings:", error)
    return { success: false, error: "설정 업데이트 중 오류가 발생했습니다." }
  }
}
