import { useState, useCallback, useEffect } from 'react'
import { dict, SUPPORTED } from '../i18n/translations.js'

const STORAGE_KEY = 'pokeswipe_lang'

function detect() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && SUPPORTED.includes(stored)) return stored
  const nav = (navigator.language || 'zh-TW').toLowerCase()
  if (nav.startsWith('zh')) return 'zh-TW'
  if (nav.startsWith('ja')) return 'ja'
  if (nav.startsWith('es')) return 'es'
  if (nav.startsWith('pt')) return 'pt'
  if (nav.startsWith('en')) return 'en'
  return 'zh-TW'
}

export function useI18n() {
  const [lang, setLang] = useState(() => detect())

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const t = useCallback(
    (key, vars) => {
      const strings = dict[lang] || dict['zh-TW']
      let str = strings[key] ?? dict['zh-TW'][key] ?? key
      if (vars) {
        str = str.replace(/\{(\w+)\}/g, (_, k) =>
          vars[k] !== undefined ? vars[k] : ''
        )
      }
      return str
    },
    [lang]
  )

  const changeLang = useCallback((newLang) => {
    if (!SUPPORTED.includes(newLang)) return
    setLang(newLang)
    localStorage.setItem(STORAGE_KEY, newLang)
  }, [])

  return { lang, t, changeLang, SUPPORTED }
}
