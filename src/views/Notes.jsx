import { useEffect } from 'react'
import { format } from 'date-fns'
import { Empty, PageTitle, Win } from '../components/ui'
import { Folder } from '../components/art'
import { uid, useStore } from '../lib/store'

export const PAPERS = [
  ['blank', 'Blank'],
  ['lines', 'Lines'],
  ['grid', 'Grid'],
  ['dots', 'Dots'],
]

export default function Notes() {
  const { data, set, ui, setUi } = useStore()
  const filter = ui.paper
  const list = data.notes
    .filter((n) => filter === 'all' || n.paper === filter)
    .sort((a, b) => b.updated - a.updated)
  const current = data.notes.find((n) => n.id === ui.noteId) || null

  useEffect(() => {
    if (ui.noteId && !data.notes.some((n) => n.id === ui.noteId)) setUi({ noteId: null })
  }, [data.notes, ui.noteId, setUi])

  const create = (paper) => {
    const n = { id: uid(), title: '', body: '', paper, updated: Date.now() }
    set('notes', (l) => [n, ...l])
    setUi({ noteId: n.id })
  }
  const patch = (id, p) => set('notes', (l) => l.map((n) => (n.id === id ? { ...n, ...p, updated: Date.now() } : n)))
  const remove = (n) => {
    if (!window.confirm(`Delete "${n.title || 'Untitled note'}"?`)) return
    set('notes', (l) => l.filter((x) => x.id !== n.id))
    setUi({ noteId: null })
  }

  return (
    <>
      <PageTitle sub="Pick a paper style, jot ideas down, and find them again with search. Notes save automatically.">Notes</PageTitle>
      <div className="grid12">
        <div className="c4 stack-lg">
          <Win title="New note">
            <div className="folders">
              {PAPERS.map(([id, label]) => (
                <button key={id} className="folder" onClick={() => create(id)} aria-label={`New ${label} note`}>
                  <Folder kind={id} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </Win>
          <Win title="My notes">
            <div className="seg small wrapseg" role="tablist">
              {[['all', 'All'], ...PAPERS].map(([id, label]) => (
                <button key={id} role="tab" aria-selected={filter === id} className={filter === id ? 'on' : ''} onClick={() => setUi({ paper: id })}>
                  {label}
                </button>
              ))}
            </div>
            {list.length === 0 && <Empty>No notes here yet. Open a folder above ✨</Empty>}
            <ul className="notelist">
              {list.map((n) => (
                <li key={n.id}>
                  <button className={n.id === ui.noteId ? 'on' : ''} onClick={() => setUi({ noteId: n.id })}>
                    <b>{n.title || 'Untitled note'}</b>
                    <small>
                      {n.paper}
                      {Number.isFinite(n.updated) ? ` · ${format(n.updated, 'd MMM, h:mm a')}` : ''}
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          </Win>
        </div>

        <div className="c8">
          {current ? (
            <Win
              title={`Note · ${current.paper}`}
              actions={
                <select
                  className="papersel"
                  value={current.paper}
                  onChange={(e) => patch(current.id, { paper: e.target.value })}
                  aria-label="Paper style"
                >
                  {PAPERS.map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              }
            >
              <input
                className="note-title"
                value={current.title}
                maxLength={80}
                onChange={(e) => patch(current.id, { title: e.target.value })}
                placeholder="Title"
                aria-label="Note title"
              />
              <textarea
                className={`paper paper-${current.paper}`}
                value={current.body}
                onChange={(e) => patch(current.id, { body: e.target.value })}
                placeholder="Start writing…"
                aria-label="Note body"
              />
              <div className="row between">
                <small className="muted">
                  {current.body.trim() ? current.body.trim().split(/\s+/).length : 0} words · saved automatically
                </small>
                <button className="btn small danger" onClick={() => remove(current)}>
                  Delete note
                </button>
              </div>
            </Win>
          ) : (
            <Win title="Notes">
              <Empty>Choose a note on the left or open a paper folder to start a new one.</Empty>
            </Win>
          )}
        </div>
      </div>
    </>
  )
}