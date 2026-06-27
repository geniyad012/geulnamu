import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "글나무 GEULNAMU"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "#10b981",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 120,
          fontWeight: "bold",
          color: "white",
          marginBottom: 20,
        }}
      >
        GEULNAMU
      </div>
      <div
        style={{
          fontSize: 48,
          color: "white",
          opacity: 0.95,
        }}
      >
        책의 힘을 믿는 사람들
      </div>
    </div>,
    {
      ...size,
    },
  )
}
