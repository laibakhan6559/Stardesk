import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { confettiFrom } from '../components/shared'
import { Empty, PageTitle, Progress, Win } from '../components/ui'
import { todayStr } from '../lib/dates'
import { BUCKET_IDEAS } from '../lib/growth'
import { uid, useStore } from '../lib/store'

export default function Bucket() {
  const { data, set } = useStore()
  const [text, setText] = useState('')
  const items = data.bucket
  const done = items.filter((b) => b.done).length
  const have = new Set(items.map((b) => b.text.toLowerCase()))
  const ideas = BUCKET_IDEAS.filter(([t]) => !have.has(t.toLowerCase())).slice(0, 6)

  const add = (t, emoji = '✨') => {
    if (!t.trim()) return
    set('bucket', (l) => [...l, { id: uid(), text: t.trim(), emoji, done: false, doneOn: null, note: '' }].slice(0, 300))
  }
  const tick = (b, e) => {
    const on = !b.done
    set('bucket', (l) => l.map((x) => (x.id === b.id ? { ...x, done: on, doneOn: on ? todayStr() : null } : x)))
    if (on) confettiFrom(e, Math.random() > 0.5 ? 'confetti' : 'stars')
  }
  const del = (b) => set('bucket', (l) => l.filter((x) => x.id !== b.id))
  const sorted = [...items].sort((a, b) => Number(a.done) - Number(b.done))

  return (
    <>
      <PageTitle sub="Everything you want to do in life. Tick it off and celebrate!">Bucket list</PageTitle>
      <div className="grid12">
        <div className="c8">
          <Win title={`${done} of ${items.length} done`}>
            <Progress value={done} max={items.length} label="Bucket list progress" />
            {items.length === 0 ? (
              <Empty>Write your first wish, or pick an idea from the side ➜</Empty>
            ) : (
              <ul className="bucketlist">
                {sorted.map((b) => (
                  <li key={b.id} className={b.done ? 'done' : ''}>
                    <button type="button" className="b-tick" role="checkbox" aria-checked={b.done} aria-label={`${b.done ? 'Untick' : 'Tick'} ${b.text}`} onClick={(e) => tick(b, e)}>
                      {b.done ? '★' : '☆'}
                    </button>
                    <span className="b-txt">
                      <b>
                        {b.emoji} {b.text}
                      </b>
                      {b.done && b.doneOn && <small>Done on {format(parseISO(b.doneOn), 'd MMM yyyy')} 🎉</small>}
                    </span>
                    <button className="x" aria-label={`Delete ${b.text}`} onClick={() => del(b)}>
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Win>
        </div>
        <div className="c4 stack-lg">
          <Win title="Add a wish">
            <form
              className="row"
              onSubmit={(e) => {
                e.preventDefault()
                add(text)
                setText('')
              }}
            >
              <input className="grow" maxLength={100} value={text} onChange={(e) => setText(e.target.value)} placeholder="I want to…" aria-label="New wish" />
              <button className="btn small" type="submit">
                Add
              </button>
            </form>
          </Win>
          {ideas.length > 0 && (
            <Win title="Ideas">
              <div className="chips presets">
                {ideas.map(([t, e]) => (
                  <button key={t} type="button" className="chip" onClick={() => add(t, e)}>
                    {e} {t}
                  </button>
                ))}
              </div>
            </Win>
          )}
        </div>
      </div>
    </>
  )
}