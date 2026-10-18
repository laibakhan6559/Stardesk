import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { BarChart, confettiFrom } from '../components/shared'
import { Empty, Field, PageTitle, Progress, Win } from '../components/ui'
import { todayStr, ymd } from '../lib/dates'
import { GLASS_ML, fmtDur, hoursOf, lastDays, sleepFor, sleepMins, validTime, waterCount } from '../lib/health'
import { useStore } from '../lib/store'

export default function Water() {
  const { data, set } = useStore()
  const { water, sleep } = data
  const today = todayStr()
  const goal = water.goal || 8
  const glass = water.glass || 250
  const count = waterCount(water, today)
  const week = lastDays(7)

  const setCount = (n, e) => {
    const v = Math.max(0, Math.min(40, n))
    set('water', (w) => {
      const log = { ...w.log }
      if (v) log[today] = v
      else delete log[today]
      const keys = Object.keys(log).sort()
      for (const k of keys.slice(0, Math.max(0, keys.length - 120))) delete log[k]
      return { ...w, log }
    })
    if (e && v === goal && count < goal) confettiFrom(e, 'stars')
  }
  const setWater = (k, v) => set('water', (w) => ({ ...w, [k]: v }))

  const dayAvg = week.map((d) => waterCount(water, ymd(d))).filter(Boolean)
  const avg = dayAvg.length ? Math.round((dayAvg.reduce((a, n) => a + n, 0) / dayAvg.length) * 10) / 10 : 0
  const hits = week.filter((d) => waterCount(water, ymd(d)) >= goal).length

  /* ---------- sleep ---------- */
  const sGoal = sleep.goal || 8
  const lastEntry = sleep.log[today]
  const [wakeDate, setWakeDate] = useState(today)
  const [bed, setBed] = useState(lastEntry?.bed || '23:30')
  const [wake, setWake] = useState(lastEntry?.wake || '07:00')
  const saveSleep = (e) => {
    e.preventDefault()
    if (!validTime(bed) || !validTime(wake) || !wakeDate) return
    set('sleep', (s) => {
      const log = { ...s.log, [wakeDate]: { bed, wake } }
      const keys = Object.keys(log).sort()
      for (const k of keys.slice(0, Math.max(0, keys.length - 120))) delete log[k]
      return { ...s, log }
    })
  }
  const delSleep = (ds) =>
    set('sleep', (s) => {
      const log = { ...s.log }
      delete log[ds]
      return { ...s, log }
    })
  const sleepWeek = week.map((d) => ({ label: format(d, 'EEE'), value: hoursOf(sleepFor(sleep, ymd(d))) }))
  const logged = sleepWeek.filter((d) => d.value > 0)
  const sAvg = logged.length ? Math.round((logged.reduce((a, d) => a + d.value, 0) / logged.length) * 10) / 10 : 0
  const recent = Object.keys(sleep.log)
    .sort()
    .reverse()
    .slice(0, 7)

  return (
    <>
      <PageTitle sub="Daily glasses and sleep tracking. See the weekly chart and reach your goal.">Water &amp; sleep</PageTitle>
      <div className="grid12">
        <div className="c7 stack-lg">
          <Win title="💧 Water today">
            <p className="big" style={{ marginBottom: '.2rem' }}>
              {count}
              <small> / {goal} glasses</small>
            </p>
            <p className="muted tiny">
              {Math.round(count * glass)} ml of {goal * glass} ml {count >= goal && '· goal done 🎉'}
            </p>
            <Progress value={count} max={goal} label="Water goal" />
            <div className="glasses" role="group" aria-label="Glasses of water">
              {Array.from({ length: Math.max(goal, count) }, (_, i) => (
                <button key={i} type="button" className={i < count ? 'on' : ''} aria-pressed={i < count} aria-label={`${i + 1} glass${i ? 'es' : ''}`} onClick={(e) => setCount(i + 1 === count ? i : i + 1, e)}>
                  💧
                </button>
              ))}
            </div>
            <div className="row wrap" style={{ marginTop: '.7rem' }}>
              <button className="btn" onClick={(e) => setCount(count + 1, e)}>
                + 1 glass
              </button>
              <button className="btn ghost" disabled={!count} onClick={() => setCount(count - 1)}>
                − 1
              </button>
            </div>
          </Win>

          <Win title="Last 7 days">
            <BarChart data={week.map((d) => ({ label: format(d, 'EEE'), value: waterCount(water, ymd(d)) }))} limit={goal} limitMode="goal" label="Glasses of water in the last 7 days" />
            <p className="tiny muted">
              Average {avg} glasses on days you logged · goal hit {hits}/7 days
            </p>
            <div className="row">
              <Field label="Daily goal (glasses)" grow>
                <input type="number" min="1" max="20" value={goal} onChange={(e) => setWater('goal', Math.min(20, Math.max(1, Number(e.target.value) || 1)))} />
              </Field>
              <Field label="Glass size" grow>
                <select value={glass} onChange={(e) => setWater('glass', Number(e.target.value))}>
                  {GLASS_ML.map((ml) => (
                    <option key={ml} value={ml}>
                      {ml} ml
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Win>
        </div>

        <div className="c5 stack-lg">
          <Win title="🌙 Sleep">
            <form className="form" onSubmit={saveSleep}>
              <Field label="Woke up on">
                <input type="date" required max={today} value={wakeDate} onChange={(e) => setWakeDate(e.target.value)} />
              </Field>
              <div className="row">
                <Field label="Went to bed" grow>
                  <input type="time" required value={bed} onChange={(e) => setBed(e.target.value)} />
                </Field>
                <Field label="Woke up" grow>
                  <input type="time" required value={wake} onChange={(e) => setWake(e.target.value)} />
                </Field>
              </div>
              <p className="tiny muted">
                That is <b>{fmtDur(sleepMins(bed, wake))}</b> of sleep.
              </p>
              <button className="btn" type="submit">
                Save sleep
              </button>
            </form>
          </Win>

          <Win title="Sleep this week">
            <BarChart data={sleepWeek} limit={sGoal} limitMode="goal" max={10} format={(v) => `${v}h`} label="Hours of sleep in the last 7 days" />
            <p className="tiny muted">{logged.length ? `Average ${sAvg}h over ${logged.length} night${logged.length === 1 ? '' : 's'}.` : 'Log a night to see your average.'}</p>
            <Field label="Sleep goal (hours)">
              <input type="number" min="4" max="12" step="0.5" value={sGoal} onChange={(e) => set('sleep', (s) => ({ ...s, goal: Math.min(12, Math.max(4, Number(e.target.value) || 8)) }))} />
            </Field>
            {recent.length === 0 ? (
              <Empty>No nights logged yet.</Empty>
            ) : (
              <ul className="wclist" style={{ marginTop: '.7rem' }}>
                {recent.map((ds) => (
                  <li key={ds}>
                    <span>
                      {format(parseISO(ds), 'EEE d MMM')} · {sleep.log[ds].bed}–{sleep.log[ds].wake}
                    </span>
                    <b>
                      {fmtDur(sleepFor(sleep, ds))}{' '}
                      <button type="button" className="x" aria-label={`Delete sleep of ${ds}`} onClick={() => delSleep(ds)}>
                        ×
                      </button>
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