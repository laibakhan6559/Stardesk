import { Progress, Win } from '../components/ui'
import { confettiFrom } from '../components/shared'
import { todayStr } from '../lib/dates'
import { affirmationOf, challengeOf, goalProgress } from '../lib/growth'
import { go } from '../lib/nav'
import { useStore } from '../lib/store'

// Home windows for steps 9-10. Registered in lib/widgets.js and views/Home.jsx.

export function QuoteWidget() {
  const { data, set } = useStore()
  const today = todayStr()
  const text = affirmationOf(data.quotes, today)
  const ch = challengeOf(data.quotes, today)
  const toggle = (e) => {
    set('quotes', (x) => ({ ...x, ch: { ...x.ch, [today]: { i: ch.i, done: !ch.done } } }))
    if (!ch.done) confettiFrom(e, 'confetti')
  }
  return (
    <Win title="Today’s affirmation">
      <p className="quote">“{text}”</p>
      <p className={`challenge small ${ch.done ? 'done' : ''}`}>
        {ch.c[1]} {ch.c[0]}
      </p>
      <div className="row wrap">
        <button className="btn small" onClick={toggle}>
          {ch.done ? '↩ Undo' : '✓ Challenge done'}
        </button>
        <button className="btn small ghost" onClick={() => go('quotes')}>
          More →
        </button>
      </div>
    </Win>
  )
}

export function GratitudeWidget() {
  const { data, set } = useStore()
  const today = todayStr()
  const lines = (data.gratitude[today] || []).filter((x) => x && x.trim())
  const add = (e) => {
    e.preventDefault()
    const t = new FormData(e.currentTarget).get('g')?.toString().trim()
    if (!t || lines.length >= 3) return
    set('gratitude', (g) => ({ ...g, [today]: [...lines, t, '', ''].slice(0, 3) }))
    e.currentTarget.reset()
  }
  return (
    <Win title="Gratitude">
      {lines.length > 0 && (
        <ul className="wclist">
          {lines.map((l, i) => (
            <li key={i}>
              <span>
                {['🌸', '⭐', '🍀'][i]} {l}
              </span>
            </li>
          ))}
        </ul>
      )}
      {lines.length < 3 ? (
        <form className="row" onSubmit={add} style={{ marginTop: '.4rem' }}>
          <input className="grow" name="g" maxLength={140} placeholder={`Grateful for… (${lines.length + 1}/3)`} aria-label="Gratitude" />
          <button className="btn small" type="submit">
            +
          </button>
        </form>
      ) : (
        <p className="tiny muted">All 3 things written for today 🎉</p>
      )}
      <button className="bigbtn" style={{ marginBottom: 0, marginTop: '.5rem' }} onClick={() => go('gratitude')}>
        Journal →
      </button>
    </Win>
  )
}

export function GoalsWidget() {
  const { data } = useStore()
  const year = new Date().getFullYear()
  const goals = data.goals.filter((g) => g.year === year)
  const open = goals.filter((g) => !g.done).slice(0, 3)
  return (
    <Win title={`Goals ${year}`}>
      {goals.length === 0 ? (
        <p className="muted tiny">No goals set for this year yet.</p>
      ) : (
        <>
          <p className="muted tiny">
            {goals.filter((g) => g.done).length}/{goals.length} achieved
          </p>
          <ul className="wclist">
            {open.map((g) => {
              const p = goalProgress(g)
              return (
                <li key={g.id} style={{ display: 'grid', gap: 2 }}>
                  <span>
                    {g.emoji} {g.title}
                  </span>
                  <Progress value={p.pct} max={100} label={`${g.title} progress`} />
                </li>
              )
            })}
          </ul>
        </>
      )}
      <button className="bigbtn" style={{ marginBottom: 0, marginTop: '.5rem' }} onClick={() => go('goals')}>
        Goals →
      </button>
    </Win>
  )
}

export function ReadingWidget() {
  const { data, set } = useStore()
  const cur = data.reading.filter((b) => b.status === 'reading').slice(0, 2)
  const bump = (b, n) => set('reading', (l) => l.map((x) => (x.id === b.id ? { ...x, read: Math.max(0, x.pages ? Math.min(x.pages, x.read + n) : x.read + n) } : x)))
  return (
    <Win title="Reading now">
      {cur.length === 0 ? (
        <p className="muted tiny">No book being read right now.</p>
      ) : (
        <ul className="wclist">
          {cur.map((b) => (
            <li key={b.id} style={{ display: 'grid', gap: 2 }}>
              <span>
                <b>{b.title}</b>
              </span>
              <Progress value={b.read} max={b.pages || 0} label={`Progress of ${b.title}`} />
              <span className="tiny muted">
                {b.read}
                {b.pages ? `/${b.pages}` : ''} pages{' '}
                <button className="btn small ghost" aria-label={`Add 10 pages to ${b.title}`} onClick={() => bump(b, 10)}>
                  +10
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <button className="bigbtn" style={{ marginBottom: 0, marginTop: '.5rem' }} onClick={() => go('reading')}>
        Reading list →
      </button>
    </Win>
  )
}
export function ZooWidget() {
  const { data } = useStore()
  const n = (data.zoo?.items || []).length
  return (
    <Win title="Pixel Zoo 🎮">
      <p className="quote">🐸 🐟 🦋 🐒 Draw an animal and watch it come alive in the meadow.</p>
      <p className="muted tiny">{n === 0 ? 'Your meadow is waiting for its first animal.' : `${n} animal${n === 1 ? '' : 's'} living in your meadow.`}</p>
      <button className="bigbtn" style={{ marginBottom: 0 }} onClick={() => go('zoo')}>
        ▶ Play Pixel Zoo
      </button>
    </Win>
  )
}