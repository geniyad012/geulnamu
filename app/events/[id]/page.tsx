import { Metadata } from "next"
import EventDetailClient from "./event-detail-client"

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
      title: event.title,
      description: event.description,
      openGraph: {
        title: event.title,
        description: event.description,
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
        title: event.title,
        description: event.description,
        images: [event.thumbnail_url || "/placeholder.svg"],
      },
    }
  } catch (error) {
    return {
      title: "GEULNAMU - 이벤트",
      description: "글나무 독서모임 이벤트",
    }
  }
}

export default function EventDetailPage() {
  return <EventDetailClient />
}
