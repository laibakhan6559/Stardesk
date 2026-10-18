import { useState } from 'react'
import { confettiFrom } from '../components/shared'
import { PageTitle, Win } from '../components/ui'
import { countdown } from '../lib/dates'
import { uid, useStore } from '../lib/store'
import { QUADS } from '../lib/work'

// Suggested task priority when a task is created inside a quadrant.
const PRI = { q1: 3, q2: 2, q3: 2, q4: 1 }

function QuickAdd({ onAdd, label }) {
  const [t, setT] = useState('')
  return (
    <form
      className="row qadd"
      onSubmit={(e) => {
        e.preventDefault()
        if (!t.trim()) return
        onAdd(t.trim())
        setT('')
      }}
    >
      <input className="grow" value={t} maxLength={120} placeholder="Add task…" aria-label={label} onChange={(e) => setT(e.target.value)} />
      <button className="btn small" type="submit" aria-label={`Add to ${label}`}>
        +
      </button>
    </form>
  )
}

function TaskRow({ t, onDone, onMove, onDrag, current }) {
  const cd = t.due ? countdown(t.due) : null
  return (
    <li className="eq-task" draggable onDragStart={(e) => onDrag(e, t.id)}>
      <input type="checkbox" className="chk" aria-label={`Complete ${t.title}`} checked={false} onChange={(e) => onDone(t, e)} />
      <span className="eq-ttl">
        {t.title}
        {cd && <em className={`pill ${cd.n < 0 ? 'hot' : cd.tone}`}>{cd.n < 0 ? 'overdue' : cd.text}</em>}
      </span>
      <span className="eq-move" role="group" aria-label={`Move ${t.title}`}>
        {QUADS.filter(([id]) => id !== current).map(([id, title, , emoji]) => (
          <button key={id} type="button" title={`Move to “${title}”`} aria-label={`Move ${t.title} to ${title}`} onClick={() => onMove(t.id, id)}>
            {emoji}
          </button>
        ))}
        {current && (
          <button type="button" title="Back to unsorted" aria-label={`Unsort ${t.title}`} onClick={() => onMove(t.id, null)}>
            ↩
          </button>
        )}
      </span>
    </li>
  )
}

export default function Eisenhower() {
  const { data, set } = useStore()
  const [over, setOver] = useState(null)
  const open = data.tasks.filter((t) => !t.done)
  const unsorted = open.filter((t) => !QUADS.some(([id]) => id === t.q))
  const done = data.tasks.filter((t) => t.done).length

  const move = (id, q) =>
    set('tasks', (l) =>
      l.map((t) => {
        if (t.id !== id) return t
        if (!q) {
          const { q: _drop, ...rest } = t
          return rest
        }
        return { ...t, q }
      })
    )
  const finish = (t, e) => {
    set('tasks', (l) => l.map((x) => (x.id === t.id ? { ...x, done: true } : x)))
    confettiFrom(e, 'stars')
  }
  const add = (title, q) => set('tasks', (l) => [{ id: uid(), title, pri: q ? PRI[q] : 2, due: '', done: false, ...(q ? { q } : {}) }, ...l])
  const onDrag = (e, id) => {
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
  }
  const drop = (e, q) => {
    e.preventDefault()
    setOver(null)
    const id = e.dataTransfer.getData('text/plain')
    if (id && data.tasks.some((t) => t.id === id)) move(id, q)
  }

  return (
    <>
      <PageTitle sub="Four boxes for tasks by urgency and importance. The same tasks also appear on the Tasks page.">Eisenhower matrix</PageTitle>

      <div className="eq-axis" aria-hidden="true">
        <span />
        <b>Urgent</b>
        <b>Not urgent</b>
      </div>
      <div className="eq-wrap">
        <div className="eq-side" aria-hidden="true">
          <b>Important</b>
          <b>Not important</b>
        </div>
        <div className="eq-grid">
          {QUADS.map(([id, title, hint, emoji, tone]) => {
            const items = open.filter((t) => t.q === id)
            return (
              <section
                key={id}
                className={`eq-quad ${tone} ${over === id ? 'over' : ''}`}
                aria-label={`${title}: ${hint}`}
                onDragOver={(e) => {
                  e.preventDefault()
                  setOver(id)
                }}
                onDragLeave={() => setOver((o) => (o === id ? null : o))}
                onDrop={(e) => drop(e, id)}
              >
                <header>
                  <b>
                    {emoji} {title}
                  </b>
                  <small>{hint}</small>
                  <span className="eq-count">{items.length}</span>
                </header>
                {items.length === 0 ? (
                  <p className="tiny muted eq-empty">Drag tasks here or add them below.</p>
                ) : (
                  <ul className="eq-list">
                    {items.map((t) => (
                      <TaskRow key={t.id} t={t} current={id} onDone={finish} onMove={move} onDrag={onDrag} />
                    ))}
                  </ul>
                )}
                <QuickAdd label={title} onAdd={(t) => add(t, id)} />
              </section>
            )
          })}
        </div>
      </div>

      <Win title={`Unsorted tasks (${unsorted.length})`}>
        <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => drop(e, null)}>
          {unsorted.length === 0 ? (
            <p className="empty">All tasks sorted ✨</p>
          ) : (
            <>
              <p className="tiny muted">Send each task to a box with its emoji button, or drag it.</p>
              <ul className="eq-list">
                {unsorted.map((t) => (
                  <TaskRow key={t.id} t={t} current={null} onDone={finish} onMove={move} onDrag={onDrag} />
                ))}
              </ul>
            </>
          )}
          <QuickAdd label="Unsorted" onAdd={(t) => add(t, null)} />
          {done > 0 && <p className="tiny muted">{done} finished task{done === 1 ? '' : 's'} {done === 1 ? 'is' : 'are'} on the Tasks page.</p>}
        </div>
      </Win>
    </>
  )
}