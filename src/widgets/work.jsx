import { Progress, Win } from '../components/ui'
import { confettiFrom } from '../components/shared'
import { money } from '../lib/daily'
import { todayStr } from '../lib/dates'
import { go } from '../lib/nav'
import { useStore } from '../lib/store'
import { useNow } from '../lib/useNow'
import { fmtHm, freelanceTotals, followInfo, getWeek, hms, routineProgress, stepDone, timerSeconds, weekKey } from '../lib/work'

// Home windows for steps 7-8. Registered in lib/widgets.js and views/Home.jsx.

export function JobsWidget() {
  const { data } = useStore()
  const now = new Date()
  const due = data.jobs
    .map((j) => ({ j, f: followInfo(j, now) }))
    .filter((x) => x.f && x.f.n <= 3)
    .sort((a, b) => a.f.n - b.f.n)
    .slice(0, 3)
  const live = data.jobs.filter((j) => j.status === 'applied' || j.status === 'interview').length
  return (
    <Win title="Job follow-ups">
      {data.jobs.length === 0 ? (
        <p className="muted tiny">Track applications and you will be reminded to follow up.</p>
      ) : due.length === 0 ? (
        <p className="muted tiny">No follow-ups due · {live} active application{live === 1 ? '' : 's'}.</p>
      ) : (
        <ul className="wclist">
          {due.map(({ j, f }) => (
            <li key={j.id}>
              <span>{j.company}</span>
              <b className={f.n <= 0 ? 'neg' : ''}>{f.n < 0 ? `${-f.n}d late` : f.n === 0 ? 'today' : `in ${f.n}d`}</b>
            </li>
          ))}
        </ul>
      )}
      <button className="bigbtn" style={{ marginBottom: 0, marginTop: '.5rem' }} onClick={() => go('jobs')}>
        Job tracker →
      </button>
    </Win>
  )
}

export function FreelanceWidget() {
  const { data } = useStore()
  const fl = data.freelance
  const now = useNow(fl.timer ? 1000 : 60000)
  const t = freelanceTotals(fl, now)
  const p = fl.timer ? fl.projects.find((x) => x.id === fl.timer.projectId) : null
  const cur = data.settings.currency || 'Rs'
  return (
    <Win title="Freelance">
      {fl.timer ? (
        <>
          <p className="big" style={{ marginBottom: '.2rem' }}>
            {hms(timerSeconds(fl.timer, now.getTime()))}
          </p>
          <p className="muted tiny">⏱ {p ? `${p.client} · ${p.name}` : 'Timer running'}</p>
        </>
      ) : fl.projects.length === 0 ? (
        <p className="muted tiny">Client projects, invoices and a time tracker.</p>
      ) : (
        <>
          <p className="big" style={{ marginBottom: '.2rem' }}>
            {money(t.outstanding, cur)}
          </p>
          <p className="muted tiny">
            to be paid{t.overdue > 0 ? <b className="neg"> · {money(t.overdue, cur)} overdue</b> : ''} · {fmtHm(t.monthMin)} this month
          </p>
        </>
      )}
      <button className="bigbtn" style={{ marginBottom: 0, marginTop: '.5rem' }} onClick={() => go('freelance')}>
        Freelance →
      </button>
    </Win>
  )
}

export function PrioritiesWidget() {
  const { data, set } = useStore()
  const key = weekKey(new Date(), data.settings.weekStart)
  const week = getWeek(data.priorities, key)
  const done = week.items.filter((i) => i.done).length
  const tick = (id, on, e) => {
    set('priorities', (p) => {
      const w = getWeek(p, key)
      return { ...p, [key]: { ...w, items: w.items.map((i) => (i.id === id ? { ...i, done: on } : i)) } }
    })
    if (on && done + 1 === 3 && week.items.length === 3) confettiFrom(e, 'confetti')
  }
  return (
    <Win title="Top 3 this week">
      {week.items.length === 0 ? (
        <p className="muted tiny">This week’s top 3 priorities are not set yet.</p>
      ) : (
        <>
          <Progress value={done} max={3} label="Weekly priorities done" />
          <ul className="ticklist" style={{ marginTop: '.5rem' }}>
            {week.items.map((i) => (
              <li key={i.id} className={i.done ? 'done' : ''}>
                <label>
                  <input type="checkbox" checked={i.done} onChange={(e) => tick(i.id, e.target.checked, e)} />
                  <span>{i.text}</span>
                </label>
              </li>
            ))}
          </ul>
        </>
      )}
      <button className="bigbtn" style={{ marginBottom: 0, marginTop: '.5rem' }} onClick={() => go('priorities')}>
        {week.items.length ? 'Priorities →' : 'Set my 3 →'}
      </button>
    </Win>
  )
}

export function RoutinesWidget() {
  const { data, set } = useStore()
  const today = todayStr()
  const { routines, habits } = data
  const completeAll = (r, e) => {
    const todo = r.steps.filter((s) => !stepDone(r, s, today, habits))
    set('routines', (l) => l.map((x) => (x.id === r.id ? { ...x, done: { ...x.done, [today]: r.steps.map((s) => s.id) } } : x)))
    const ids = new Set(todo.map((s) => s.habitId).filter(Boolean))
    if (ids.size) set('habits', (hs) => hs.map((h) => (ids.has(h.id) ? { ...h, log: { ...h.log, [today]: true } } : h)))
    confettiFrom(e, 'stars')
  }
  return (
    <Win title="Routines today">
      {routines.length === 0 ? (
        <p className="muted tiny">Create a morning / night routine and complete it in one click.</p>
      ) : (
        <ul className="wclist">
          {routines.slice(0, 3).map((r) => {
            const p = routineProgress(r, today, habits)
            return (
              <li key={r.id}>
                <span>
                  {r.emoji} {r.name} · {p.done}/{p.total}
                </span>
                <b>
                  {p.complete ? (
                    '✓'
                  ) : (
                    <button className="btn small" aria-label={`Complete all of ${r.name}`} onClick={(e) => completeAll(r, e)}>
                      ⚡
                    </button>
                  )}
                </b>
              </li>
            )
          })}
        </ul>
      )}
      <button className="bigbtn" style={{ marginBottom: 0, marginTop: '.5rem' }} onClick={() => go('routines')}>
        Routines →
      </button>
    </Win>
  )
}