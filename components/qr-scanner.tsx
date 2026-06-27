"use client"

import { useEffect, useRef } from "react"
import { Html5Qrcode } from "html5-qrcode"

interface QrScannerProps {
  onScan: (decodedText: string) => void
}

export default function QrScanner({ onScan }: QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const isScanning = useRef(false)

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("qr-reader")
    scannerRef.current = html5QrCode

    // 카메라 스캔 시작
    html5QrCode
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // QR 코드 스캔 성공 시 콜백
          isScanning.current = false
          onScan(decodedText)
          html5QrCode.stop().catch((err) => {
            console.log("[v0] Scanner already stopped:", err)
          })
        },
        (errorMessage) => {
          // 오류는 무시 (계속 스캔)
        },
      )
      .then(() => {
        isScanning.current = true
      })
      .catch((err) => {
        console.error("QR 코드 스캐너 시작 오류:", err)
        isScanning.current = false
      })

    return () => {
      if (scannerRef.current && isScanning.current) {
        isScanning.current = false
        scannerRef.current
          .stop()
          .then(() => {
            console.log("[v0] Scanner stopped successfully")
          })
          .catch((err) => {
            // Ignore abort errors during cleanup
            if (err.name !== "AbortError") {
              console.error("QR 코드 스캐너 정지 오류:", err)
            }
          })
      }
    }
  }, [onScan])

  return <div id="qr-reader" className="w-full h-full" />
}
