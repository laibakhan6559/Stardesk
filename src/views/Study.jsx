import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Empty, PageTitle, Progress, Win } from '../components/ui'
import { lastNDays, todayStr } from '../lib/dates'
import { uid, useStore } from '../lib/store'
import { mmss, useTimer } from '../lib/timer'

const PRESETS = { focus: [15, 25, 45, 50], break: [5, 10, 15] }

export default function Study() {
  const { data, set, setSetting } = useStore()
  const t = useTimer()
  const [manual, setManual] = useState(30)
  const today = todayStr()
  const total = (t.mode === 'focus' ? t.focusMin : t.breakMin) * 60
  const subjects = [...new Set(data.classes.map((c) => c.name))]

  const minutesOn = (ds) => data.sessions.filter((s) => s.date === ds).reduce((a, s) => a + s.min, 0)
  const todayMin = minutesOn(today)
  const week = lastNDays(7)
  const weekMax = Math.max(60, ...week.map(minutesOn))
  const weekTotal = week.reduce((a, d) => a + minutesOn(d), 0)
  const todays = data.sessions.filter((s) => s.date === today).slice().reverse()

  const bySubject = {}
  data.sessions.filter((s) => week.includes(s.date)).forEach((s) => (bySubject[s.subject] = (bySubject[s.subject] || 0) + s.min))

  const addManual = (e) => {
    e.preventDefault()
    const min = Math.max(1, Math.min(600, Number(manual) || 0))
    set('sessions', (l) => [...l, { id: uid(), date: today, min, subject: t.subject || 'General' }].slice(-500))
  }
  const del = (id) => set('sessions', (l) => l.filter((s) => s.id !== id))

  return (
    <>
      <PageTitle sub="Pomodoro-style focus timer with a daily goal and a log of what you studied.">Study time</PageTitle>
      <div className="grid12">
        <div className="c7 stack-lg">
          <Win title={t.mode === 'focus' ? 'Focus timer' : 'Break time'}>
            <div className="seg small center" role="tablist">
              <button role="tab" aria-selected={t.mode === 'focus'} className={t.mode === 'focus' ? 'on' : ''} onClick={() => t.setMode('focus')}>
                Focus
              </button>
              <button role="tab" aria-selected={t.mode === 'break'} className={t.mode === 'break' ? 'on' : ''} onClick={() => t.setMode('break')}>
                Break
              </button>
            </div>
            <p className="clock" aria-live="off">
              {mmss(t.left)}
            </p>
            <Progress value={total - t.left} max={total} label="Timer progress" />
            <div className="row center wrap" style={{ marginTop: '1rem' }}>
              {t.running ? (
                <button className="btn" onClick={t.pause}>
                  ⏸ Pause
                </button>
              ) : (
                <button className="btn" onClick={t.start}>
                  ▶ Start
                </button>
              )}
              <button className="btn ghost" onClick={t.reset}>
                ↺ Reset
              </button>
              <button className="btn ghost" onClick={t.skip}>
                ⏭ Finish now
              </button>
            </div>
            <div className="row center wrap presets">
              {PRESETS[t.mode].map((m) => (
                <button
                  key={m}
                  className={`chip ${(t.mode === 'focus' ? t.focusMin : t.breakMin) === m ? 'on' : ''}`}
                  onClick={() => t.setMinutes(m)}
                >
                  {m} min
                </button>
              ))}
            </div>
            <label className="field" style={{ marginTop: '1rem' }}>
              <span>Studying</span>
              <select value={t.subject} onChange={(e) => t.setSubject(e.target.value)}>
                <option value="">General</option>
                {subjects.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <p className="hint">Keep this tab open – the timer keeps counting even if you switch pages inside Stardesk.</p>
          </Win>

          <Win title="Last 7 days">
            <div className="bars" role="img" aria-label={`Study minutes over the last 7 days, ${weekTotal} minutes in total`}>
              {week.map((d) => (
                <div key={d} className="bar">
                  <i style={{ height: `${(minutesOn(d) / weekMax) * 100}%` }} title={`${minutesOn(d)} min`} />
                  <small>{format(parseISO(d), 'EEE')}</small>
                  <em>{minutesOn(d)}</em>
                </div>
              ))}
            </div>
            <p className="muted">
              {Math.floor(weekTotal / 60)}h {weekTotal % 60}m this week
            </p>
            {Object.keys(bySubject).length > 0 && (
              <ul className="subjects">
                {Object.entries(bySubject)
                  .sort((a, b) => b[1] - a[1])
                  .map(([s, m]) => (
                    <li key={s}>
                      <span>{s}</span>
                      <Progress value={m} max={Math.max(...Object.values(bySubject))} label={s} />
                      <b>{m}m</b>
                    </li>
                  ))}
              </ul>
            )}
          </Win>
        </div>

        <div className="c5 stack-lg">
          <Win title="Today's goal">
            <p className="big">
              {todayMin}
              <small> / {data.settings.goal} min</small>
            </p>
            <Progress value={todayMin} max={data.settings.goal} label="Daily goal" />
            <label className="field" style={{ marginTop: '.9rem' }}>
              <span>Daily goal (minutes)</span>
              <input
                type="number"
                min="10"
                max="720"
                step="5"
                value={data.settings.goal}
                onChange={(e) => setSetting('goal', Math.max(10, Number(e.target.value) || 10))}
              />
            </label>
            {todayMin >= data.settings.goal && <p className="hint">Goal reached – amazing work! 🌟</p>}
          </Win>

          <Win title="Today's sessions">
            {todays.length === 0 && <Empty>No sessions yet today.</Empty>}
            <ul className="tasklist">
              {todays.map((s) => (
                <li key={s.id}>
                  <span className="ttl">
                    ⭐ {s.subject} <em className="muted">· {s.min} min</em>
                  </span>
                  <button className="x" aria-label="Delete session" onClick={() => del(s.id)}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <form className="row" onSubmit={addManual}>
              <input type="number" min="1" max="600" value={manual} onChange={(e) => setManual(e.target.value)} aria-label="Minutes studied" />
              <button className="btn small" type="submit">
                + Log minutes
              </button>
            </form>
          </Win>
        </div>
      </div>
    </>
  )
}
