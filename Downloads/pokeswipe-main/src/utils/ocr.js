import { createWorker } from 'tesseract.js'

// ── Image pre-processing ───────────────────────────────────────────────────
// Crops the top 5%–60% of a portrait screenshot, converts to grayscale,
// and enhances contrast so Tesseract can find the 12-digit friend code.
export function preprocessFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const isPortrait = img.height > img.width
        const srcY  = isPortrait ? Math.round(img.height * 0.05) : 0
        const srcH  = isPortrait ? Math.round(img.height * 0.55) : img.height
        const MAX   = 1400
        const scale = img.width > MAX ? MAX / img.width : 1
        const c     = document.createElement('canvas')
        c.width     = Math.round(img.width * scale)
        c.height    = Math.round(srcH * scale)
        const ctx   = c.getContext('2d')
        ctx.drawImage(img, 0, srcY, img.width, srcH, 0, 0, c.width, c.height)
        const id = ctx.getImageData(0, 0, c.width, c.height)
        const px = id.data
        for (let i = 0; i < px.length; i += 4) {
          const g = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]
          const v = Math.min(255, Math.max(0, (g - 128) * 1.8 + 128))
          px[i] = px[i + 1] = px[i + 2] = v
        }
        ctx.putImageData(id, 0, 0)
        resolve({ dataUrl: c.toDataURL('image/jpeg', 0.9), isPortrait })
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  })
}

// Same pre-processing but for a URL (used by lightbox re-scan).
export function preprocessUrl(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (img.height <= img.width) { resolve(null); return }
      const srcY  = Math.round(img.height * 0.05)
      const srcH  = Math.round(img.height * 0.55)
      const MAX   = 1400
      const scale = img.width > MAX ? MAX / img.width : 1
      const c     = document.createElement('canvas')
      c.width     = Math.round(img.width * scale)
      c.height    = Math.round(srcH * scale)
      const ctx   = c.getContext('2d')
      ctx.drawImage(img, 0, srcY, img.width, srcH, 0, 0, c.width, c.height)
      const id = ctx.getImageData(0, 0, c.width, c.height)
      const px = id.data
      for (let i = 0; i < px.length; i += 4) {
        const g = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]
        const v = Math.min(255, Math.max(0, (g - 128) * 1.8 + 128))
        px[i] = px[i + 1] = px[i + 2] = v
      }
      ctx.putImageData(id, 0, 0)
      resolve(c.toDataURL('image/jpeg', 0.9))
    }
    img.onerror = () => resolve(null)
    img.src = src
  })
}

// ── Extract 12-digit friend code from raw OCR text ─────────────────────────
export function extractCode(text) {
  const lines = text.split(/\r?\n/)
  // Pass 1: XXXX XXXX XXXX on a single line
  for (const line of lines) {
    const m = line.match(/(\d{4})\s+(\d{4})\s+(\d{4})/)
    if (m) {
      const code = m[1] + m[2] + m[3]
      if (code !== '000000000000') return code
    }
  }
  // Pass 2: 12 consecutive digits (OCR spacing lost)
  for (const line of lines) {
    const m = line.replace(/\s/g, '').match(/\d{12}/)
    if (m && m[0] !== '000000000000') return m[0]
  }
  return null
}

// ── Scan a File for a friend code ─────────────────────────────────────────
// Returns { ok: true, code: '123456789012' }
//       | { ok: true, skipped: true }          (Tesseract load failure → fail-open)
//       | { ok: false, reason: string }
export async function scanFile(file, onProgress) {
  const { dataUrl, isPortrait } = await preprocessFile(file)
  if (!isPortrait) return { ok: false, reason: 'wrongFormat' }

  try {
    const worker = await createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress)
          onProgress(Math.round(m.progress * 100))
      },
    })
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789 ',
      tessedit_pageseg_mode:   '11',
    })
    const { data } = await Promise.race([
      worker.recognize(dataUrl),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 25_000)),
    ])
    await worker.terminate()

    const code12 = extractCode(data.text)
    if (!code12) return { ok: false, reason: 'notFound' }
    return { ok: true, code: code12 }
  } catch {
    return { ok: true, skipped: true }
  }
}

// ── Re-scan an image URL (lightbox "Re-scan" button) ──────────────────────
export async function rescanUrl(src) {
  try {
    const processedUrl = await preprocessUrl(src)
    const worker = await createWorker('eng', 1, { logger: () => {} })
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789 ',
      tessedit_pageseg_mode:   '11',
    })
    const { data } = await Promise.race([
      worker.recognize(processedUrl || src),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 25_000)),
    ])
    await worker.terminate()
    return extractCode(data.text)
  } catch {
    return null
  }
}
