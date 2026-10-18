import { useState } from 'react'
import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import MonthGrid, { MonthNav } from '../components/MonthGrid'
import { Empty, Field, PageTitle, Win } from '../components/ui'
import { todayStr } from '../lib/dates'
import { CYCLE_REMIND, cycleDays, cycleInfo } from '../lib/health'
import { uid, useStore } from '../lib/store'

export default function Cycle() {
  const { data, set } = useStore()
  const c = data.cycle
  const today = todayStr()
  const now = new Date()
  const info = cycleInfo(c, now)
  const { logged, predicted } = cycleDays(c, info)
  const [month, setMonth] = useState(now)
  const [start, setStart] = useState(today)
  const [end, setEnd] = useState('')

  const setCycle = (patch) => set('cycle', (x) => ({ ...x, ...patch }))
  const addPeriod = (s, e = '') => {
    if (!s) return
    if (c.periods.some((p) => p.start === s)) return
    setCycle({ periods: [...c.periods, { id: uid(), start: s, end: e && e >= s ? e : '' }].slice(-60) })
  }
  const endPeriod = (ds) => {
    const last = info.last
    if (!last || ds < last.start) return
    setCycle({ periods: c.periods.map((p) => (p.id === last.id ? { ...p, end: ds } : p)) })
  }
  const delPeriod = (p) => window.confirm(`Delete the period starting ${p.start}?`) && setCycle({ periods: c.periods.filter((x) => x.id !== p.id) })
  const clearAll = () => window.confirm('Delete ALL cycle data from this browser? This cannot be undone.') && setCycle({ periods: [] })

  const submit = (e) => {
    e.preventDefault()
    addPeriod(start, end)
    setEnd('')
  }

  const hist = [...info.periods].reverse().slice(0, 8)
  const gapTo = (p) => {
    const i = info.periods.findIndex((x) => x.id === p.id)
    return i > 0 ? differenceInCalendarDays(parseISO(p.start), parseISO(info.periods[i - 1].start)) : null
  }

  return (
    <>
      <PageTitle sub="Private tracker. Everything stays only in this browser.">Cycle tracker</PageTitle>
      <div className="banner">
        <p>
          🔒 <b>Private:</b> this data is never uploaded. It is saved only in this browser and is included in your JSON backup, so keep backup files safe. Predictions are estimates, not medical advice.
        </p>
      </div>
      <div className="grid12">
        <div className="c7 stack-lg">
          <Win title="🌸 Calendar">
            <MonthNav month={month} onChange={setMonth} />
            <MonthGrid
              month={month}
              weekStart={data.settings.weekStart}
              label="Cycle calendar"
              cell={(ds) => (logged.has(ds) ? { cls: 'cy-log', title: 'Period', mark: '●' } : predicted.has(ds) ? { cls: 'cy-pred', title: 'Expected period (estimate)' } : {})}
            />
            <p className="legend">
              <span>
                <i className="dot cy-log" /> Period
              </span>
              <span>
                <i className="dot cy-pred" /> Expected (estimate)
              </span>
            </p>
          </Win>

          <Win title="History">
            {hist.length === 0 ? (
              <Empty>No period logs yet. Tap “Period started today” ➜</Empty>
            ) : (
              <ul className="wclist">
                {hist.map((p) => {
                  const g = gapTo(p)
                  const len = p.end ? differenceInCalendarDays(parseISO(p.end), parseISO(p.start)) + 1 : null
                  return (
                    <li key={p.id}>
                      <span>
                        {format(parseISO(p.start), 'd MMM yyyy')}
                        {len ? ` · ${len} day${len === 1 ? '' : 's'}` : ' · ongoing / no end'}
                      </span>
                      <b>
                        {g ? `${g}d cycle` : ''}{' '}
                        <button type="button" className="x" aria-label={`Delete period ${p.start}`} onClick={() => delPeriod(p)}>
                          ×
                        </button>
                      </b>
                    </li>
                  )
                })}
              </ul>
            )}
          </Win>
        </div>

        <div className="c5 stack-lg">
          <Win title="Overview">
            {info.empty ? (
              <p className="muted">Log your first period to see estimates.</p>
            ) : (
              <>
                <div className="stats3">
                  <div>
                    <small>Cycle day</small>
                    <b>{info.day > 0 ? info.day : '–'}</b>
                  </div>
                  <div>
                    <small>Next in</small>
                    <b className={info.n < 0 ? 'neg' : ''}>{info.n < 0 ? `${-info.n}d late` : info.n === 0 ? 'today' : `${info.n}d`}</b>
                  </div>
                  <div>
                    <small>Avg cycle</small>
                    <b>{info.avg}d</b>
                  </div>
                </div>
                <p className="tiny muted">
                  Next period expected around <b>{format(info.next, 'EEE d MMM')}</b> {info.learned ? '(based on your last cycles)' : `(using your default ${c.cycleLen}-day cycle)`}.
                </p>
              </>
            )}
            <div className="row wrap">
              <button className="btn" disabled={c.periods.some((p) => p.start === today)} onClick={() => addPeriod(today)}>
                Period started today
              </button>
              {info.ongoing && (
                <button className="btn ghost" onClick={() => endPeriod(today)}>
                  Period ended today
                </button>
              )}
            </div>
          </Win>

          <Win title="Log a past period">
            <form className="form" onSubmit={submit}>
              <div className="row">
                <Field label="First day" grow>
                  <input type="date" required max={today} value={start} onChange={(e) => setStart(e.target.value)} />
                </Field>
                <Field label="Last day (optional)" grow>
                  <input type="date" min={start} max={today} value={end} onChange={(e) => setEnd(e.target.value)} />
                </Field>
              </div>
              <button className="btn" type="submit">
                Add period
              </button>
            </form>
          </Win>

          <Win title="Settings & reminder">
            <div className="row">
              <Field label="Default cycle (days)" grow>
                <input type="number" min="20" max="45" value={c.cycleLen} onChange={(e) => setCycle({ cycleLen: Math.min(45, Math.max(20, Number(e.target.value) || 28)) })} />
              </Field>
              <Field label="Period length (days)" grow>
                <input type="number" min="2" max="10" value={c.periodLen} onChange={(e) => setCycle({ periodLen: Math.min(10, Math.max(2, Number(e.target.value) || 5)) })} />
              </Field>
            </div>
            <Field label="Remind me">
              <select value={c.remind} onChange={(e) => setCycle({ remind: Number(e.target.value) })}>
                {CYCLE_REMIND.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <p className="hint">Reminder text stays neutral (“Personal reminder”) so nothing private shows on your screen or notifications.</p>
            <button className="btn small ghost" style={{ marginTop: '.7rem' }} disabled={!c.periods.length} onClick={clearAll}>
              Delete all cycle data
            </button>
          </Win>
        </div>
      </div>
    </>
  )
}