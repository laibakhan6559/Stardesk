import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Empty, PageTitle, Win } from '../components/ui'
import { countdown, fmtTime, todayStr } from '../lib/dates'
import { uid, useStore } from '../lib/store'

const TYPES = {
  exam: { label: 'Exam', emoji: '📝' },
  deadline: { label: 'Deadline', emoji: '⏳' },
  holiday: { label: 'Holiday', emoji: '🌴' },
  event: { label: 'Other', emoji: '⭐' },
}

export default function Dates() {
  const { data, set } = useStore()
  const [f, setF] = useState({ title: '', date: todayStr(), time: '', type: 'exam' })
  const up = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const today = todayStr()

  const add = (e) => {
    e.preventDefault()
    if (!f.title.trim()) return
    set('keyDates', (l) => [...l, { ...f, id: uid(), title: f.title.trim() }])
    setF((x) => ({ ...x, title: '', time: '' }))
  }
  const del = (id) => set('keyDates', (l) => l.filter((k) => k.id !== id))

  const sorted = [...data.keyDates].sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')))
  const upcoming = sorted.filter((k) => k.date >= today)
  const past = sorted.filter((k) => k.date < today).reverse()
  const exams = upcoming.filter((k) => k.type === 'exam')
  const others = upcoming.filter((k) => k.type !== 'exam')

  return (
    <>
      <PageTitle sub="Never be surprised by an exam or deadline again. You get a heads-up the day before and on the day.">
        Key dates & exams
      </PageTitle>
      <div className="grid12">
        <div className="c8 stack-lg">
          <Win title="Exam timetable">
            <List items={exams} onDelete={del} empty="No exams coming up. Add one on the right ➜" />
          </Win>
          <Win title="Key dates!">
            <List items={others} onDelete={del} empty="No other key dates yet." />
          </Win>
          {past.length > 0 && (
            <Win title="Past" defaultOpen={false}>
              <List items={past} onDelete={del} empty="" />
            </Win>
          )}
        </div>
        <div className="c4">
          <Win title="Add a date">
            <form className="form" onSubmit={add}>
              <input required maxLength={80} value={f.title} onChange={up('title')} placeholder="e.g. Maths final" aria-label="Title" />
              <select value={f.type} onChange={up('type')} aria-label="Type">
                {Object.entries(TYPES).map(([id, t]) => (
                  <option key={id} value={id}>
                    {t.emoji} {t.label}
                  </option>
                ))}
              </select>
              <div className="row">
                <input type="date" required className="grow" value={f.date} onChange={up('date')} aria-label="Date" />
                <input type="time" value={f.time} onChange={up('time')} aria-label="Time" />
              </div>
              <button className="btn" type="submit">
                Add
              </button>
            </form>
          </Win>
        </div>
      </div>
    </>
  )
}

function List({ items, onDelete, empty }) {
  if (items.length === 0) return empty ? <Empty>{empty}</Empty> : null
  return (
    <ul className="keylist">
      {items.map((k) => {
        const cd = countdown(k.date)
        const t = TYPES[k.type] || TYPES.event
        return (
          <li key={k.id}>
            <span className="kicon">{t.emoji}</span>
            <span className="kmain">
              <b>{k.title}</b>
              <small>
                {format(parseISO(k.date), 'EEE, d MMM yyyy')}
                {k.time ? ` · ${fmtTime(k.time)}` : ''}
              </small>
            </span>
            <em className={`pill ${cd.tone}`}>{cd.text}</em>
            <button className="x" aria-label={`Delete ${k.title}`} onClick={() => onDelete(k.id)}>
              ×
            </button>
          </li>
        )
      })}
    </ul>
  )
}
