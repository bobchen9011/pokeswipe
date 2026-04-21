import { useRef } from 'react'
import { timeAgo } from '../utils/storage.js'

export default function SwipeCard({
  card,
  depth,
  isTop,
  glowDir,
  seenIds,
  myUploadIds,
  t,
  onTap,
}) {
  const downPos = useRef({ x: 0, y: 0 })

  const scale      = 1 - depth * 0.034
  const translateY = depth * -12
  const opacity    = depth === 0 ? 1 : Math.max(0.4, 0.6 - depth * 0.1)

  const glowClass = isTop
    ? glowDir === 'right' ? ' glow-right'
    : glowDir === 'left'  ? ' glow-left'
    : ''
    : ''

  const isOwn  = myUploadIds?.has(card.id)
  const isSeen = seenIds?.has(card.id)

  const badge = isOwn
    ? <span className="card-mine-badge">📤 我的上傳</span>
    : isSeen
    ? <span className="card-seen-badge">✓ 已看過</span>
    : null

  const handlePointerDown = (e) => {
    downPos.current = { x: e.clientX, y: e.clientY }
  }

  const handleClick = (e) => {
    if (!isTop || !onTap) return
    const dx = Math.abs(e.clientX - downPos.current.x)
    const dy = Math.abs(e.clientY - downPos.current.y)
    if (dx < 12 && dy < 12) onTap()
  }

  return (
    <div
      className={`card${glowClass}`}
      style={{
        transform: `scale(${scale}) translateY(${translateY}px)`,
        opacity,
        zIndex: 10 - depth,
      }}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      <img src={card.src} alt="friend code" draggable={false} loading="lazy" />

      {isTop && (
        <div className="card-tap-hint">👆 {t('hint.tap')}</div>
      )}

      <div className="card-foot">
        <span className="card-time">{timeAgo(card.time)}</span>
        {badge}
        <span className="card-badge">{t('card.badge')}</span>
      </div>
    </div>
  )
}
