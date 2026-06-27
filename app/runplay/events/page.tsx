import { Metadata } from "next"
import RunplayEventsListClient from "./events-list-client"

export const metadata: Metadata = {
  title: "RUNPLAY - 이벤트",
  description: "수요일 19:30, 여의도. 부담 없이 오래 달리기 위한 러닝 크루.",
  openGraph: {
    title: "RUNPLAY - 이벤트",
    description: "수요일 19:30, 여의도. 부담 없이 오래 달리기 위한 러닝 크루.",
    siteName: "RUNPLAY",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RUNPLAY - 이벤트",
    description: "수요일 19:30, 여의도. 부담 없이 오래 달리기 위한 러닝 크루.",
  },
}

export default function RunplayEventsPage() {
  return <RunplayEventsListClient />
}
