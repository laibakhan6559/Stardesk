import { addDays } from 'date-fns'
import { Progress, Win } from '../components/ui'
import { confettiFrom } from '../components/shared'
import { fmtTime, todayStr, ymd } from '../lib/dates'
import { cycleInfo, dosesOn, waterCount } from '../lib/health'
import { go } from '../lib/nav'
import { useStore } from '../lib/store'

// Home windows for steps 5-6. Registered in lib/widgets.js and views/Home.jsx.

export function WaterWidget() {
  const { data, set } = useStore()
  const today = todayStr()
  const goal = data.water.goal || 8
  const n = waterCount(data.water, today)
  const bump = (d, e) => {
    const v = Math.max(0, Math.min(40, n + d))
    set('water', (w) => {
      const log = { ...w.log }
      if (v) log[today] = v
      else delete log[today]
      return { ...w, log }
    })
    if (d > 0 && v === goal) confettiFrom(e, 'stars')
  }
  return (
    <Win title="Water">
      <p className="big" style={{ marginBottom: '.2rem' }}>
        {n}
        <small> / {goal} glasses</small>
      </p>
      <Progress value={n} max={goal} label="Water goal" />
      <div className="row wrap" style={{ margin: '.6rem 0' }}>
        <button className="btn small" onClick={(e) => bump(1, e)}>
          💧 + glass
        </button>
        <button className="btn small ghost" disabled={!n} aria-label="Remove one glass" onClick={(e) => bump(-1, e)}>
          −
        </button>
      </div>
      <button className="bigbtn" style={{ marginBottom: 0 }} onClick={() => go('water')}>
        Water &amp; sleep →
      </button>
    </Win>
  )
}

export function MedicineWidget() {
  const { data, set } = useStore()
  const now = new Date()
  const today = ymd(now)
  const doses = dosesOn(data.meds, now, now)
  const todo = doses.filter((d) => !d.taken).slice(0, 3)
  const take = (id, time) =>
    set('meds', (l) =>
      l.map((m) => (m.id === id ? { ...m, taken: { ...m.taken, [today]: { ...(m.taken?.[today] || {}), [time]: 1 } } } : m))
    )
  return (
    <Win title="Medicine today">
      {data.meds.length === 0 ? (
        <p className="muted tiny">Add a medicine time and you will get a reminder.</p>
      ) : doses.length === 0 ? (
        <p className="muted tiny">No doses today.</p>
      ) : todo.length === 0 ? (
        <p>All doses taken 🎉</p>
      ) : (
        <ul className="wclist">
          {todo.map((r) => (
            <li key={r.key}>
              <span>
                {r.m.emoji} {r.m.name} · {fmtTime(r.time)}
              </span>
              <b>
                {r.status === 'missed' ? <span className="neg">missed </span> : null}
                <button className="btn small" onClick={() => take(r.m.id, r.time)} aria-label={`Mark ${r.m.name} taken`}>
                  ✓
                </button>
              </b>
            </li>
          ))}
        </ul>
      )}
      <button className="bigbtn" style={{ marginBottom: 0 }} onClick={() => go('medicine')}>
        Medicines →
      </button>
    </Win>
  )
}

// Deliberately neutral: no wording that would reveal what this is to someone glancing at the screen.
export function CycleWidget() {
  const { data } = useStore()
  const info = cycleInfo(data.cycle, new Date())
  return (
    <Win title="Personal tracker">
      {info.empty ? (
        <p className="muted tiny">Nothing logged yet.</p>
      ) : (
        <>
          <p className="big" style={{ marginBottom: '.2rem' }}>
            {info.n < 0 ? `${-info.n}d` : info.n === 0 ? 'Today' : `${info.n}d`}
          </p>
          <p className="muted tiny">{info.n < 0 ? 'past the estimate' : 'to next estimate'}</p>
        </>
      )}
      <button className="bigbtn" style={{ marginBottom: 0 }} onClick={() => go('cycle')}>
        Open →
      </button>
    </Win>
  )
}

export function BreatheWidget() {
  const { data } = useStore()
  const days = Array.from({ length: 7 }, (_, i) => ymd(addDays(new Date(), -i)))
  const mins = Math.round(data.breath.filter((s) => days.includes(s.date)).reduce((a, s) => a + s.sec, 0) / 60)
  return (
    <Win title="Take a breath">
      <p className="muted tiny">{mins ? `${mins} min of breathing this week.` : 'Take one minute to breathe; it lightens the mind.'}</p>
      <button className="bigbtn" style={{ marginBottom: 0 }} onClick={() => go('breathe')}>
        🫧 Start breathing
      </button>
    </Win>
  )
}