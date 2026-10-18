import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { BarChart, confettiFrom } from '../components/shared'
import { Empty, Field, PageTitle, Win } from '../components/ui'
import { todayStr } from '../lib/dates'
import { CARDIO, EXERCISES, lastTime, personalBests, setLine, weeklyStats } from '../lib/health'
import { uid, useStore } from '../lib/store'

const blankSet = () => ({ reps: '10', kg: '' })

export default function Workout() {
  const { data, set } = useStore()
  const { workouts } = data
  const today = todayStr()
  const [date, setDate] = useState(today)
  const [type, setType] = useState('str')
  const [name, setName] = useState('')
  const [sets, setSets] = useState([blankSet(), blankSet(), blankSet()])
  const [min, setMin] = useState('30')
  const [km, setKm] = useState('')
  const [note, setNote] = useState('')

  const prev = type === 'str' ? lastTime(workouts, name, date) : null
  const weeks = weeklyStats(workouts, 8, new Date(), data.settings.weekStart)
  const thisWeek = weeks[weeks.length - 1]
  const lastWeek = weeks[weeks.length - 2]
  const pbs = personalBests(workouts).slice(0, 6)

  const upSet = (i, k, v) => setSets((l) => l.map((s, j) => (j === i ? { ...s, [k]: v } : s)))
  const reset = () => {
    setName('')
    setNote('')
    setKm('')
    setSets([blankSet(), blankSet(), blankSet()])
  }

  const submit = (e) => {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    let entry
    if (type === 'str') {
      const clean = sets.map((s) => ({ reps: Math.round(Number(s.reps)), kg: Math.max(0, Number(s.kg) || 0) })).filter((s) => s.reps > 0)
      if (!clean.length) return
      entry = { id: uid(), date, name: n, type: 'str', sets: clean, note: note.trim() }
    } else {
      const m = Math.round(Number(min))
      if (!(m > 0)) return
      entry = { id: uid(), date, name: n, type: 'cardio', min: m, km: Number(km) > 0 ? Number(km) : 0, note: note.trim() }
    }
    const isPb = entry.type === 'str' && personalBests(workouts).find((p) => p.name === n)?.score < Math.max(...entry.sets.map((s) => s.kg * 1000 + s.reps))
    set('workouts', (l) => [...l, entry].slice(-1500))
    if (isPb) {
      confettiFrom({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 3 }, 'stars')
    }
    reset()
  }
  const del = (w) => window.confirm(`Delete “${w.name}” of ${w.date}?`) && set('workouts', (l) => l.filter((x) => x.id !== w.id))

  const byDay = {}
  for (const w of [...workouts].sort((a, b) => b.date.localeCompare(a.date))) (byDay[w.date] ||= []).push(w)
  const days = Object.keys(byDay).slice(0, 10)

  const diff = thisWeek.days - lastWeek.days
  const ideas = type === 'str' ? EXERCISES : CARDIO

  return (
    <>
      <PageTitle sub="Log exercises, sets and reps. Weekly progress shows in the chart.">Workout log</PageTitle>
      <div className="grid12">
        <div className="c7 stack-lg">
          <Win title="Log an exercise">
            <form className="form" onSubmit={submit}>
              <div className="row">
                <div className="seg small" role="tablist" style={{ marginBottom: 0 }}>
                  {[
                    ['str', 'Strength'],
                    ['cardio', 'Cardio / timed'],
                  ].map(([v, l]) => (
                    <button key={v} type="button" role="tab" aria-selected={type === v} className={type === v ? 'on' : ''} onClick={() => setType(v)}>
                      {l}
                    </button>
                  ))}
                </div>
                <Field label="Date" grow>
                  <input type="date" required max={today} value={date} onChange={(e) => setDate(e.target.value)} />
                </Field>
              </div>
              <Field label="Exercise">
                <input required maxLength={40} list="ex-ideas" value={name} onChange={(e) => setName(e.target.value)} placeholder={type === 'str' ? 'e.g. Squats' : 'e.g. Walking'} />
                <datalist id="ex-ideas">
                  {ideas.map((x) => (
                    <option key={x} value={x} />
                  ))}
                </datalist>
              </Field>
              <div className="chips presets" role="group" aria-label="Quick pick">
                {ideas.slice(0, 6).map((x) => (
                  <button key={x} type="button" className="chip" onClick={() => setName(x)}>
                    {x}
                  </button>
                ))}
              </div>

              {type === 'str' ? (
                <>
                  {prev && (
                    <p className="tiny muted">
                      Last time ({format(parseISO(prev.date), 'd MMM')}): <b>{setLine(prev.sets)}</b>{' '}
                      <button type="button" className="btn small ghost" onClick={() => setSets(prev.sets.map((s) => ({ reps: String(s.reps), kg: s.kg ? String(s.kg) : '' })))}>
                        Copy
                      </button>
                    </p>
                  )}
                  <div className="setrows" role="group" aria-label="Sets">
                    {sets.map((s, i) => (
                      <div key={i} className="setrow">
                        <b>Set {i + 1}</b>
                        <input type="number" min="1" max="999" inputMode="numeric" aria-label={`Reps for set ${i + 1}`} value={s.reps} onChange={(e) => upSet(i, 'reps', e.target.value)} />
                        <span>reps ×</span>
                        <input type="number" min="0" max="999" step="0.5" inputMode="decimal" aria-label={`Weight in kg for set ${i + 1}`} placeholder="0" value={s.kg} onChange={(e) => upSet(i, 'kg', e.target.value)} />
                        <span>kg</span>
                        <button type="button" className="x" aria-label={`Remove set ${i + 1}`} disabled={sets.length === 1} onClick={() => setSets((l) => l.filter((_, j) => j !== i))}>
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="row">
                    <button type="button" className="btn small ghost" disabled={sets.length >= 20} onClick={() => setSets((l) => [...l, { ...l[l.length - 1] }])}>
                      + Add set
                    </button>
                    <span className="tiny muted">Leave kg empty for bodyweight.</span>
                  </div>
                </>
              ) : (
                <div className="row">
                  <Field label="Minutes" grow>
                    <input type="number" required min="1" max="600" inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} />
                  </Field>
                  <Field label="Distance km (optional)" grow>
                    <input type="number" min="0" max="500" step="0.1" inputMode="decimal" value={km} onChange={(e) => setKm(e.target.value)} />
                  </Field>
                </div>
              )}
              <Field label="Note (optional)">
                <input maxLength={80} value={note} onChange={(e) => setNote(e.target.value)} placeholder="How did it feel?" />
              </Field>
              <div className="row end">
                <button className="btn" type="submit">
                  Add to log
                </button>
              </div>
            </form>
          </Win>

          <Win title="History">
            {days.length === 0 ? (
              <Empty>No workouts yet. Add your first exercise above 💪</Empty>
            ) : (
              <div className="stack-lg">
                {days.map((ds) => (
                  <div key={ds}>
                    <p className="daylabel">
                      {ds === today ? 'Today' : format(parseISO(ds), 'EEEE, d MMM')}
                      <small>
                        {byDay[ds].length} exercise{byDay[ds].length === 1 ? '' : 's'}
                      </small>
                    </p>
                    <ul className="wolist">
                      {byDay[ds].map((w) => (
                        <li key={w.id}>
                          <span className="wo-txt">
                            <b>{w.name}</b>
                            <small>
                              {w.type === 'cardio' ? `${w.min} min${w.km ? ` · ${w.km} km` : ''}` : setLine(w.sets)}
                              {w.note ? ` · ${w.note}` : ''}
                            </small>
                          </span>
                          <button className="x" aria-label={`Delete ${w.name}`} onClick={() => del(w)}>
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Win>
        </div>

        <div className="c5 stack-lg">
          <Win title="This week">
            <div className="stats3">
              <div>
                <small>Days trained</small>
                <b>{thisWeek.days}</b>
              </div>
              <div>
                <small>Sets</small>
                <b>{thisWeek.sets}</b>
              </div>
              <div>
                <small>Cardio</small>
                <b>{thisWeek.cardio}m</b>
              </div>
            </div>
            <p className="tiny muted">
              {thisWeek.volume > 0 && <>Lifted {thisWeek.volume.toLocaleString('en-US')} kg in total. </>}
              {lastWeek.days || thisWeek.days ? (diff > 0 ? `${diff} more day${diff === 1 ? '' : 's'} than last week 🔥` : diff < 0 ? `${-diff} fewer day${diff === -1 ? '' : 's'} than last week.` : 'Same as last week.') : 'Log a workout to start your weekly progress.'}
            </p>
          </Win>

          <Win title="Progress · days trained per week">
            <BarChart data={weeks.map((w) => ({ label: w.label, value: w.days }))} max={7} label="Days trained in the last 8 weeks" />
            <p className="tiny muted">Weeks start on {data.settings.weekStart === 0 ? 'Sunday' : 'Monday'} (change in Settings).</p>
          </Win>

          <Win title="Personal bests 🏆">
            {pbs.length === 0 ? (
              <Empty>Best sets for strength exercises will show here.</Empty>
            ) : (
              <ul className="wclist">
                {pbs.map((p) => (
                  <li key={p.name}>
                    <span>{p.name}</span>
                    <b>
                      {p.reps}
                      {p.kg ? ` × ${p.kg}kg` : ' reps'}
                    </b>
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