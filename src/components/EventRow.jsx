import { CATS, fmtTime } from '../lib/dates'
import { useStore } from '../lib/store'

export function useToggleEvent() {
  const { set } = useStore()
  return (ev, ds) =>
    set('events', (list) =>
      list.map((e) => (e.id === ev.id ? { ...e, doneOn: { ...(e.doneOn || {}), [ds]: !e.doneOn?.[ds] } } : e))
    )
}

export default function EventRow({ ev, ds, onEdit, compact }) {
  const toggle = useToggleEvent()
  const done = Boolean(ev.doneOn?.[ds])
  const cat = CATS[ev.cat] || CATS.personal
  return (
    <div className={`erow ${done ? 'done' : ''} ${compact ? 'compact' : ''}`} style={{ '--cat': cat.color }}>
      <input
        type="checkbox"
        className="chk"
        checked={done}
        onChange={() => toggle(ev, ds)}
        aria-label={`Mark ${ev.title} as done`}
      />
      <button type="button" className="erow-main" onClick={() => onEdit && onEdit(ev)}>
        <span className="erow-title">
          {cat.emoji} {ev.title}
        </span>
        <span className="erow-meta">
          {ev.time ? fmtTime(ev.time) : 'All day'}
          {ev.repeat && ev.repeat !== 'none' ? ' · 🔁' : ''}
          {ev.remind >= 0 ? ' · 🔔' : ''}
        </span>
      </button>
    </div>
  )
}
