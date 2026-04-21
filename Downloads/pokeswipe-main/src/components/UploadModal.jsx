import { useState, useRef, useCallback } from 'react'
import { scanFile } from '../utils/ocr.js'
import { computeHash, canUpload, uploadsRemaining, incrementUpload, UPLOAD_LIMIT, saveLocalCode } from '../utils/storage.js'
import { getIdentity } from '../utils/identity.js'
import { isConfigured, getCloudName } from '../utils/cloudinary.js'

const MAX_SIZE = 15 * 1024 * 1024

export default function UploadModal({
  isOpen,
  onClose,
  onSuccess,
  myImages,
  onDeleteMyImage,
  knownCodes,
  knownHashes,
  t,
  showToast,
}) {
  const [previewUrl, setPreviewUrl]         = useState(null)
  const [previewStyle, setPreviewStyle]     = useState({ opacity: 0.3, filter: 'blur(3px)' })
  const [scanning, setScanning]             = useState(false)
  const [scanPct, setScanPct]               = useState(0)
  const [uploadReady, setUploadReady]       = useState(false)
  const [uploading, setUploading]           = useState(false)
  const [progress, setProgress]             = useState(0)
  const [isDragOver, setIsDragOver]         = useState(false)
  const [armedId, setArmedId]               = useState(null)

  const fileRef      = useRef(null)
  const pendingCode  = useRef(null)
  const pendingFile  = useRef(null)
  const pendingHash  = useRef(null)
  const fileInputRef = useRef(null)

  const quotaLeft = uploadsRemaining()

  // ── File picking ────────────────────────────────────────────────────────
  const handleFile = useCallback(async (file) => {
    if (!file.type.startsWith('image/')) { showToast(t('toast.err.type')); return }
    if (file.size > MAX_SIZE)             { showToast(t('toast.err.size')); return }
    if (!canUpload())                     { showToast(t('quota.empty')); return }
    if (scanning)                         return

    // Hash dedup (fastest, works even in private mode)
    const hash = await computeHash(file)
    if (hash && knownHashes.current.has(hash)) {
      showToast(t('verify.duplicate')); return
    }

    setScanning(true)
    setUploadReady(false)
    pendingCode.current = null
    pendingFile.current = null
    pendingHash.current = hash

    // Show blurry preview while scanning
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target.result)
      setPreviewStyle({ opacity: 0.3, filter: 'blur(3px)' })
    }
    reader.readAsDataURL(file)

    const onProgress = (pct) => {
      setScanPct(pct)
      setPreviewStyle({
        opacity: 0.3 + pct * 0.005,
        filter:  `blur(${Math.max(0, 3 - pct * 0.03)}px)`,
      })
    }

    const result = await scanFile(file, onProgress)
    setScanning(false)

    if (!result.ok) {
      resetDropZone()
      showToast(t(`verify.${result.reason}`))
      return
    }

    const code12 = result.code ?? null

    // Local & cross-device code dedup
    if (code12) {
      const localCodes = JSON.parse(localStorage.getItem('pokeswipe_codes') || '[]')
      if (localCodes.includes(code12)) { resetDropZone(); showToast(t('verify.duplicate')); return }
      if (knownCodes.current.has(code12)) { resetDropZone(); showToast(t('verify.duplicate')); return }
    }

    pendingCode.current = code12
    pendingFile.current = file
    setPreviewStyle({ opacity: 1, filter: 'none' })
    setUploadReady(true)
  }, [scanning, knownCodes, knownHashes, t, showToast])

  const resetDropZone = () => {
    setPreviewUrl(null)
    setPreviewStyle({ opacity: 0.3, filter: 'blur(3px)' })
    setUploadReady(false)
    setScanPct(0)
    pendingCode.current = null
    pendingFile.current = null
    pendingHash.current = null
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Upload ──────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    const file = pendingFile.current
    if (!file || !canUpload()) return

    setUploading(true)
    setProgress(0)

    try {
      if (isConfigured()) {
        // Read as base64 and POST to Netlify function
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target.result)
          reader.readAsDataURL(file)
        })

        const res = await fetch('/.netlify/functions/upload', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            base64,
            friendCode: pendingCode.current,
            imageHash:  pendingHash.current,
            uploaderId: getIdentity(),
          }),
        })

        // Simulate progress during upload
        const ticker = setInterval(() => setProgress((p) => Math.min(p + 0.08, 0.92)), 150)

        if (!res.ok) {
          clearInterval(ticker)
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || `HTTP ${res.status}`)
        }

        const data = await res.json()
        clearInterval(ticker)
        setProgress(1)

        const cloudName = getCloudName()
        const base      = `https://res.cloudinary.com/${cloudName}/image/upload`
        const newCard   = {
          id:          data.public_id,
          src:         `${base}/w_800,q_auto,f_auto/${data.public_id}`,
          thumb:       `${base}/w_400,q_auto,f_auto/${data.public_id}`,
          time:        data.created_at || new Date().toISOString(),
          friendCode:  pendingCode.current,
          imageHash:   pendingHash.current,
        }

        if (pendingCode.current) saveLocalCode(pendingCode.current)
        incrementUpload()
        onSuccess(newCard)
      } else {
        // Local storage fallback (no Cloudinary configured)
        const localCard = await localSave(file, pendingCode.current, setProgress)
        if (pendingCode.current) saveLocalCode(pendingCode.current)
        incrementUpload()
        showToast(t('toast.local'))
        onSuccess(localCard)
      }
    } catch (err) {
      console.error(err)
      showToast(`❌ ${t('toast.err.upload')}: ${err.message}`)
    } finally {
      setUploading(false)
      resetDropZone()
    }
  }

  // ── Drag & drop ─────────────────────────────────────────────────────────
  const handleDragOver = (e) => { e.preventDefault(); if (canUpload()) setIsDragOver(true) }
  const handleDragLeave = () => setIsDragOver(false)
  const handleDrop = (e) => {
    e.preventDefault(); setIsDragOver(false)
    const f = e.dataTransfer.files[0]; if (f) handleFile(f)
  }

  // ── My Uploads delete ────────────────────────────────────────────────────
  const handleDeleteClick = (id, friendCode) => {
    if (armedId === id) {
      setArmedId(null)
      onDeleteMyImage(id, friendCode)
      showToast(t('delete.done'))
    } else {
      setArmedId(id)
      setTimeout(() => setArmedId((cur) => cur === id ? null : cur), 2500)
    }
  }

  if (!isOpen) return null

  const btnText = scanning
    ? `${t('verify.scanning')} ${scanPct}%`
    : uploading ? t('upload.uploading')
    : uploadReady ? t('upload.ready')
    : canUpload() ? t('upload.idle')
    : t('quota.btn.limit')

  const quotaClass = quotaLeft === 0 ? 'quota-empty' : quotaLeft <= 2 ? 'quota-low' : 'quota-ok'

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-label={t('tab.upload')}>
        {/* Header */}
        <div className="modal-header">
          <span className="modal-title">{t('tab.upload')}</span>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Tip */}
        <p className="upload-tip">{t('upload.tip')}</p>

        {/* Quota */}
        <div className={`upload-quota ${quotaClass}`}>
          {quotaLeft === 0
            ? t('quota.empty')
            : t('quota.ok', { left: quotaLeft, total: UPLOAD_LIMIT })}
        </div>

        {/* Drop zone */}
        <div
          className={`drop-zone${previewUrl ? ' has-preview' : ''}${isDragOver ? ' dragover' : ''}`}
          onClick={() => { if (canUpload() && !scanning) fileInputRef.current?.click() }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          aria-label={t('upload.dropTitle')}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="preview" style={previewStyle} />
          ) : (
            <>
              <div className="drop-icon">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="drop-title">{t('upload.dropTitle')}</p>
              <p className="drop-desc" dangerouslySetInnerHTML={{ __html: t('upload.dropDesc') }} />
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => { if (e.target.files[0]) handleFile(e.target.files[0]) }}
        />

        {/* Progress bar */}
        <div className={`progress-bar${uploading ? '' : ' hidden'}`}>
          <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>

        {/* Upload button */}
        <button
          className="upload-btn"
          onClick={handleUpload}
          disabled={!uploadReady || uploading || scanning || !canUpload()}
        >
          {(scanning || uploading) && <span className="spinner" />}
          {btnText}
        </button>

        {/* My Uploads */}
        {myImages.length > 0 && (
          <div className="my-uploads">
            <p className="my-uploads-label">{t('myUploads.title')}</p>
            <div className="my-uploads-grid">
              {myImages.map((img) => (
                <div key={img.id} className="my-upload-item">
                  <img src={img.thumb || img.src} alt="" loading="lazy" />
                  <button
                    className={`my-upload-del${armedId === img.id ? ' armed' : ''}`}
                    aria-label={t('delete.btn')}
                    onClick={() => handleDeleteClick(img.id, img.friendCode)}
                  >
                    {armedId === img.id ? (
                      t('delete.confirm')
                    ) : (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Local-mode save (no Cloudinary) ─────────────────────────────────────────
function localSave(file, friendCode, onProgress) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const scale  = Math.min(1, 720 / img.width)
        canvas.width  = img.width  * scale
        canvas.height = img.height * scale
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        const src = canvas.toDataURL('image/jpeg', 0.7)
        const id  = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

        const stored = (() => { try { return JSON.parse(localStorage.getItem('pokeswipe_v2') || '[]') } catch { return [] } })()
        const newCard = { id, src, time: new Date().toISOString(), friendCode }
        stored.unshift(newCard)
        try { localStorage.setItem('pokeswipe_v2', JSON.stringify(stored.slice(0, 50))) } catch {}

        let p = 0
        const iv = setInterval(() => {
          p = Math.min(p + 0.12, 1)
          onProgress(p)
          if (p >= 1) { clearInterval(iv); resolve(newCard) }
        }, 80)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  })
}
