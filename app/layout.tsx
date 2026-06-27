import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import LayoutWrapper from "@/components/layout-wrapper"

export const metadata: Metadata = {
  title: "글나무 GEULNAMU - 독서모임",
  description:
    "책의 힘을 믿는 사람들, 글나무 독서모임. 매주 토요일 오전 10시 30분 정기모임. 자유독서와 책 소개, 사람들의 이야기가 함께하는 독서 커뮤니티.",
  keywords: [
    "글나무",
    "독서모임",
    "GEULNAMU",
    "독서",
    "책",
    "독서 커뮤니티",
    "토요일 독서모임",
    "지정독서",
    "자유독서",
  ],
  authors: [{ name: "글나무 GEULNAMU" }],
  openGraph: {
    title: "글나무 GEULNAMU - 독서모임",
    description: "책의 힘을 믿는 사람들. 매주 토요일 오전 10시 30분 정기모임",
    url: "https://geulnamu.vercel.app",
    siteName: "글나무 GEULNAMU",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "글나무 GEULNAMU 독서모임",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "글나무 GEULNAMU - 독서모임",
    description: "책의 힘을 믿는 사람들. 매주 토요일 오전 10시 30분 정기모임",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/favicon.png",
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
    generator: 'v0.app'
}



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
      </head>
      <body className="bg-white" style={{ fontFamily: "Pretendard, system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}>
          <div className="flex justify-center items-start min-h-screen bg-white">
            <div className="w-full max-w-[430px] bg-white">
              <LayoutWrapper>{children}</LayoutWrapper>
            </div>
          </div>
      </body>
    </html>
  )
}
