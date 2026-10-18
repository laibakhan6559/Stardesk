import { useEffect, useState } from 'react'
import { format, parseISO, startOfMonth } from 'date-fns'
import MonthGrid, { MonthNav } from '../components/MonthGrid'
import { fireConfetti } from '../components/shared'
import { Empty, PageTitle, Win } from '../components/ui'
import { todayStr } from '../lib/dates'
import { MOODS, moodMonth, moodStreak } from '../lib/health'
import { useStore } from '../lib/store'

export default function Mood() {
  const { data, set } = useStore()
  const today = todayStr()
  const [sel, setSel] = useState(today)
  const [month, setMonth] = useState(startOfMonth(new Date()))
  const score = data.mood[sel] || 0
  const saved = data.moodNotes[sel] || ''
  const [text, setText] = useState(saved)

  // switching day (or edits from the Home widget) refresh the text box
  useEffect(() => setText(saved), [sel, saved])

  const setScore = (v) => set('mood', (m) => ({ ...m, [sel]: v }))
  const clearDay = () => {
    set('mood', (m) => {
      const n = { ...m }
      delete n[sel]
      return n
    })
    set('moodNotes', (m) => {
      const n = { ...m }
      delete n[sel]
      return n
    })
  }
  const saveNote = (e) => {
    e?.preventDefault()
    const t = text.trim()
    set('moodNotes', (m) => {
      const n = { ...m }
      if (t) n[sel] = t
      else delete n[sel]
      return n
    })
    if (t && !score) setScore(3)
    if (t && sel === today && score >= 4) fireConfetti({ kind: 'stars', count: 30 })
  }

  const stats = moodMonth(data.mood, data.moodNotes, month)
  const streak = moodStreak(data.mood)
  const dated = Object.keys(data.mood)
    .filter((d) => data.mood[d] >= 1 && data.mood[d] <= 5)
    .sort()
    .reverse()
    .slice(0, 8)
  const avgFace = stats.n ? MOODS[Math.min(4, Math.max(0, Math.round(stats.avg) - 1))][0] : '–'
  const maxCount = Math.max(1, ...stats.counts)
  const thisMonth = format(month, 'yyyy-MM') === format(new Date(), 'yyyy-MM')

  return (
    <>
      <PageTitle sub="Write a line along with your mood. See the month heatmap to look back on how it went.">Mood journal</PageTitle>
      <div className="grid12">
        <div className="c7 stack-lg">
          <Win title={sel === today ? 'How are you today?' : `Mood of ${format(parseISO(sel), 'EEEE, d MMM')}`}>
            <div className="moods" role="radiogroup" aria-label="Mood">
              {MOODS.map(([e, label], i) => (
                <button key={e} type="button" role="radio" aria-checked={score === i + 1} aria-label={label} title={label} className={score === i + 1 ? 'on' : ''} onClick={() => setScore(i + 1)}>
                  {e}
                </button>
              ))}
            </div>
            <p className="tiny muted center">{score ? MOODS[score - 1][1] : 'Pick a face'}</p>
            <form className="row" onSubmit={saveNote}>
              <input className="grow" maxLength={140} value={text} placeholder="One line about this day…" aria-label="One line about this day" onChange={(e) => setText(e.target.value)} />
              <button className="btn small" type="submit" disabled={text.trim() === saved}>
                Save
              </button>
            </form>
            <div className="row wrap" style={{ marginTop: '.6rem' }}>
              {sel !== today && (
                <button className="btn small ghost" onClick={() => setSel(today)}>
                  ← Back to today
                </button>
              )}
              {(score > 0 || saved) && (
                <button className="btn small ghost" onClick={() => window.confirm('Clear this day?') && clearDay()}>
                  Clear day
                </button>
              )}
            </div>
          </Win>

          <Win title="Mood calendar">
            <MonthNav month={month} onChange={setMonth} canNext={!thisMonth} />
            <MonthGrid
              month={month}
              weekStart={data.settings.weekStart}
              selected={sel}
              label="Mood heatmap"
              onPick={(ds) => ds <= today && setSel(ds)}
              cell={(ds) => {
                const v = data.mood[ds]
                const note = data.moodNotes[ds]
                return {
                  cls: `${v ? `mood-${v}` : ''} ${ds > today ? 'future' : ''}`,
                  title: v ? `${MOODS[v - 1][1]}${note ? ` – ${note}` : ''}` : ds > today ? '' : 'No entry',
                  mark: note ? '•' : '',
                }
              }}
            />
            <div className="legend" aria-hidden="true">
              <span>Rough</span>
              {MOODS.map((m, i) => (
                <i key={i} className={`dot mood-${i + 1}`} />
              ))}
              <span>Great</span>
            </div>
          </Win>
        </div>

        <div className="c5 stack-lg">
          <Win title={`${format(month, 'MMMM')} summary`}>
            {stats.n === 0 ? (
              <Empty>No mood logs this month yet.</Empty>
            ) : (
              <>
                <div className="stats3">
                  <div>
                    <small>Days logged</small>
                    <b>{stats.n}</b>
                  </div>
                  <div>
                    <small>Average</small>
                    <b>
                      {avgFace} {stats.avg.toFixed(1)}
                    </b>
                  </div>
                  <div>
                    <small>Lines written</small>
                    <b>{stats.written}</b>
                  </div>
                </div>
                <ul className="moodbars">
                  {MOODS.map(([e, label], i) => (
                    <li key={label}>
                      <span>
                        {e} {label}
                      </span>
                      <div className="progress" aria-hidden="true">
                        <i className={`mood-${i + 1}`} style={{ width: `${(stats.counts[i] / maxCount) * 100}%` }} />
                      </div>
                      <b>{stats.counts[i]}</b>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <p className="tiny muted">{streak > 0 ? `🔥 ${streak}-day logging streak` : 'Log today to start a streak.'}</p>
          </Win>

          <Win title="Recent lines">
            {dated.length === 0 ? (
              <Empty>Write a line with your mood and it will show here.</Empty>
            ) : (
              <ul className="moodlines">
                {dated.map((ds) => (
                  <li key={ds}>
                    <button type="button" onClick={() => (setSel(ds), setMonth(startOfMonth(parseISO(ds))))}>
                      <span className="ml-face">{MOODS[data.mood[ds] - 1][0]}</span>
                      <span className="ml-txt">
                        <small>{format(parseISO(ds), 'EEE d MMM')}</small>
                        <b>{data.moodNotes[ds] || MOODS[data.mood[ds] - 1][1]}</b>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Win>
        </div>
      </div>
    </>
  )
}