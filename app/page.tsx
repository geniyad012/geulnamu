"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Clock, ExternalLink, Info, Settings, MapPin, Users } from "lucide-react"
import type { FeaturedBook } from "@/lib/featured-book"
import type { HeroSettings } from "@/lib/hero-settings"
import { getHeroSettings } from "@/lib/hero-settings"
import LatePreventionStats from "@/components/late-prevention-stats"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function Page() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [featuredBook, setFeaturedBook] = useState<FeaturedBook | null>(null)
  const [heroSettings, setHeroSettings] = useState<HeroSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDesignatedReadingDialogOpen, setIsDesignatedReadingDialogOpen] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load hero settings
        const settings = await getHeroSettings()
        setHeroSettings(settings)

        // Load featured book
        const response = await fetch("/api/featured-book")
        if (response.ok) {
          const book = await response.json()
          setFeaturedBook(book)
        } else {
          setFeaturedBook(null)
        }
      } catch (error) {
        console.error("Error loading data:", error)
        setFeaturedBook(null)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const getGoogleSearchUrl = (bookTitle: string) => {
    return `https://www.google.com/search?q=${encodeURIComponent(bookTitle)}`
  }

  const getTitleSizeClass = (title: string) => {
    const length = title.length
    if (length <= 10) return "text-3xl"
    if (length <= 15) return "text-2xl"
    if (length <= 20) return "text-xl"
    return "text-lg"
  }

  const namungiSeasons = [
    {
      id: 1,
      name: "봄",
      season: "Spring",
      image: "/images/1.png",
    },
    {
      id: 2,
      name: "여름",
      season: "Summer",
      image: "/images/2.png",
    },
    {
      id: 3,
      name: "가을",
      season: "Autumn",
      image: "/images/3.png",
    },
    {
      id: 4,
      name: "겨울",
      season: "Winter",
      image: "/images/4.png",
    },
  ]

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-[430px] mx-auto flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-black tracking-wide">GEULNAMU</h1>
          <Link href="/admin/login" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="h-5 w-5 text-gray-700" />
          </Link>
        </div>
      </header>

      <section>
        {loading ? (
          <div className="rounded-b-3xl shadow-lg w-full aspect-[4/3] overflow-hidden relative bg-gray-200 animate-pulse"></div>
        ) : heroSettings?.hero_mode === "designated_reading" && heroSettings?.designated_is_active && featuredBook ? (
          // 지정독서 모드
          <div
            className="rounded-b-3xl shadow-lg min-h-[500px] flex items-end bg-cover bg-center relative overflow-hidden"
            style={{ backgroundImage: `url(${featuredBook.imageUrl || "/placeholder.svg"})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>

            <div className="absolute top-8 right-8 z-10 flex flex-col items-end gap-3">
              <a
                href={getGoogleSearchUrl(featuredBook.title)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-105 transition-transform"
              >
                <div className="relative w-32 h-44 rounded-lg shadow-2xl overflow-hidden">
                  <Image
                    src={featuredBook.imageUrl || "/placeholder.svg"}
                    alt={featuredBook.title || "책 표지"}
                    fill
                    quality={75}
                    sizes="128px"
                    className="object-cover cursor-pointer"
                  />
                </div>
              </a>

              <a
                href={getGoogleSearchUrl(featuredBook.title)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-4 py-2 bg-white/95 hover:bg-white text-green-600 rounded-full text-sm font-semibold transition-colors shadow-lg"
              >
                어떤 책일까?
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="relative z-10 p-8 w-full">
              <Dialog open={isDesignatedReadingDialogOpen} onOpenChange={setIsDesignatedReadingDialogOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-1 mb-3 px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full text-sm font-medium transition-colors">
                    <Info className="w-4 h-4" />
                    지정독서란?
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-[380px] bg-white rounded-2xl p-6">
                  <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl font-bold text-gray-900">지정독서란?</DialogTitle>
                  </DialogHeader>

                  <div className="text-gray-700 leading-relaxed text-[15px]">
                    <p>
                      글나무는 평소 자유롭게 책을 읽고 이야기를 나누지만, 매달 마지막 주 토요일에는 운영진이 선정한
                      책으로 함께하는 지정독서 조가 열립니다. 책은 매달 초 공지되며, 리더가 된 운영진이 토론을
                      진행합니다. (지정독서외에 자유독서조도 원래대로 진행됩니다)
                    </p>
                  </div>
                </DialogContent>
              </Dialog>

              <h2 className="text-xl font-bold text-green-500 mb-2">이달의 지정독서</h2>
              {featuredBook.title && (
                <h3 className={`${getTitleSizeClass(featuredBook.title)} font-bold text-white leading-tight`}>
                  {featuredBook.title}
                </h3>
              )}
            </div>
          </div>
        ) : (
          // 기본 소개 모드 - 4:3 가로형 이미지
          <div className="rounded-b-3xl shadow-lg w-full aspect-[4/3] overflow-hidden relative bg-gray-200">
            {heroSettings?.default_image_url && (
              <Image
                src={heroSettings.default_image_url}
                alt="글나무 모임사진"
                fill
                priority
                quality={75}
                sizes="(max-width: 768px) 100vw, 900px"
                className="object-cover object-center"
              />
            )}
          </div>
        )}
      </section>

      {/* 글나무 소개 섹션 */}
      <section id="intro-section" className="px-4 py-8">
        <div className="max-w-[430px] mx-auto space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-gray-900">독서모임 글나무</h2>
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">GEULNAMU</p>
          </div>

          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p className="text-base">
              사람이 책을 기르고, 책이 사람을 키웁니다
            </p>

            <p className="text-base">
              쌓여가는 책과 이야기, 그리고 사람들 사이의 연결. 그 모든 것이 모여 한 그루의 나무처럼 자라납니다.
            </p>

            <p className="text-base font-semibold text-green-600">
              글로 자라는 나무, 글나무입니다
            </p>
          </div>
        </div>
      </section>

      {/* 일시 및 장소 안내 섹션 */}
      <section id="meeting-info-section" className="px-4 py-8">
        <div className="max-w-[430px] mx-auto space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-gray-900">일시 및 장소</h2>
            <p className="text-xs font-semibold text-green-600">언제, 어디서 만나나요?</p>
          </div>

          <div className="space-y-5 text-gray-700 leading-relaxed">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="h-4 w-4 text-green-600" />
                <p className="text-sm font-semibold text-gray-900">정기모임</p>
              </div>
              <p className="text-base">매주 토요일 오전 10시 30분</p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <MapPin className="h-4 w-4 text-green-600" />
                <p className="text-sm font-semibold text-gray-900">장소</p>
              </div>
              <p className="text-base">합정 근처 카페</p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Users className="h-4 w-4 text-green-600" />
                <p className="text-sm font-semibold text-gray-900">참여방법</p>
              </div>
              <p className="text-base">카카오톡 오픈채팅에서 투표하고 시간에 맞춰 참여합니다.</p>
            </div>
          </div>

          <div className="flex items-center gap-6 pt-4">
            <a
              href="https://open.kakao.com/o/gffIykxe"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:opacity-75 transition-opacity"
            >
              <img src="/icons/kakao.svg" alt="" className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-900">카카오톡</span>
            </a>
            <a
              href="https://www.instagram.com/geulnamu_official"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:opacity-75 transition-opacity"
            >
              <img src="/icons/instagram.png" alt="" className="h-5 w-5 flex-shrink-0 rounded" />
              <span className="text-sm font-medium text-gray-900">인스타그램</span>
            </a>
          </div>
        </div>
      </section>

      {/* TODO: Uncomment when late prevention campaign section is needed
      <section className="px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">지각 방지 캠페인</h2>
        <h3 className="text-sm font-semibold text-green-600 mb-6">지각 비율을 줄여주세요!</h3>
        <LatePreventionStats />
      </section>
      */}

      <section id="schedule-section" className="px-4 py-8">
        <h2 className="text-lg font-bold text-gray-900 mb-2">일정 안내</h2>
        <h3 className="text-xs font-semibold text-green-600 mb-5 uppercase tracking-wide">글나무와 함께하는 토요일 오전</h3>

        <div className="space-y-3">
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="relative w-full aspect-[16/9]">
              <Image
                src="/images/design-mode/E0536596-180A-4CB7-A882-C92EECC7EC2C_L0_001-2025.%204.%2021.%20%E1%84%8B%E1%85%A9%E1%84%92%E1%85%AE%205_53_16.jpg"
                alt="자유로운 착석&독서"
                fill
                quality={70}
                sizes="(max-width: 768px) 100vw, 430px"
                className="object-cover"
              />
            </div>
            <div className="p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Clock className="h-3 w-3 text-green-600" />
                <span className="text-sm font-semibold text-green-600">10:30 AM</span>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-0.5">자유로운 착석&독서</h3>
              <p className="text-sm text-gray-600">Settle In & Silent Reading</p>
            </div>
          </div>

          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="relative w-full aspect-[16/9]">
              <Image
                src="/images/design-mode/92DA334D-D932-42EA-BD84-1ACF024565EC_L0_001-2025.%204.%2021.%20%E1%84%8B%E1%85%A9%E1%84%92%E1%85%AE%205_53_51.jpg"
                alt="책 소개 및 이야기"
                fill
                quality={70}
                sizes="(max-width: 768px) 100vw, 430px"
                className="object-cover"
              />
            </div>
            <div className="p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Clock className="h-3 w-3 text-green-600" />
                <span className="text-sm font-semibold text-green-600">12:00 PM</span>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-0.5">책 소개 및 이야기</h3>
              <p className="text-sm text-gray-600">Group Sharing</p>
            </div>
          </div>

          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="relative w-full aspect-[16/9]">
              <Image
                src="/images/design-mode/855423B9-97A8-4DAC-9761-F0C4A796DF76_L0_001-2025.%204.%2021.%20%E1%84%8B%E1%85%A9%E1%84%92%E1%85%AE%205_54_03.jpg"
                alt="마무리 & 책 사진"
                fill
                quality={70}
                sizes="(max-width: 768px) 100vw, 430px"
                className="object-cover"
              />
            </div>
            <div className="p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Clock className="h-3 w-3 text-green-600" />
                <span className="text-sm font-semibold text-green-600">01:30 PM</span>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-0.5">마무리 & 책 사진</h3>
              <p className="text-sm text-gray-600">Wrap-up & Photos</p>
            </div>
          </div>
        </div>
      </section>

      {/* TODO: Uncomment when discord section is needed
      <section className="px-4 py-6">
        <a
          href="https://discord.com/invite/ECmNm4nFD5"
          target="_blank"
          rel="noopener noreferrer"
          className="block max-w-[430px] mx-auto"
        >
          <div className="bg-[#5865F2] rounded-2xl p-6 flex items-center justify-between hover:bg-[#4752C4] transition-colors shadow-lg">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1">글나무 디스코드 참여하기</h3>
              <p className="text-sm text-indigo-100">Join our Discord community</p>
            </div>
            <div className="flex-shrink-0 ml-4">
              <img src="/images/discord-logo.png" alt="Discord" className="w-16 h-16 object-contain" />
            </div>
          </div>
        </a>
      </section>
      */}



      {/* TODO: Uncomment when character section is needed
      <section id="namungi-section" className="px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">글나무 캐릭터</h2>
        <p className="text-sm font-semibold text-green-600 mb-6">많이 사랑해주세요!</p>

        <div className="grid grid-cols-2 gap-4">
          {namungiSeasons.map((character) => (
            <div
              key={character.id}
              className="bg-[#fbf4e4] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="aspect-square flex items-center justify-center p-6">
                <img
                  src={character.image || "/placeholder.svg"}
                  alt={character.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-4 text-center bg-white">
                <h3 className="font-semibold text-gray-900 mb-1">{character.name}</h3>
                <p className="text-sm text-gray-500">{character.season}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      */}

    </div>
  )
}
