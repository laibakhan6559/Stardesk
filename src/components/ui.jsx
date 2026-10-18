import { useEffect, useState } from 'react'

export function Win({ title, children, className = '', actions, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className={`win ${open ? '' : 'is-closed'} ${className}`}>
      <header className="win-bar">
        <h2>{title}</h2>
        <div className="win-btns">
          {actions}
          <button type="button" aria-label="Expand window" onClick={() => setOpen(true)}>
            ▢
          </button>
          <button type="button" aria-label="Minimize window" onClick={() => setOpen(false)}>
            _
          </button>
          <button type="button" aria-label={open ? 'Collapse window' : 'Open window'} onClick={() => setOpen((o) => !o)}>
            ×
          </button>
        </div>
      </header>
      {open && <div className="win-body">{children}</div>}
    </section>
  )
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="win modal" role="dialog" aria-modal="true" aria-label={title}>
        <header className="win-bar">
          <h2>{title}</h2>
          <div className="win-btns">
            <button type="button" aria-label="Close" onClick={onClose}>
              ×
            </button>
          </div>
        </header>
        <div className="win-body">{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, children, grow }) {
  return (
    <label className={`field ${grow ? 'grow' : ''}`}>
      <span>{label}</span>
      {children}
    </label>
  )
}

export function Empty({ children }) {
  return <p className="empty">{children}</p>
}

export function Progress({ value, max, label }) {
  const pct = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0))
  return (
    <div className="progress" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <i style={{ width: `${pct}%` }} />
    </div>
  )
}

export function PageTitle({ children, sub, right }) {
  return (
    <div className="page-head">
      <div>
        <h1 className="page-title">{children}</h1>
        {sub && <p className="page-sub">{sub}</p>}
      </div>
      {right}
    </div>
  )
}

export function useConfirm() {
  return (msg) => window.confirm(msg)
}
