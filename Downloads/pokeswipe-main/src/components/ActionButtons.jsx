import { useState, useEffect, useCallback } from 'react'

export default function ActionButtons({
  card,
  onCopy,
  onNext,
  onView,
  onUpload,
  copied,
  t,
}) {
  const [activeKbd, setActiveKbd] = useState(null)

  const flashKbd = useCallback((side) => {
    setActiveKbd(side)
    setTimeout(() => setActiveKbd(null), 280)
  }, [])

  // Keyboard shortcuts (registered here; also used in App for modals)
  useEffect(() => {
    const handler = (e) => {
      if (e.target.matches('input, textarea, select')) return
      if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(e.key)) {
        e.preventDefault(); onNext(); flashKbd('next')
      }
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault(); onCopy(); flashKbd('copy')
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault(); onView(); flashKbd('view')
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onNext, onCopy, onView, flashKbd])

  const hasCode  = !!card?.friendCode
  const formatted = hasCode
    ? `${card.friendCode.slice(0,4)} ${card.friendCode.slice(4,8)} ${card.friendCode.slice(8,12)}`
    : ''

  return (
    <div className="action-section">
      {/* Mobile full-width copy button */}
      <div className="copy-section">
        <button
          className={`copy-code-btn${copied ? ' copied' : ''}${!hasCode ? ' no-code' : ''}`}
          onClick={onCopy}
          aria-label={t('copy.btn')}
        >
          <span className="copy-btn-icon">
            {copied ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </span>
          <span className="copy-btn-text">
            {copied ? t('copy.done') : hasCode ? t('copy.btn') : t('copy.noCode')}
          </span>
          {hasCode && (
            <span className="copy-code-display">{formatted}</span>
          )}
        </button>
      </div>

      {/* Action row (view / copy / next / upload) */}
      <div className="action-row">
        {/* View QR */}
        <button
          className="action-btn action-btn--view"
          onClick={onView}
          aria-label={t('aria.view')}
          title={`${t('kbd.view')} [Space]`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>

        {/* Desktop copy (hidden on touch devices via CSS) */}
        <button
          className={`action-btn action-btn--copy${copied ? ' copied' : ''}`}
          onClick={onCopy}
          aria-label={t('copy.btn')}
          title={`${t('kbd.copy')} [C]`}
        >
          {copied ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>

        {/* Next */}
        <button
          className="action-btn action-btn--next"
          onClick={onNext}
          aria-label={t('aria.next')}
          title={`${t('kbd.next')} [→]`}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Upload */}
        <button
          className="action-btn action-btn--upload"
          onClick={onUpload}
          aria-label={t('tab.upload')}
          title={t('tab.upload')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </button>
      </div>

      {/* Keyboard hints (hidden on touch) */}
      <div className="kbd-row">
        <span className={`kbd-hint${activeKbd === 'view' ? ' active' : ''}`}>
          <kbd>Space</kbd> {t('kbd.view')}
        </span>
        <span className={`kbd-hint${activeKbd === 'copy' ? ' active' : ''}`}>
          <kbd>C</kbd> {t('kbd.copy')}
        </span>
        <span className={`kbd-hint${activeKbd === 'next' ? ' active' : ''}`}>
          <kbd>→</kbd> {t('kbd.next')}
        </span>
      </div>
    </div>
  )
}
