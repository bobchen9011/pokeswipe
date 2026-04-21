import { useState, useRef, useCallback, useEffect } from 'react'
import { fetchImages, isConfigured } from '../utils/cloudinary.js'
import {
  loadLocalImages, saveLocalImages,
  getDeleted, getMyIds, saveMyId, removeMyId,
  loadSeenIds, saveSeenId,
  getLastSeen, setLastSeen, clearLastSeen,
  getLocalCodes, syncLocalCodes,
} from '../utils/storage.js'

const REFRESH_COOLDOWN = 5 * 60 * 1000

export function useCards() {
  const [cards, setCards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [myImages, setMyImages] = useState([])
  const [seenIds, setSeenIds] = useState(new Set())
  const [myUploadIds, setMyUploadIds] = useState(new Set())
  const [loading, setLoading] = useState(true)

  // Mutable refs for dedup Sets (don't need to trigger re-renders)
  const knownCodes  = useRef(new Set())
  const knownHashes = useRef(new Set())
  const lastFetchAt = useRef(0)

  const loadImages = useCallback(async () => {
    setLoading(true)
    lastFetchAt.current = Date.now()

    let allImages = []
    let gotCloud  = false

    if (isConfigured()) {
      const cloud = await fetchImages('pokeswipe')
      if (cloud) { allImages = cloud; gotCloud = true }
      else        { allImages = loadLocalImages() }
    } else {
      allImages = loadLocalImages()
    }

    allImages.sort((a, b) => new Date(b.time) - new Date(a.time))

    const deleted   = getDeleted()
    const myIds     = getMyIds()

    // Build cross-device dedup Sets
    knownCodes.current.clear()
    knownHashes.current.clear()
    allImages.forEach((img) => {
      if (img.friendCode) knownCodes.current.add(img.friendCode)
      if (img.imageHash)  knownHashes.current.add(img.imageHash)
    })

    // Sync local code cache so deleted cloud images are removed
    if (gotCloud) syncLocalCodes(knownCodes.current)

    const seen   = loadSeenIds()
    const myImgs = allImages.filter((img) => myIds.has(img.id) && !deleted.has(img.id))
    const pool   = allImages.filter((img) => !deleted.has(img.id))

    let startIndex = 0
    const lastId = getLastSeen()
    if (lastId) {
      const idx = pool.findIndex((img) => img.id === lastId)
      if (idx > -1) startIndex = idx + 1
    }

    setCards(pool)
    setMyImages(myImgs)
    setMyUploadIds(myIds)
    setSeenIds(seen)
    setCurrentIndex(startIndex)
    setLoading(false)
  }, [])

  useEffect(() => { loadImages() }, [loadImages])

  const advanceCard = useCallback((cardId) => {
    if (cardId) {
      setLastSeen(cardId)
      setSeenIds((prev) => {
        const next = new Set(prev)
        saveSeenId(cardId, next)
        return next
      })
    }
    setCurrentIndex((prev) => prev + 1)
  }, [])

  // When all cards are viewed, loop back to the beginning
  const resetLoop = useCallback(() => {
    clearLastSeen()
    setCurrentIndex(0)
  }, [])

  const addCard = useCallback((newCard) => {
    setCards((prev) => {
      if (prev.some((c) => c.id === newCard.id)) return prev
      return [newCard, ...prev]
    })
    setMyImages((prev) => {
      if (prev.some((c) => c.id === newCard.id)) return prev
      return [newCard, ...prev]
    })
    setMyUploadIds((prev) => {
      const next = new Set(prev)
      next.add(newCard.id)
      return next
    })
    if (newCard.friendCode) knownCodes.current.add(newCard.friendCode)
    if (newCard.imageHash)  knownHashes.current.add(newCard.imageHash)
    saveMyId(newCard.id)
    setCurrentIndex(0)
    clearLastSeen()
  }, [])

  const deleteMyCard = useCallback((id, friendCode) => {
    setMyImages((prev) => prev.filter((img) => img.id !== id))
    setCards((prev) => prev.filter((img) => img.id !== id))
    setMyUploadIds((prev) => { const next = new Set(prev); next.delete(id); return next })
    if (friendCode) {
      knownCodes.current.delete(friendCode)
      // Remove from local dedup cache so re-upload is allowed
      const list = getLocalCodes().filter((c) => c !== friendCode)
      localStorage.setItem('pokeswipe_codes', JSON.stringify(list))
    }
    removeMyId(id)
  }, [])

  const refreshCooldownMs = useCallback(() => {
    return Math.max(0, REFRESH_COOLDOWN - (Date.now() - lastFetchAt.current))
  }, [])

  return {
    cards,
    currentIndex,
    myImages,
    seenIds,
    myUploadIds,
    loading,
    knownCodes,   // ref – access via .current
    knownHashes,  // ref – access via .current
    loadImages,
    advanceCard,
    resetLoop,
    addCard,
    deleteMyCard,
    refreshCooldownMs,
  }
}
