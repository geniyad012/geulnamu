import { Metadata } from "next"
import RunplayEventDetailClient from "./event-detail-client"

interface Event {
  id: string
  title: string
  description: string
  thumbnail_url: string
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://geulnamu.vercel.app"
    const response = await fetch(`${baseUrl}/api/events/${params.id}`, {
      next: { revalidate: 60 },
    })
    if (!response.ok) throw new Error("Failed to fetch event")
    const event: Event = await response.json()

    return {
      title: `${event.title} - RUNPLAY`,
      description: event.description || "수요일 19:30, 여의도. 부담 없이 오래 달리기 위한 러닝 크루.",
      openGraph: {
        title: `${event.title} - RUNPLAY`,
        description: event.description || "수요일 19:30, 여의도. 부담 없이 오래 달리기 위한 러닝 크루.",
        siteName: "RUNPLAY",
        images: [
          {
            url: event.thumbnail_url || "/placeholder.svg",
            width: 1200,
            height: 630,
            alt: event.title,
          },
        ],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${event.title} - RUNPLAY`,
        description: event.description || "수요일 19:30, 여의도. 부담 없이 오래 달리기 위한 러닝 크루.",
        images: [event.thumbnail_url || "/placeholder.svg"],
      },
    }
  } catch (error) {
    return {
      title: "RUNPLAY",
      description: "수요일 19:30, 여의도. 부담 없이 오래 달리기 위한 러닝 크루.",
      openGraph: {
        title: "RUNPLAY",
        description: "수요일 19:30, 여의도. 부담 없이 오래 달리기 위한 러닝 크루.",
        siteName: "RUNPLAY",
      },
    }
  }
}

export default function RunplayEventDetailPage() {
  return <RunplayEventDetailClient />
}
