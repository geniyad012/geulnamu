import { Metadata } from "next"
import EventsListClient from "./events-list-client"

export const metadata: Metadata = {
  title: "GEULNAMU - 이벤트",
  description: "글나무 독서모임의 다양한 이벤트를 만나보세요. 책과 사람을 연결하는 특별한 경험.",
  openGraph: {
    title: "GEULNAMU - 이벤트",
    description: "글나무 독서모임의 다양한 이벤트를 만나보세요. 책과 사람을 연결하는 특별한 경험.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "GEULNAMU - 이벤트",
    description: "글나무 독서모임의 다양한 이벤트를 만나보세요. 책과 사람을 연결하는 특별한 경험.",
  },
}

export default function EventsPage() {
  return <EventsListClient />
}
