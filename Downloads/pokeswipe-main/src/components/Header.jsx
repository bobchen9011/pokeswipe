import { getShortIdentity } from '../utils/identity.js'

export default function Header({ lang, t, changeLang, SUPPORTED, onHelp }) {
  const trainerId = getShortIdentity()

  return (
    <header className="header">
      <span className="trainer-chip" title={`Trainer ID: ${trainerId}`}>
        🎮 {trainerId}
      </span>

      <div className="header-center">
        <div className="logo">
          Poke<span>Swipe</span>
        </div>
        <div className="subtitle">{t('subtitle')}</div>
      </div>

      <div className="header-right">
        <div className="lang-switcher" role="group" aria-label="Language">
          {SUPPORTED.map((code) => (
            <button
              key={code}
              className={`lang-btn${lang === code ? ' active' : ''}`}
              onClick={() => changeLang(code)}
              aria-pressed={lang === code}
            >
              {code}
            </button>
          ))}
        </div>
        <button
          className="help-btn"
          onClick={onHelp}
          aria-label="Help"
          title="Help"
        >
          ?
        </button>
      </div>
    </header>
  )
}
