const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || ''

export function isConfigured() {
  return !!CLOUD_NAME
}

export async function fetchImages(tag = 'pokeswipe') {
  if (!isConfigured()) return null

  const url = `https://res.cloudinary.com/${CLOUD_NAME}/image/list/${tag}.json`
  try {
    const res = await fetch(url)
    if (res.status === 401 || res.status === 403) return null
    if (res.status === 404) return []
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json()
    const base = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`

    return (data.resources || []).map((img) => {
      const tags     = img.tags || []
      const hashTag  = tags.find((t) => t.startsWith('hash_'))
      const imageHash = hashTag ? hashTag.slice(5) : null
      const fcMatch  = img.public_id.match(/fc_(\d{12})(?:$|[^0-9])/)
      const codeTag  = !fcMatch && tags.find((t) => t.startsWith('code_'))
      const friendCode = fcMatch ? fcMatch[1] : (codeTag ? codeTag.slice(5) : null)

      return {
        id:          img.public_id,
        src:         `${base}/w_800,q_auto,f_auto/${img.public_id}`,
        thumb:       `${base}/w_400,q_auto,f_auto/${img.public_id}`,
        time:        img.created_at,
        friendCode,
        imageHash,
      }
    })
  } catch (err) {
    console.warn('[Cloudinary] fetch error:', err.message)
    return null
  }
}

export function getCloudName() {
  return CLOUD_NAME
}
