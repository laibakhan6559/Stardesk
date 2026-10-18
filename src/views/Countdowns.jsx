import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Empty, PageTitle, Win } from '../components/ui'
import { HijriAdjust } from '../components/PlacePicker'
import { buildCountdowns } from '../lib/countdowns'
import { todayStr } from '../lib/dates'
import { ISLAMIC_DATES, formatHijri, upcomingIslamic } from '../lib/hijri'
import { uid, useStore } from '../lib/store'

const EMOJIS = ['✈️', '🎉', '🎂', '🎓', '🏖️', '💍', '🏠', '⭐']

export default function Countdowns() {
  const { data, set } = useStore()
  const [f, setF] = useState({ title: '', date: todayStr(), emoji: '✈️' })
  const adj = data.settings.hijriAdj || 0
  const items = buildCountdowns(data)
  const isl = upcomingIslamic(adj)
  const on = new Set(data.cd.islamic)

  const add = (e) => {
    e.preventDefault()
    const title = f.title.trim()
    if (!title) return
    set('keyDates', (l) => [...l, { id: uid(), title, date: f.date, time: '', type: 'event', emoji: f.emoji }])
    setF((x) => ({ ...x, title: '' }))
  }
  const toggle = (id) => set('cd', (c) => ({ ...c, islamic: c.islamic.includes(id) ? c.islamic.filter((x) => x !== id) : [...c.islamic, id] }))

  return (
    <>
      <PageTitle sub="Days to go for trips, birthdays, exams and Islamic occasions. Your dates also appear in Key dates and send reminders.">Countdowns</PageTitle>
      <div className="grid12">
        <div className="c8 stack-lg">
          <Win title="Coming up">
            {items.length === 0 ? (
              <Empty>Nothing to count down to yet. Add a date ➜ or switch on an Islamic date.</Empty>
            ) : (
              <ul className="cdcards">
                {items.map((c) => (
                  <li key={c.id} className={c.n <= 7 ? 'soon' : ''}>
                    {c.kind === 'mine' && (
                      <button className="x" aria-label={`Delete ${c.title}`} onClick={() => set('keyDates', (l) => l.filter((k) => k.id !== c.id))}>
                        ×
                      </button>
                    )}
                    <span className="cdc-n">{c.n}</span>
                    <span className="cdc-u">{c.n === 0 ? 'today!' : c.n === 1 ? 'day' : 'days'}</span>
                    <b>
                      {c.emoji} {c.title}
                    </b>
                    <small>{format(parseISO(c.date), 'EEE, d MMM yyyy')}</small>
                  </li>
                ))}
              </ul>
            )}
          </Win>
        </div>

        <div className="c4 stack-lg">
          <Win title="Add a countdown">
            <form className="form" onSubmit={add}>
              <input required maxLength={60} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Trip to Hunza" aria-label="Title" />
              <input type="date" required value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} aria-label="Date" />
              <div className="emojis" role="radiogroup" aria-label="Icon">
                {EMOJIS.map((e) => (
                  <button type="button" key={e} role="radio" aria-checked={f.emoji === e} className={f.emoji === e ? 'on' : ''} onClick={() => setF({ ...f, emoji: e })}>
                    {e}
                  </button>
                ))}
              </div>
              <button className="btn" type="submit">
                Add
              </button>
            </form>
          </Win>

          <Win title="Islamic dates">
            <div className="form">
              <p className="small">Today: 🌙 {formatHijri(new Date(), adj)}</p>
              {ISLAMIC_DATES.map(([id, label, emoji]) => (
                <label key={id} className="switch">
                  <input type="checkbox" checked={on.has(id)} onChange={() => toggle(id)} />
                  <span>
                    {emoji} {label}
                    {isl[id] && <small className="muted"> · {format(parseISO(isl[id]), 'd MMM')}</small>}
                  </span>
                </label>
              ))}
              <HijriAdjust />
              <p className="hint">Islamic dates depend on moon sighting, so they can differ by a day. Use the adjustment to match what is announced in Pakistan.</p>
            </div>
          </Win>
        </div>
      </div>
    </>
  )
}