import { useState, useEffect, useCallback } from 'react'
import { rescanUrl } from '../utils/ocr.js'

function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text)
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.cssText = 'position:fixed;top:-9999px;opacity:0'
  document.body.appendChild(ta); ta.focus(); ta.select()
  try { document.execCommand('copy') } catch {}
  document.body.removeChild(ta)
  return Promise.resolve()
}

export default function Lightbox({ card, onClose, t, showToast }) {
  const [copied,    setCopied]    = useState(false)
  const [scanning,  setScanning]  = useState(false)
  const [codeText,  setCodeText]  = useState('—')
  const [codeValue, setCodeValue] = useState(null)

  // Populate code bar whenever card changes
  useEffect(() => {
    setCopied(false)
    if (!card) return
    if (card.friendCode) {
      const c = card.friendCode
      setCodeText(`${c.slice(0,4)} ${c.slice(4,8)} ${c.slice(8,12)}`)
      setCodeValue(`${c.slice(0,4)} ${c.slice(4,8)} ${c.slice(8,12)}`)
    } else {
      setCodeText('—')
      setCodeValue(null)
    }
  }, [card])

  // Keyboard close
  useEffect(() => {
    if (!card) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [card, onClose])

  // Scroll lock
  useEffect(() => {
    document.body.style.overflow = card ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [card])

  const handleCopy = useCallback(() => {
    if (!codeValue) return
    copyText(codeValue).then(() => {
      showToast(t('copy.done'))
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }, [codeValue, t, showToast])

  const handleRescan = useCallback(async () => {
    if (!card?.src) return
    setScanning(true)
    setCodeText(t('lightbox.scanning'))
    setCodeValue(null)

    const code12 = await rescanUrl(card.src)
    setScanning(false)

    if (code12) {
      const fmt = `${code12.slice(0,4)} ${code12.slice(4,8)} ${code12.slice(8,12)}`
      setCodeText(fmt)
      setCodeValue(fmt)
    } else {
      setCodeText(t('lightbox.nocode'))
    }
  }, [card, t])

  if (!card) return null

  return (
    <div className="lightbox" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lightbox-inner">
        <img src={card.src} alt="friend code" />
      </div>

      {/* Code bar */}
      <div className="lightbox-code-bar">
        <span className="lbcode-num">{codeText}</span>
        <button
          className={`lbcode-copy${copied ? ' copied' : ''}`}
          onClick={handleCopy}
          disabled={!codeValue || scanning}
        >
          {copied ? t('copy.done').split('！')[0] + '！' : t('lightbox.copy')}
        </button>
        <button
          className="lbcode-rescan"
          onClick={handleRescan}
          disabled={scanning}
        >
          {scanning ? t('lightbox.scanning') : t('lightbox.rescan')}
        </button>
      </div>

      <p
        className="lightbox-caption"
        dangerouslySetInnerHTML={{ __html: t('lightbox.caption') }}
      />

      <button className="lightbox-close" onClick={onClose}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        {t('lightbox.close')}
      </button>
    </div>
  )
}
