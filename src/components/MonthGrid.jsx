import { addMonths, format } from 'date-fns'
import { monthCells, weekdayHeads } from '../lib/health'
import { ymd } from '../lib/dates'

// Month calendar used by the mood heatmap and the cycle calendar.
// cell(ds, date) -> { cls?: string, title?: string, mark?: string }  (everything optional)
export function MonthNav({ month, onChange, canNext = true }) {
  return (
    <div className="monthnav">
      <button type="button" className="btn small ghost" aria-label="Previous month" onClick={() => onChange(addMonths(month, -1))}>
        ◀
      </button>
      <b>{format(month, 'MMMM yyyy')}</b>
      <button type="button" className="btn small ghost" aria-label="Next month" disabled={!canNext} onClick={() => onChange(addMonths(month, 1))}>
        ▶
      </button>
    </div>
  )
}

export default function MonthGrid({ month, weekStart = 1, cell, onPick, selected, label = 'Calendar' }) {
  const today = ymd(new Date())
  return (
    <div className="mgrid" role="grid" aria-label={label}>
      {weekdayHeads(weekStart).map((h, i) => (
        <span key={i} className="mg-head" role="columnheader">
          {h}
        </span>
      ))}
      {monthCells(month, weekStart).map((d, i) => {
        if (!d) return <span key={i} className="mg-pad" />
        const ds = ymd(d)
        const c = cell?.(ds, d) || {}
        const cls = `mg-day ${c.cls || ''} ${ds === today ? 'today' : ''} ${ds === selected ? 'sel' : ''}`
        const aria = `${format(d, 'EEEE d MMMM')}${c.title ? `: ${c.title}` : ''}`
        return onPick ? (
          <button key={i} type="button" className={cls} title={c.title} aria-label={aria} onClick={() => onPick(ds)}>
            <span>{d.getDate()}</span>
            {c.mark && <i>{c.mark}</i>}
          </button>
        ) : (
          <span key={i} className={cls} title={c.title} aria-label={aria}>
            <span>{d.getDate()}</span>
            {c.mark && <i>{c.mark}</i>}
          </span>
        )
      })}
    </div>
  )
}