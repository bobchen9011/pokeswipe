import { useState, useRef, useImperativeHandle, forwardRef, useCallback, useEffect } from 'react'
import TinderCard from 'react-tinder-card'
import SwipeCard from './SwipeCard.jsx'

const CardContainer = forwardRef(function CardContainer(
  {
    cards,
    currentIndex,
    seenIds,
    myUploadIds,
    t,
    onSwipe,
    onCardClick,
    onLoopReset,
  },
  ref
) {
  const [glowDir, setGlowDir] = useState(null)
  const topCardRef = useRef(null)

  // Expose programmatic swipe to parent (Next button / keyboard)
  useImperativeHandle(ref, () => ({
    swipe: (dir) => topCardRef.current?.swipe(dir),
  }))

  const remaining = cards.slice(currentIndex)

  // When all seen, loop back
  useEffect(() => {
    if (cards.length > 0 && remaining.length === 0) {
      onLoopReset?.()
    }
  }, [cards.length, remaining.length, onLoopReset])

  if (cards.length === 0) {
    return (
      <div className="card-stack">
        <div className="empty-state">
          <div className="empty-ball">
            <svg className="empty-ball-svg" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="48" stroke="white" strokeWidth="4" />
              <line x1="2" y1="50" x2="98" y2="50" stroke="white" strokeWidth="4" />
              <circle cx="50" cy="50" r="12" fill="white" />
            </svg>
          </div>
          <div className="empty-title">{t('empty.title')}</div>
          <div
            className="empty-sub"
            dangerouslySetInnerHTML={{ __html: t('empty.sub') }}
          />
        </div>
      </div>
    )
  }

  // Show top 3 cards; render deepest first so top card is last in DOM (highest z)
  const topCards = remaining.slice(0, 3)
  const reversed = [...topCards].reverse()

  const handleSwipe = useCallback(
    (dir, card) => {
      setGlowDir(null)
      onSwipe(dir, card)
    },
    [onSwipe]
  )

  return (
    <div className="card-stack">
      {topCards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">{t('empty.title')}</div>
          <div
            className="empty-sub"
            dangerouslySetInnerHTML={{ __html: t('empty.done') }}
          />
        </div>
      ) : (
        reversed.map((card, revIdx) => {
          // revIdx 0 = deepest card, last revIdx = top card
          const depth = reversed.length - 1 - revIdx
          const isTop = depth === 0

          return (
            <TinderCard
              key={card.id}
              ref={isTop ? topCardRef : undefined}
              onSwipe={(dir) => isTop && handleSwipe(dir, card)}
              onCardLeftScreen={() => {}}
              onSwipeRequirementFulfilled={(dir) => isTop && setGlowDir(dir)}
              onSwipeRequirementUnfulfilled={() => isTop && setGlowDir(null)}
              preventSwipe={isTop ? ['up', 'down'] : ['left', 'right', 'up', 'down']}
              flickOnSwipe={isTop}
            >
              <SwipeCard
                card={card}
                depth={depth}
                isTop={isTop}
                glowDir={isTop ? glowDir : null}
                seenIds={seenIds}
                myUploadIds={myUploadIds}
                t={t}
                onTap={() => isTop && onCardClick(card)}
              />
            </TinderCard>
          )
        })
      )}
    </div>
  )
})

export default CardContainer
