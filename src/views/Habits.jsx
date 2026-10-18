import { useState } from 'react'
import { addDays, format, parseISO, startOfWeek } from 'date-fns'
import { Empty, PageTitle, Win } from '../components/ui'
import { todayStr, ymd } from '../lib/dates'
import { uid, useStore } from '../lib/store'

const EMOJIS = ['💧', '📚', '🌙', '🏃', '🧘', '🥗', '✍️', '🎧', '🪥', '💊', '🛏️', '🌸']

export function streakOf(log) {
  let n = 0
  let d = new Date()
  if (!log[ymd(d)]) d = addDays(d, -1)
  while (log[ymd(d)]) {
    n++
    d = addDays(d, -1)
  }
  return n
}

export default function Habits() {
  const { data, set } = useStore()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(EMOJIS[0])
  const [offset, setOffset] = useState(0)
  const today = todayStr()
  const start = addDays(startOfWeek(new Date(), { weekStartsOn: data.settings.weekStart }), offset * 7)
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))

  const add = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    set('habits', (l) => [...l, { id: uid(), name: name.trim(), emoji, log: {} }])
    setName('')
  }
  const toggle = (id, ds) =>
    set('habits', (l) =>
      l.map((h) => {
        if (h.id !== id) return h
        const log = { ...h.log }
        if (log[ds]) delete log[ds]
        else log[ds] = true
        return { ...h, log }
      })
    )
  const del = (h) => window.confirm(`Delete habit "${h.name}"?`) && set('habits', (l) => l.filter((x) => x.id !== h.id))

  const rate = (h) => {
    let c = 0
    for (let i = 0; i < 30; i++) if (h.log[ymd(addDays(new Date(), -i))]) c++
    return Math.round((c / 30) * 100)
  }

  return (
    <>
      <PageTitle sub="Small things, done daily. Tap a day to tick it and build your streak.">Habit tracker</PageTitle>
      <div className="grid12">
        <div className="c8 stack-lg">
          <Win
            title={`Week of ${format(start, 'd MMM')}`}
            actions={
              <>
                <button type="button" aria-label="Previous week" onClick={() => setOffset((o) => o - 1)}>
                  ◀
                </button>
                <button type="button" aria-label="Next week" onClick={() => setOffset((o) => o + 1)}>
                  ▶
                </button>
              </>
            }
          >
            {data.habits.length === 0 && <Empty>No habits yet – add your first one!</Empty>}
            <div className="hgrid">
              <span />
              {days.map((d) => (
                <span key={ymd(d)} className={`hday ${ymd(d) === today ? 'today' : ''}`}>
                  {format(d, 'EEE')}
                  <small>{format(d, 'd')}</small>
                </span>
              ))}
              {data.habits.map((h) => (
                <HabitRow key={h.id} h={h} days={days} today={today} onToggle={toggle} onDelete={del} rate={rate(h)} />
              ))}
            </div>
          </Win>
        </div>
        <div className="c4">
          <Win title="New habit">
            <form className="form" onSubmit={add}>
              <input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="e.g. Read 10 pages" aria-label="Habit name" />
              <div className="emojis" role="radiogroup" aria-label="Pick an icon">
                {EMOJIS.map((e) => (
                  <button
                    type="button"
                    key={e}
                    role="radio"
                    aria-checked={emoji === e}
                    className={emoji === e ? 'on' : ''}
                    onClick={() => setEmoji(e)}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <button className="btn" type="submit">
                Add habit
              </button>
            </form>
          </Win>
        </div>
      </div>
    </>
  )
}

function HabitRow({ h, days, today, onToggle, onDelete, rate }) {
  const streak = streakOf(h.log)
  return (
    <>
      <div className="hname">
        <b>
          {h.emoji} {h.name}
        </b>
        <small>
          🔥 {streak} day{streak === 1 ? '' : 's'} · {rate}% last 30d
        </small>
        <button className="x" aria-label={`Delete ${h.name}`} onClick={() => onDelete(h)}>
          ×
        </button>
      </div>
      {days.map((d) => {
        const ds = ymd(d)
        const on = Boolean(h.log[ds])
        return (
          <button
            key={ds}
            type="button"
            className={`hcell ${on ? 'on' : ''} ${ds > today ? 'future' : ''}`}
            aria-pressed={on}
            aria-label={`${h.name} on ${format(parseISO(ds), 'EEEE d MMMM')}`}
            onClick={() => onToggle(h.id, ds)}
          >
            {on ? '★' : ''}
          </button>
        )
      })}
    </>
  )
}
