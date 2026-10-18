import { useState } from 'react'
import { Empty, PageTitle, Progress, Win } from '../components/ui'
import { TickList, fireConfetti } from '../components/shared'
import { LIST_TEMPLATES } from '../lib/daily'
import { uid, useStore } from '../lib/store'

const EMOJIS = ['🛒', '🧳', '🎒', '🌙', '🎁', '🏕️', '🧺', '📦']

export default function Lists() {
  const { data, set, toast } = useStore()
  const [sel, setSel] = useState(null)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🛒')
  const lists = data.lists
  const cur = lists.find((l) => l.id === sel) || lists[0] || null

  const create = (e) => {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    const l = { id: uid(), name: n, emoji, items: [] }
    set('lists', (a) => [...a, l])
    setSel(l.id)
    setName('')
  }
  const fromTemplate = (t) => {
    const l = { id: uid(), name: t.name, emoji: t.emoji, items: t.items.map((text) => ({ id: uid(), text, done: false })) }
    set('lists', (a) => [...a, l])
    setSel(l.id)
    toast(`“${t.name}” list added ✨`, 'ok')
  }
  const patch = (fn) => set('lists', (a) => a.map((l) => (l.id === cur.id ? fn(l) : l)))
  const addItem = (text) => patch((l) => ({ ...l, items: [...l.items, { id: uid(), text, done: false }] }))
  const toggle = (id, done, e) => {
    const items = cur.items.map((i) => (i.id === id ? { ...i, done } : i))
    patch((l) => ({ ...l, items }))
    if (done && items.every((i) => i.done)) fireConfetti({ x: e?.nativeEvent?.clientX, y: e?.nativeEvent?.clientY, kind: 'stars' })
  }
  const remove = (id) => patch((l) => ({ ...l, items: l.items.filter((i) => i.id !== id) }))
  const untick = () => patch((l) => ({ ...l, items: l.items.map((i) => ({ ...i, done: false })) }))
  const removeTicked = () => patch((l) => ({ ...l, items: l.items.filter((i) => !i.done) }))
  const rename = (v) => patch((l) => ({ ...l, name: v }))
  const duplicate = () => {
    const copy = { ...cur, id: uid(), name: `${cur.name} (copy)`, items: cur.items.map((i) => ({ ...i, id: uid(), done: false })) }
    set('lists', (a) => [...a, copy])
    setSel(copy.id)
  }
  const del = () => {
    if (!window.confirm(`Delete “${cur.name}”?`)) return
    set('lists', (a) => a.filter((l) => l.id !== cur.id))
    setSel(null)
  }

  const done = cur ? cur.items.filter((i) => i.done).length : 0

  return (
    <>
      <PageTitle sub="Reusable lists: make one once, then clear the ticks and reuse it for every trip or month.">Shopping &amp; packing</PageTitle>
      <div className="grid12">
        <div className="c4 stack-lg">
          <Win title="My lists">
            {lists.length === 0 ? (
              <Empty>No lists yet. Start from a template below.</Empty>
            ) : (
              <ul className="listpick">
                {lists.map((l) => {
                  const d = l.items.filter((i) => i.done).length
                  return (
                    <li key={l.id}>
                      <button className={cur?.id === l.id ? 'on' : ''} onClick={() => setSel(l.id)}>
                        <span>
                          {l.emoji} {l.name}
                        </span>
                        <small>
                          {d}/{l.items.length}
                        </small>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </Win>

          <Win title="New list">
            <form className="form" onSubmit={create}>
              <input required maxLength={40} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Murree trip" aria-label="List name" />
              <div className="emojis" role="radiogroup" aria-label="Icon">
                {EMOJIS.map((e) => (
                  <button type="button" key={e} role="radio" aria-checked={emoji === e} className={emoji === e ? 'on' : ''} onClick={() => setEmoji(e)}>
                    {e}
                  </button>
                ))}
              </div>
              <button className="btn" type="submit">
                Create list
              </button>
            </form>
          </Win>

          <Win title="Templates" defaultOpen={lists.length === 0}>
            <div className="stack">
              {LIST_TEMPLATES.map((t) => (
                <button key={t.name} className="btn small ghost" onClick={() => fromTemplate(t)}>
                  {t.emoji} {t.name}
                </button>
              ))}
            </div>
          </Win>
        </div>

        <div className="c8">
          {cur ? (
            <Win title={`${cur.emoji} ${cur.name}`}>
              <div className="row wrap" style={{ marginBottom: '.6rem' }}>
                <input className="grow" value={cur.name} maxLength={40} onChange={(e) => rename(e.target.value)} aria-label="Rename list" />
                <button className="btn small ghost" onClick={duplicate}>
                  Duplicate
                </button>
                <button className="btn small ghost" onClick={del}>
                  Delete
                </button>
              </div>
              <Progress value={done} max={cur.items.length} label="List progress" />
              <TickList items={cur.items} onAdd={addItem} onToggle={toggle} onRemove={remove} placeholder="Add an item…" empty="The list is empty." />
              {cur.items.length > 0 && (
                <div className="row wrap" style={{ marginTop: '.7rem' }}>
                  <button className="btn small" onClick={untick} disabled={done === 0}>
                    ↺ Reuse: untick all
                  </button>
                  <button className="btn small ghost" onClick={removeTicked} disabled={done === 0}>
                    Remove ticked
                  </button>
                </div>
              )}
            </Win>
          ) : (
            <Win title="Lists">
              <Empty>Pick a list from the left or create a new one.</Empty>
            </Win>
          )}
        </div>
      </div>
    </>
  )
}