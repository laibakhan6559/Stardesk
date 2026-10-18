import { useMemo, useState } from 'react'
import { Empty, PageTitle, Progress, Win } from '../components/ui'
import { PRIORITIES, countdown, todayStr } from '../lib/dates'
import { go } from '../lib/nav'
import { uid, useStore } from '../lib/store'
import { QUADS, quadOf } from '../lib/work'

const FILTERS = [
  ['open', 'To do'],
  ['today', 'Due today'],
  ['done', 'Done'],
  ['all', 'All'],
]

export default function Tasks() {
  const { data, set } = useStore()
  const [title, setTitle] = useState('')
  const [pri, setPri] = useState(2)
  const [due, setDue] = useState('')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('open')
  const today = todayStr()

  const add = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    set('tasks', (l) => [{ id: uid(), title: title.trim(), pri: Number(pri), due, done: false, ...(q ? { q } : {}) }, ...l])
    setTitle('')
    setDue('')
  }
  const toggle = (id) => set('tasks', (l) => l.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  const del = (id) => set('tasks', (l) => l.filter((t) => t.id !== id))
  const clearDone = () => set('tasks', (l) => l.filter((t) => !t.done))

  const list = useMemo(() => {
    const f = data.tasks.filter((t) =>
      filter === 'all' ? true : filter === 'done' ? t.done : filter === 'today' ? t.due === today && !t.done : !t.done
    )
    return f.sort((a, b) => Number(a.done) - Number(b.done) || (a.due || '9999').localeCompare(b.due || '9999') || b.pri - a.pri)
  }, [data.tasks, filter, today])

  const done = data.tasks.filter((t) => t.done).length

  return (
    <>
      <PageTitle sub="A simple to-do list with priorities and due dates.">Tasks</PageTitle>
      <div className="grid12">
        <div className="c8 stack-lg">
          <Win title="Add a task">
            <form className="row wrap" onSubmit={add}>
              <input
                className="grow"
                value={title}
                maxLength={120}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs doing?"
                aria-label="Task title"
              />
              <select value={pri} onChange={(e) => setPri(e.target.value)} aria-label="Priority">
                {Object.entries(PRIORITIES).map(([v, p]) => (
                  <option key={v} value={v}>
                    {p.label}
                  </option>
                ))}
              </select>
              <input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" />
              <select value={q} onChange={(e) => setQ(e.target.value)} aria-label="Eisenhower quadrant">
                <option value="">No quadrant</option>
                {QUADS.map(([id, label, hint, emoji]) => (
                  <option key={id} value={id}>
                    {emoji} {label} ({hint})
                  </option>
                ))}
              </select>
              <button className="btn" type="submit">
                Add
              </button>
            </form>
          </Win>

          <Win title="My tasks">
            <div className="seg small" role="tablist">
              {FILTERS.map(([id, label]) => (
                <button key={id} role="tab" aria-selected={filter === id} className={filter === id ? 'on' : ''} onClick={() => setFilter(id)}>
                  {label}
                </button>
              ))}
            </div>
            {list.length === 0 && <Empty>{filter === 'done' ? 'Nothing finished yet.' : 'All clear! ✨'}</Empty>}
            <ul className="tasklist">
              {list.map((t) => {
                const cd = t.due ? countdown(t.due) : null
                return (
                  <li key={t.id} className={t.done ? 'done' : ''}>
                    <input type="checkbox" className="chk" checked={t.done} onChange={() => toggle(t.id)} aria-label={`Complete ${t.title}`} />
                    <span className="pri" style={{ background: PRIORITIES[t.pri].color }} title={PRIORITIES[t.pri].label} />
                    <span className="ttl">{t.title}</span>
                    {t.q && quadOf(t.q) && (
                      <button type="button" className="qchip" title={`${quadOf(t.q)[1]} – click to open the matrix`} aria-label={`Quadrant: ${quadOf(t.q)[1]}`} onClick={() => go('eisenhower')}>
                        {quadOf(t.q)[3]}
                      </button>
                    )}
                    {cd && !t.done && <em className={`pill ${cd.n < 0 ? 'past' : cd.tone}`}>{cd.n < 0 ? 'overdue' : cd.text}</em>}
                    <button className="x" aria-label={`Delete ${t.title}`} onClick={() => del(t.id)}>
                      ×
                    </button>
                  </li>
                )
              })}
            </ul>
            {done > 0 && (
              <button className="btn small ghost" onClick={clearDone}>
                Clear {done} completed
              </button>
            )}
          </Win>
        </div>
        <div className="c4">
          <Win title="Progress">
            <p className="big">
              {done}/{data.tasks.length}
            </p>
            <Progress value={done} max={data.tasks.length} label="Tasks completed" />
            <p className="muted">tasks completed</p>
          </Win>
        </div>
      </div>
    </>
  )
}