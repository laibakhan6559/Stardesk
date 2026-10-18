import { useEffect, useRef, useState } from 'react'

/* ---------------------------------------------------------------
   Shared building blocks for the new apps (steps 2-10).
   - TickList   : checklist with add / tick / remove
   - BarChart   : small bar chart with optional limit line (budget, water...)
   - Confetti   : fireConfetti() + <ConfettiLayer /> (mounted once in App)
---------------------------------------------------------------- */

export function TickList({ items, onToggle, onRemove, onAdd, placeholder = 'Add item…', empty = 'Nothing here yet.', renderMeta, showCount = true }) {
  const [text, setText] = useState('')
  const done = items.filter((i) => i.done).length
  const submit = (e) => {
    e.preventDefault()
    const t = text.trim()
    if (!t || !onAdd) return
    onAdd(t)
    setText('')
  }
  return (
    <div className="ticklist-wrap">
      {onAdd && (
        <form className="row ticklist-add" onSubmit={submit}>
          <input className="grow" value={text} maxLength={120} placeholder={placeholder} aria-label={placeholder} onChange={(e) => setText(e.target.value)} />
          <button className="btn small" type="submit">
            Add
          </button>
        </form>
      )}
      {showCount && items.length > 0 && (
        <p className="tiny muted">
          {done}/{items.length} done
        </p>
      )}
      {items.length === 0 ? (
        <p className="empty">{empty}</p>
      ) : (
        <ul className="ticklist">
          {items.map((it) => (
            <li key={it.id} className={it.done ? 'done' : ''}>
              <label>
                <input type="checkbox" checked={!!it.done} onChange={(e) => onToggle?.(it.id, e.target.checked, e)} />
                <span>{it.text}</span>
              </label>
              {renderMeta?.(it)}
              {onRemove && (
                <button type="button" className="x" aria-label={`Remove ${it.text}`} onClick={() => onRemove(it.id)}>
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// data: [{ label, value }]   limit: draws a dashed line and colours bars above it red
// limitMode 'cap' (default): bars above the line turn red (budget). 'goal': bars that reach the line turn green (water, sleep).
export function BarChart({ data, height = 150, max, limit, limitMode = 'cap', format = (v) => v, label = 'Chart' }) {
  const top = Math.max(max ?? 0, limit ?? 0, ...data.map((d) => d.value), 1) * 1.12 // headroom for value labels
  return (
    <div className="bchart" role="img" aria-label={label} style={{ '--n': data.length, '--h': `${height}px` }}>
      <div className="bplot">
        {limit != null && <span className={`bchart-limit ${limitMode}`} style={{ bottom: `${(limit / top) * 100}%` }} title={`Limit ${format(limit)}`} />}
        {data.map((d, i) => (
          <div key={i} className={`bcol ${limit != null ? (limitMode === 'goal' ? (d.value >= limit ? 'hit' : '') : d.value > limit ? 'over' : '') : ''}`}>
            <em>{d.value ? format(d.value) : ''}</em>
            <i style={{ height: `${d.value ? Math.max(3, (d.value / top) * 100) : 0}%` }} />
          </div>
        ))}
      </div>
      <div className="blabels">
        {data.map((d, i) => (
          <small key={i}>{d.label}</small>
        ))}
      </div>
    </div>
  )
}

/* ---------- confetti / stars ---------- */

const FX_EVENT = 'stardesk:fx'
const COLORS = ['#ff6fb0', '#7f9bf0', '#f5b84b', '#59c98d', '#b58cf5', '#3fc7e0']
const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// kind: 'confetti' | 'stars'.  x / y are viewport pixels (e.g. from a click event).
export function fireConfetti(opts = {}) {
  if (typeof window === 'undefined' || reduced()) return
  window.dispatchEvent(new CustomEvent(FX_EVENT, { detail: opts }))
}
export const confettiFrom = (e, kind = 'confetti') => fireConfetti({ x: e?.clientX, y: e?.clientY, kind })

export function ConfettiLayer() {
  const canvas = useRef(null)
  const parts = useRef([])
  const raf = useRef(0)

  useEffect(() => {
    const cv = canvas.current
    const ctx = cv.getContext('2d')
    const size = () => {
      cv.width = window.innerWidth
      cv.height = window.innerHeight
    }
    size()
    window.addEventListener('resize', size)

    const frame = () => {
      ctx.clearRect(0, 0, cv.width, cv.height)
      parts.current = parts.current.filter((p) => p.life > 0 && p.y < cv.height + 30)
      for (const p of parts.current) {
        p.vy += 0.22
        p.vx *= 0.99
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vr
        p.life -= 1
        ctx.save()
        ctx.globalAlpha = Math.min(1, p.life / 25)
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        if (p.star) {
          ctx.font = `${p.size * 2.4}px serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('★', 0, 0)
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
        }
        ctx.restore()
      }
      raf.current = parts.current.length ? requestAnimationFrame(frame) : 0
      if (!parts.current.length) ctx.clearRect(0, 0, cv.width, cv.height)
    }

    const on = (e) => {
      const { x = window.innerWidth / 2, y = window.innerHeight / 3, kind = 'confetti', count = 70 } = e.detail || {}
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2
        const s = 3 + Math.random() * 7
        parts.current.push({
          x,
          y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - 4,
          rot: Math.random() * 6,
          vr: (Math.random() - 0.5) * 0.4,
          size: 6 + Math.random() * 6,
          color: COLORS[(Math.random() * COLORS.length) | 0],
          star: kind === 'stars',
          life: 70 + Math.random() * 50,
        })
      }
      if (!raf.current) raf.current = requestAnimationFrame(frame)
    }
    window.addEventListener(FX_EVENT, on)
    return () => {
      window.removeEventListener(FX_EVENT, on)
      window.removeEventListener('resize', size)
      cancelAnimationFrame(raf.current)
    }
  }, [])

  return <canvas ref={canvas} className="fx-layer" aria-hidden="true" />
}