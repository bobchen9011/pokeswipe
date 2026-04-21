import { useState, useRef, useCallback, useEffect } from 'react'
import Header        from './components/Header.jsx'
import CardContainer from './components/CardContainer.jsx'
import ActionButtons from './components/ActionButtons.jsx'
import UploadModal   from './components/UploadModal.jsx'
import Lightbox      from './components/Lightbox.jsx'
import HelpSheet     from './components/HelpSheet.jsx'
import Toast         from './components/Toast.jsx'
import { useI18n }   from './hooks/useI18n.js'
import { useCards }  from './hooks/useCards.js'
import { isConfigured } from './utils/cloudinary.js'

function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text)
  const ta = document.createElement('textarea')
  ta.value = text; ta.style.cssText = 'position:fixed;top:-9999px;opacity:0'
  document.body.appendChild(ta); ta.focus(); ta.select()
  try { document.execCommand('copy') } catch {}
  document.body.removeChild(ta); return Promise.resolve()
}

export default function App() {
  const { lang, t, changeLang, SUPPORTED } = useI18n()

  const {
    cards, currentIndex, myImages, seenIds, myUploadIds, loading,
    knownCodes, knownHashes,
    loadImages, advanceCard, resetLoop, addCard, deleteMyCard,
  } = useCards()

  const [isUploadOpen,  setIsUploadOpen]  = useState(false)
  const [lightboxCard,  setLightboxCard]  = useState(null)
  const [isHelpOpen,    setIsHelpOpen]    = useState(false)
  const [toast,         setToast]         = useState('')
  const [copied,        setCopied]        = useState(false)

  const cardContainerRef = useRef(null)

  const showToast = useCallback((msg) => setToast(msg), [])

  const currentCard = cards[currentIndex] ?? null
  const configured  = isConfigured()

  // ── Copy friend code ──────────────────────────────────────────────────
  const handleCopy = useCallback(() => {
    if (!currentCard) return
    if (!currentCard.friendCode) { setLightboxCard(currentCard); return }
    const c   = currentCard.friendCode
    const fmt = `${c.slice(0,4)} ${c.slice(4,8)} ${c.slice(8,12)}`
    copyText(fmt).then(() => {
      showToast(t('copy.done'))
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }, [currentCard, t, showToast])

  // ── Swipe handler (from TinderCard) ──────────────────────────────────
  const handleSwipe = useCallback((dir, card) => {
    if (dir === 'right') showToast(t('toast.swipeRight'))
    advanceCard(card?.id)
  }, [advanceCard, t, showToast])

  // ── Next (programmatic swipe via ref) ────────────────────────────────
  const handleNext = useCallback(() => {
    if (cards.slice(currentIndex).length === 0) return
    cardContainerRef.current?.swipe('left')
  }, [cards, currentIndex])

  // ── View / lightbox ───────────────────────────────────────────────────
  const handleView = useCallback(() => {
    if (currentCard) setLightboxCard(currentCard)
  }, [currentCard])

  // ── Upload success ────────────────────────────────────────────────────
  const handleUploadSuccess = useCallback((newCard) => {
    addCard(newCard)
    showToast(configured ? t('toast.uploaded') : t('toast.local'))
    setIsUploadOpen(false)
  }, [addCard, configured, t, showToast])

  // ── Loop reset (all cards seen) ───────────────────────────────────────
  const handleLoopReset = useCallback(() => {
    showToast(t('empty.loop'))
    resetLoop()
  }, [resetLoop, t, showToast])

  // ── Global keyboard shortcuts (modal-aware) ───────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (lightboxCard) { if (e.key === 'Escape') setLightboxCard(null); return }
      if (isHelpOpen)   { if (e.key === 'Escape') setIsHelpOpen(false);  return }
      if (isUploadOpen) { if (e.key === 'Escape') setIsUploadOpen(false); return }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [lightboxCard, isHelpOpen, isUploadOpen])

  // ── Progress bar width ────────────────────────────────────────────────
  const total    = cards.length
  const progress = total > 0 ? Math.round((currentIndex / total) * 100) : 0
  const dots     = total > 0 && total <= 12
    ? Array.from({ length: total }, (_, i) => ({
        cls: i === currentIndex  ? 'swipe-dot--current'
           : seenIds.has(cards[i]?.id) ? 'swipe-dot--seen'
           :                              'swipe-dot--unseen',
      }))
    : []

  return (
    <>
      <Header
        lang={lang}
        t={t}
        changeLang={changeLang}
        SUPPORTED={SUPPORTED}
        onHelp={() => setIsHelpOpen(true)}
      />

      <main className="app-layout">
        <div className="center-col">
          {!configured && (
            <div className="config-notice">
              <span dangerouslySetInnerHTML={{ __html: t('config.notice') }} />
            </div>
          )}

          {/* Progress dots + bar */}
          <div className="swipe-meta">
            <div className="swipe-count">
              {dots.map((d, i) => (
                <span key={i} className={`swipe-dot ${d.cls}`} />
              ))}
            </div>
            <span className="swipe-hint">
              {currentCard ? t('hint.next') : ''}
            </span>
          </div>

          <div className="swipe-progress-wrap">
            <div className="swipe-progress-fill" style={{ width: `${progress}%` }} />
          </div>

          {loading ? (
            <div className="card-stack">
              <div className="card-skeleton" />
            </div>
          ) : (
            <CardContainer
              ref={cardContainerRef}
              cards={cards}
              currentIndex={currentIndex}
              seenIds={seenIds}
              myUploadIds={myUploadIds}
              t={t}
              onSwipe={handleSwipe}
              onCardClick={setLightboxCard}
              onLoopReset={handleLoopReset}
            />
          )}

          <ActionButtons
            card={currentCard}
            onCopy={handleCopy}
            onNext={handleNext}
            onView={handleView}
            onUpload={() => setIsUploadOpen(true)}
            copied={copied}
            t={t}
          />
        </div>
      </main>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
        myImages={myImages}
        onDeleteMyImage={deleteMyCard}
        knownCodes={knownCodes}
        knownHashes={knownHashes}
        t={t}
        showToast={showToast}
      />

      <Lightbox
        card={lightboxCard}
        onClose={() => setLightboxCard(null)}
        t={t}
        showToast={showToast}
      />

      <HelpSheet
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        t={t}
      />

      <Toast message={toast} onClear={() => setToast('')} />
    </>
  )
}
