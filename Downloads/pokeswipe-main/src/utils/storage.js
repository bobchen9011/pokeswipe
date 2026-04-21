// localStorage key constants
const KEYS = {
  LOCAL_IMAGES:  'pokeswipe_v2',
  DELETED:       'pokeswipe_deleted',
  MY_IDS:        'pokeswipe_myids',
  SEEN:          'pokeswipe_seen',
  LAST_SEEN:     'pokeswipe_lastSeen',
  CODES:         'pokeswipe_codes',
  UPLOADS:       'pokeswipe_uploads_v2',
}

function safeGet(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}
function safeSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

// ── Local image storage (offline/fallback mode) ────────────────────────────
export function loadLocalImages() {
  return safeGet(KEYS.LOCAL_IMAGES, [])
}
export function saveLocalImages(imgs) {
  safeSet(KEYS.LOCAL_IMAGES, imgs.slice(0, 50))
}

// ── Soft-delete ────────────────────────────────────────────────────────────
export function getDeleted() {
  return new Set(safeGet(KEYS.DELETED, []))
}
export function markDeleted(id) {
  const s = getDeleted(); s.add(id)
  safeSet(KEYS.DELETED, [...s])
}

// ── My uploaded IDs (this device) ─────────────────────────────────────────
export function getMyIds() {
  return new Set(safeGet(KEYS.MY_IDS, []))
}
export function saveMyId(publicId) {
  const list = safeGet(KEYS.MY_IDS, [])
  if (!list.includes(publicId)) {
    list.push(publicId)
    if (list.length > 100) list.shift()
    safeSet(KEYS.MY_IDS, list)
  }
}
export function removeMyId(publicId) {
  safeSet(KEYS.MY_IDS, safeGet(KEYS.MY_IDS, []).filter((id) => id !== publicId))
}

// ── Seen IDs ───────────────────────────────────────────────────────────────
export function loadSeenIds() {
  return new Set(safeGet(KEYS.SEEN, []))
}
export function saveSeenId(id, seenSet) {
  seenSet.add(id)
  const arr = [...seenSet]
  if (arr.length > 500) arr.splice(0, arr.length - 500)
  safeSet(KEYS.SEEN, arr)
}

// ── Last-seen position ─────────────────────────────────────────────────────
export function getLastSeen() {
  return localStorage.getItem(KEYS.LAST_SEEN)
}
export function setLastSeen(id) {
  if (id) localStorage.setItem(KEYS.LAST_SEEN, id)
}
export function clearLastSeen() {
  localStorage.removeItem(KEYS.LAST_SEEN)
}

// ── Known friend codes (local dedup) ──────────────────────────────────────
export function getLocalCodes() {
  return safeGet(KEYS.CODES, [])
}
export function saveLocalCode(code12) {
  const list = getLocalCodes()
  if (!list.includes(code12)) {
    list.push(code12)
    if (list.length > 200) list.shift()
    safeSet(KEYS.CODES, list)
  }
}
export function removeLocalCode(code12) {
  safeSet(KEYS.CODES, getLocalCodes().filter((c) => c !== code12))
}
export function syncLocalCodes(knownCodesSet) {
  safeSet(KEYS.CODES, getLocalCodes().filter((c) => knownCodesSet.has(c)))
}

// ── Upload rate limiter ────────────────────────────────────────────────────
export const UPLOAD_LIMIT = 5

export function getUploadData() {
  const raw = safeGet(KEYS.UPLOADS, {})
  const today = new Date().toDateString()
  if (raw.date !== today) return { date: today, count: 0 }
  return raw
}
export function incrementUpload() {
  const d = getUploadData(); d.count++
  safeSet(KEYS.UPLOADS, d)
}
export function uploadsRemaining() {
  return Math.max(0, UPLOAD_LIMIT - getUploadData().count)
}
export function canUpload() {
  return uploadsRemaining() > 0
}

// ── SHA-256 image hash (dedup without OCR) ─────────────────────────────────
export async function computeHash(file) {
  try {
    const buf     = await file.arrayBuffer()
    const hashBuf = await crypto.subtle.digest('SHA-256', buf)
    return Array.from(new Uint8Array(hashBuf))
      .slice(0, 10).map((b) => b.toString(16).padStart(2, '0')).join('')
  } catch { return null }
}

// ── Time formatting ────────────────────────────────────────────────────────
export function timeAgo(iso) {
  if (!iso) return ''
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60)     return '剛剛'
  if (s < 3600)   return Math.floor(s / 60) + ' 分鐘前'
  if (s < 86400)  return Math.floor(s / 3600) + ' 小時前'
  if (s < 604800) return Math.floor(s / 86400) + ' 天前'
  return Math.floor(s / 604800) + ' 週前'
}
