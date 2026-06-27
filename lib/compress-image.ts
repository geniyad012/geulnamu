export interface CompressImageOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

export function compressImageDataUrl(
  dataUrl: string,
  { maxWidth = 1200, maxHeight = 1200, quality = 0.75 }: CompressImageOptions = {},
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let width = img.width
      let height = img.height

      if (width > height) {
        if (width > maxWidth) {
          height = height * (maxWidth / width)
          width = maxWidth
        }
      } else if (height > maxHeight) {
        width = width * (maxHeight / height)
        height = maxHeight
      }

      const canvas = document.createElement("canvas")
      canvas.width = Math.round(width)
      canvas.height = Math.round(height)

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Canvas context unavailable"))
        return
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL("image/jpeg", quality))
    }
    img.onerror = () => reject(new Error("Failed to load image"))
    img.src = dataUrl
  })
}

export function compressImageFile(
  file: File,
  options: CompressImageOptions = {},
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = async () => {
      try {
        const compressed = await compressImageDataUrl(reader.result as string, options)
        resolve(compressed)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}
