const https = require('https')
const { URL } = require('url')

const CLOUD_NAME  = process.env.CLOUDINARY_CLOUD_NAME
const API_KEY     = process.env.CLOUDINARY_API_KEY
const API_SECRET  = process.env.CLOUDINARY_API_SECRET

function sha1(str) {
  const crypto = require('crypto')
  return crypto.createHash('sha1').update(str).digest('hex')
}

function postJson(url, payload, auth) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload)
    const parsed = new URL(url)
    const options = {
      hostname: parsed.hostname,
      path:     parsed.pathname + parsed.search,
      method:   'POST',
      headers: {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...(auth ? { Authorization: `Basic ${Buffer.from(auth).toString('base64')}` } : {}),
      },
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, body: data }) }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    return { statusCode: 503, body: JSON.stringify({ error: 'Cloudinary not configured' }) }
  }

  let payload
  try { payload = JSON.parse(event.body) } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const { base64, friendCode, imageHash, uploaderId } = payload
  if (!base64) return { statusCode: 400, body: JSON.stringify({ error: 'Missing base64' }) }

  const timestamp = Math.floor(Date.now() / 1000)

  // Build tags
  const tags = ['pokeswipe']
  if (imageHash)  tags.push(`hash_${imageHash}`)
  if (friendCode) tags.push(`code_${friendCode}`)
  if (uploaderId) tags.push(`uploader_${uploaderId}`)

  // Build public_id: use friend code if available
  const publicId = friendCode
    ? `pokeswipe/fc_${friendCode}_${timestamp}`
    : `pokeswipe/${timestamp}_${Math.random().toString(36).slice(2, 7)}`

  const tagsStr = tags.join(',')

  // Sign: sorted params + secret
  const sigStr = `public_id=${publicId}&tags=${tagsStr}&timestamp=${timestamp}${API_SECRET}`
  const signature = sha1(sigStr)

  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
  const uploadPayload = {
    file:       base64,
    api_key:    API_KEY,
    timestamp,
    public_id:  publicId,
    tags:       tagsStr,
    signature,
  }

  try {
    const result = await postJson(uploadUrl, uploadPayload)
    if (result.status !== 200) {
      return {
        statusCode: result.status,
        body: JSON.stringify({ error: result.body?.error?.message || 'Upload failed' }),
      }
    }
    return {
      statusCode: 200,
      body: JSON.stringify({
        public_id:  result.body.public_id,
        created_at: result.body.created_at,
      }),
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
