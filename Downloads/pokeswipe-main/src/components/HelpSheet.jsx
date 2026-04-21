import { useEffect } from 'react'

export default function HelpSheet({ isOpen, onClose, t }) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const sections = ['s1', 's2', 's3']

  return (
    <>
      <div
        className={`help-overlay${isOpen ? ' visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`help-sheet${isOpen ? ' visible' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={t('help.title')}
        aria-hidden={!isOpen}
      >
        <div className="help-handle" />
        <h2 className="help-sheet-title">{t('help.title')}</h2>

        <div className="help-sections">
          {sections.map((k, i) => (
            <div key={k} className="help-section">
              <div className="help-section-num">{i + 1}</div>
              <div>
                <div className="help-section-title">{t(`help.${k}.title`)}</div>
                <div
                  className="help-section-body"
                  dangerouslySetInnerHTML={{ __html: t(`help.${k}.body`) }}
                />
              </div>
            </div>
          ))}
        </div>

        <button className="help-sheet-close" onClick={onClose}>
          {t('help.close')}
        </button>
      </div>
    </>
  )
}
