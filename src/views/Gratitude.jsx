import { useMemo, useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { fireConfetti } from '../components/shared'
import { Empty, PageTitle, Win } from '../components/ui'
import { todayStr, ymd } from '../lib/dates'
import { useStore } from '../lib/store'

const filled = (a) => (a || []).filter((x) => x && x.trim())

export function gratitudeStreak(g, today = new Date()) {
  let d = today
  if (!filled(g[ymd(d)]).length) d = addDays(d, -1)
  let n = 0
  while (filled(g[ymd(d)]).length && n < 800) {
    n++
    d = addDays(d, -1)
  }
  return n
}

export default function Gratitude() {
  const { data, set } = useStore()
  const today = todayStr()
  const [date, setDate] = useState(today)
  const [salt, setSalt] = useState(0)
  const [seed] = useState(() => Math.floor(Math.random() * 1000))
  const cur = [...(data.gratitude[date] || []), '', '', ''].slice(0, 3)
  const streak = gratitudeStreak(data.gratitude)

  const setLine = (i, v) => {
    const next = cur.map((x, j) => (j === i ? v : x))
    set('gratitude', (g) => {
      const out = { ...g }
      if (next.some((x) => x.trim())) out[date] = next
      else delete out[date]
      return out
    })
  }
  const onBlur = (i) => {
    if (cur.every((x) => x.trim()) && i === 2) fireConfetti({ kind: 'stars', count: 40 })
  }

  const entries = useMemo(
    () =>
      Object.entries(data.gratitude)
        .map(([d, a]) => [d, filled(a)])
        .filter(([, a]) => a.length)
        .sort((a, b) => b[0].localeCompare(a[0])),
    [data.gratitude]
  )
  const past = entries.filter(([d]) => d !== today)
  const memory = past.length ? past[(seed + salt) % past.length] : null
  const memLine = memory ? memory[1][(salt + memory[0].length) % memory[1].length] : null

  return (
    <>
      <PageTitle sub="3 things you are grateful for every day. Small or big, both count.">Gratitude journal</PageTitle>
      <div className="grid12">
        <div className="c8 stack-lg">
          <Win title={date === today ? 'Today I am grateful for…' : `Grateful – ${format(parseISO(date), 'EEEE, d MMM')}`}>
            <div className="row wrap" style={{ marginBottom: '.6rem' }}>
              <input type="date" value={date} max={today} aria-label="Date" onChange={(e) => e.target.value && setDate(e.target.value)} />
              {date !== today && (
                <button className="btn small ghost" onClick={() => setDate(today)}>
                  Back to today
                </button>
              )}
            </div>
            <ol className="gratlist">
              {[0, 1, 2].map((i) => (
                <li key={i}>
                  <span aria-hidden="true">{['🌸', '⭐', '🍀'][i]}</span>
                  <input value={cur[i]} maxLength={140} aria-label={`Gratitude ${i + 1}`} placeholder={['A good moment…', 'Someone I am thankful for…', 'A small joy…'][i]} onChange={(e) => setLine(i, e.target.value)} onBlur={() => onBlur(i)} />
                </li>
              ))}
            </ol>
            <p className="tiny muted">Saves automatically.</p>
          </Win>

          <Win title="Past entries">
            {entries.length === 0 ? (
              <Empty>No entries yet. Write your first one above 🌸</Empty>
            ) : (
              <ul className="gratpast">
                {entries.slice(0, 14).map(([d, a]) => (
                  <li key={d}>
                    <button type="button" onClick={() => setDate(d)} aria-label={`Open ${d}`}>
                      <small>{format(parseISO(d), 'EEE, d MMM yyyy')}</small>
                      <span>{a.join(' · ')}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Win>
        </div>

        <div className="c4 stack-lg">
          <Win title="Streak">
            <p className="big" style={{ marginBottom: '.2rem' }}>
              🔥 {streak}
              <small> day{streak === 1 ? '' : 's'}</small>
            </p>
            <p className="tiny muted">{entries.length} {entries.length === 1 ? 'day' : 'days'} of entries written.</p>
          </Win>
          <Win title="An old good moment">
            {memLine ? (
              <>
                <p className="quote">“{memLine}”</p>
                <p className="tiny muted">{format(parseISO(memory[0]), 'd MMM yyyy')}</p>
                <button className="btn small ghost" onClick={() => setSalt((s) => s + 1)}>
                  🎲 Another one
                </button>
              </>
            ) : (
              <p className="muted tiny">Older good memories will show up here from tomorrow.</p>
            )}
          </Win>
        </div>
      </div>
    </>
  )
}