import { useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { confettiFrom } from '../components/shared'
import { Empty, Field, PageTitle, Progress, Win } from '../components/ui'
import { uid, useStore } from '../lib/store'
import { RATINGS, getWeek, isReviewTime, shiftWeek, weekKey } from '../lib/work'

const rangeLabel = (key) => {
  const a = parseISO(key)
  const b = addDays(a, 6)
  return `${format(a, 'd MMM')} – ${format(b, 'd MMM')}`
}

function ReviewForm({ week, onSave }) {
  const r = week.review
  const [f, setF] = useState({ won: r?.won || '', hard: r?.hard || '', next: r?.next || '', rating: r?.rating || 0 })
  const up = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault()
        if (!f.rating) return
        onSave({ ...f, won: f.won.trim(), hard: f.hard.trim(), next: f.next.trim(), at: format(new Date(), 'yyyy-MM-dd') })
      }}
    >
      <Field label="What went well? (wins)">
        <textarea rows={2} maxLength={400} value={f.won} onChange={up('won')} />
      </Field>
      <Field label="What was hard?">
        <textarea rows={2} maxLength={400} value={f.hard} onChange={up('hard')} />
      </Field>
      <Field label="What should be better next week?">
        <textarea rows={2} maxLength={400} value={f.next} onChange={up('next')} />
      </Field>
      <div role="radiogroup" aria-label="Week rating" className="ratings">
        {RATINGS.map(([n, face, label]) => (
          <button key={n} type="button" role="radio" aria-checked={f.rating === n} className={f.rating === n ? 'on' : ''} onClick={() => setF({ ...f, rating: n })}>
            <span>{face}</span>
            <small>{label}</small>
          </button>
        ))}
      </div>
      <button className="btn" type="submit" disabled={!f.rating}>
        {r ? 'Update review' : 'Save review'}
      </button>
      {!f.rating && <p className="tiny muted">Give the week a rating first.</p>}
    </form>
  )
}

export default function Priorities() {
  const { data, set, toast } = useStore()
  const ws = data.settings.weekStart
  const nowKey = weekKey(new Date(), ws)
  const [key, setKey] = useState(nowKey)
  const [text, setText] = useState('')
  const week = getWeek(data.priorities, key)
  const isNow = key === nowKey
  const done = week.items.filter((i) => i.done).length
  const full = week.items.length >= 3
  const prev = getWeek(data.priorities, shiftWeek(key, -1))
  const carry = prev.items.filter((i) => !i.done)

  const patch = (fn) => set('priorities', (p) => ({ ...p, [key]: fn(getWeek(p, key)) }))
  const add = (e) => {
    e.preventDefault()
    const t = text.trim()
    if (!t || full) return
    patch((w) => ({ ...w, items: [...w.items, { id: uid(), text: t, done: false }].slice(0, 3) }))
    setText('')
  }
  const toggle = (id, e) => {
    const will = !week.items.find((i) => i.id === id)?.done
    patch((w) => ({ ...w, items: w.items.map((i) => (i.id === id ? { ...i, done: will } : i)) }))
    if (will && done + 1 === week.items.length && week.items.length === 3) confettiFrom(e, 'confetti')
  }
  const remove = (id) => patch((w) => ({ ...w, items: w.items.filter((i) => i.id !== id) }))
  const carryOver = () => {
    const room = 3 - week.items.length
    const take = carry.slice(0, room)
    if (!take.length) return
    patch((w) => ({ ...w, items: [...w.items, ...take.map((i) => ({ id: uid(), text: i.text, done: false }))] }))
    toast(`${take.length} unfinished task(s) carried over from last week ✓`, 'info')
  }

  const history = Object.entries(data.priorities || {})
    .filter(([k, w]) => k !== key && (w.items?.length || w.review))
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 8)

  const reviewDue = isNow && isReviewTime() && !week.review

  return (
    <>
      <PageTitle sub="Just the 3 most important things this week. A short review on Friday.">Weekly priorities</PageTitle>

      {reviewDue && (
        <div className="banner warn" role="status">
          <p>
            <b>🎯 Review time!</b> The week is almost over. Write your review below in 2 minutes.
          </p>
        </div>
      )}

      <div className="grid12">
        <div className="c8 stack-lg">
          <Win
            title={`${isNow ? 'This week' : 'Week'}: ${rangeLabel(key)}`}
            actions={
              <>
                <button type="button" aria-label="Previous week" onClick={() => setKey(shiftWeek(key, -1))}>
                  ◀
                </button>
                <button type="button" aria-label="Next week" disabled={isNow} onClick={() => setKey(shiftWeek(key, 1))}>
                  ▶
                </button>
              </>
            }
          >
            <p className="big" style={{ marginBottom: '.3rem' }}>
              {done}
              <small> / 3 done</small>
            </p>
            <Progress value={done} max={3} label="Priorities done this week" />

            {week.items.length === 0 ? (
              <Empty>What are the 3 most important things this week?</Empty>
            ) : (
              <ol className="prio-list">
                {week.items.map((i, n) => (
                  <li key={i.id} className={i.done ? 'done' : ''}>
                    <span className="prio-n" aria-hidden="true">
                      {n + 1}
                    </span>
                    <label>
                      <input type="checkbox" className="chk" checked={i.done} onChange={(e) => toggle(i.id, e)} />
                      <span>{i.text}</span>
                    </label>
                    <button className="x" aria-label={`Remove ${i.text}`} onClick={() => remove(i.id)}>
                      ×
                    </button>
                  </li>
                ))}
              </ol>
            )}

            <form className="row" onSubmit={add} style={{ marginTop: '.7rem' }}>
              <input className="grow" value={text} maxLength={100} disabled={full} onChange={(e) => setText(e.target.value)} placeholder={full ? 'All three slots are full – stay focused!' : `Priority #${week.items.length + 1}…`} aria-label="New priority" />
              <button className="btn small" type="submit" disabled={full || !text.trim()}>
                Add
              </button>
            </form>
            {carry.length > 0 && !full && (
              <button className="btn small ghost" style={{ marginTop: '.6rem' }} onClick={carryOver}>
                ↪ Carry over {carry.length} unfinished task(s) from last week
              </button>
            )}
          </Win>

          <Win title={`${week.review ? '✓ ' : ''}Friday review`}>
            <ReviewForm key={`${key}|${week.review?.at || ''}`} week={week} onSave={(review) => patch((w) => ({ ...w, review }))} />
          </Win>
        </div>

        <div className="c4">
          <Win title="Previous weeks">
            {history.length === 0 ? (
              <Empty>No previous weeks yet.</Empty>
            ) : (
              <ul className="listpick">
                {history.map(([k, w]) => {
                  const d = (w.items || []).filter((i) => i.done).length
                  const face = RATINGS.find((r) => r[0] === w.review?.rating)?.[1]
                  return (
                    <li key={k}>
                      <button type="button" onClick={() => setKey(k)}>
                        <span>
                          {face || '•'} {rangeLabel(k)}
                        </span>
                        <small>
                          {d}/{(w.items || []).length} done
                        </small>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </Win>
        </div>
      </div>
    </>
  )
}