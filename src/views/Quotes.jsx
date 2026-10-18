import { useState } from 'react'
import { confettiFrom } from '../components/shared'
import { Empty, PageTitle, Win } from '../components/ui'
import { CHALLENGES, affirmationOf, challengeOf, challengeStreak } from '../lib/growth'
import { todayStr } from '../lib/dates'
import { useStore } from '../lib/store'

export default function Quotes() {
  const { data, set } = useStore()
  const [mine, setMine] = useState('')
  const today = todayStr()
  const q = data.quotes
  const text = affirmationOf(q, today)
  const isFav = q.fav.includes(text)
  const ch = challengeOf(q, today)
  const streak = challengeStreak(q.ch)
  const doneCount = Object.values(q.ch).filter((x) => x.done).length

  const setQ = (fn) => set('quotes', (x) => fn(x))
  const shuffle = () => setQ((x) => ({ ...x, shuffle: { ...x.shuffle, [today]: (x.shuffle[today] || 0) + 1 } }))
  const toggleFav = () => setQ((x) => ({ ...x, fav: x.fav.includes(text) ? x.fav.filter((t) => t !== text) : [...x.fav, text].slice(-100) }))
  const another = () => {
    let i = ch.i
    while (i === ch.i && CHALLENGES.length > 1) i = Math.floor(Math.random() * CHALLENGES.length)
    setQ((x) => ({ ...x, ch: { ...x.ch, [today]: { i, done: false } } }))
  }
  const finish = (e) => {
    setQ((x) => ({ ...x, ch: { ...x.ch, [today]: { i: ch.i, done: !ch.done } } }))
    if (!ch.done) confettiFrom(e, 'confetti')
  }
  const addMine = (e) => {
    e.preventDefault()
    const t = mine.trim()
    if (!t) return
    setQ((x) => ({ ...x, mine: [...x.mine, t].slice(-60) }))
    setMine('')
  }
  const delMine = (t) => setQ((x) => ({ ...x, mine: x.mine.filter((m) => m !== t), fav: x.fav.filter((m) => m !== t) }))

  return (
    <>
      <PageTitle sub="One affirmation and one small challenge every day.">Quote &amp; challenge</PageTitle>
      <div className="grid12">
        <div className="c8 stack-lg">
          <Win title="Today’s affirmation">
            <p className="affirm">“{text}”</p>
            <div className="row wrap center">
              <button className="btn small ghost" onClick={toggleFav} aria-pressed={isFav}>
                {isFav ? '♥ Saved' : '♡ Save'}
              </button>
              <button className="btn small ghost" onClick={shuffle}>
                🔀 Another one
              </button>
            </div>
          </Win>

          <Win title="Today’s small challenge">
            <p className={`challenge ${ch.done ? 'done' : ''}`}>
              <span aria-hidden="true">{ch.c[1]}</span> {ch.c[0]}
            </p>
            <div className="row wrap center">
              <button className="btn" onClick={finish}>
                {ch.done ? '↩ Undo' : '✓ Done!'}
              </button>
              {!ch.done && (
                <button className="btn small ghost" onClick={another}>
                  🎲 Doosra do
                </button>
              )}
            </div>
            <p className="tiny muted center-text">
              🔥 {streak} din ki streak · {doneCount} challenge{doneCount === 1 ? '' : 's'} mukammal
            </p>
          </Win>
        </div>

        <div className="c4 stack-lg">
          <Win title="My own affirmations">
            <form className="row" onSubmit={addMine}>
              <input className="grow" maxLength={140} value={mine} onChange={(e) => setMine(e.target.value)} placeholder="Write your own line…" aria-label="Your own affirmation" />
              <button className="btn small" type="submit">
                Add
              </button>
            </form>
            <p className="tiny muted">These will be mixed in with the daily affirmations.</p>
            {q.mine.length > 0 && (
              <ul className="chips" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                {q.mine.map((t) => (
                  <li key={t} style={{ borderRadius: 10, justifyContent: 'space-between' }}>
                    <span>{t}</span>
                    <button aria-label={`Remove ${t}`} onClick={() => delMine(t)}>
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Win>
          <Win title="Saved ♥" defaultOpen={q.fav.length > 0}>
            {q.fav.length === 0 ? (
              <Empty>Tap ♡ on any line you like.</Empty>
            ) : (
              <ul className="favlist">
                {q.fav.map((t) => (
                  <li key={t}>“{t}”</li>
                ))}
              </ul>
            )}
          </Win>
        </div>
      </div>
    </>
  )
}