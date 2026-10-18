import { useState } from 'react'
import { confettiFrom } from '../components/shared'
import { Empty, Field, Modal, PageTitle, Progress, Win } from '../components/ui'
import { todayStr } from '../lib/dates'
import { READ_STATUS, stars } from '../lib/growth'
import { uid, useStore } from '../lib/store'

const blank = () => ({ title: '', author: '', status: 'to', pages: '', read: '', rating: 0 })

function Rating({ value, onChange, label }) {
  return (
    <span className="starrate" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} className={n <= value ? 'on' : ''} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => onChange(value === n ? 0 : n)}>
          ★
        </button>
      ))}
    </span>
  )
}

function BookForm({ initial, onSave, onCancel, submitLabel }) {
  const [f, setF] = useState(initial)
  const up = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const submit = (e) => {
    e.preventDefault()
    if (!f.title.trim()) return
    const pages = Math.max(0, Math.round(Number(f.pages) || 0))
    let read = Math.max(0, Math.round(Number(f.read) || 0))
    if (pages) read = Math.min(read, pages)
    if (f.status === 'done' && pages) read = pages
    if (f.status === 'to') read = 0
    onSave({ ...f, title: f.title.trim(), author: f.author.trim(), pages, read })
  }
  return (
    <form className="form" onSubmit={submit}>
      <Field label="Book title">
        <input required autoFocus maxLength={80} value={f.title} onChange={up('title')} />
      </Field>
      <Field label="Author">
        <input maxLength={60} value={f.author} onChange={up('author')} />
      </Field>
      <Field label="Status">
        <select value={f.status} onChange={up('status')}>
          {READ_STATUS.map(([id, l, e]) => (
            <option key={id} value={id}>
              {e} {l}
            </option>
          ))}
        </select>
      </Field>
      <div className="row wrap">
        <Field label="Total pages" grow>
          <input type="number" min="0" inputMode="numeric" value={f.pages} onChange={up('pages')} />
        </Field>
        <Field label="Pages read" grow>
          <input type="number" min="0" inputMode="numeric" value={f.read} onChange={up('read')} />
        </Field>
      </div>
      <div className="row end">
        {onCancel && (
          <button type="button" className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button className="btn" type="submit">
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

export default function Reading() {
  const { data, set } = useStore()
  const [tab, setTab] = useState('reading')
  const [key, setKey] = useState(0)
  const [edit, setEdit] = useState(null)
  const books = data.reading
  const year = String(new Date().getFullYear())
  const doneYear = books.filter((b) => b.status === 'done' && (b.finished || '').startsWith(year)).length
  const list = books.filter((b) => b.status === tab)

  const finishedOn = (b, status) => (status === 'done' ? b.finished || todayStr() : null)
  const add = (v) => {
    set('reading', (l) => [{ ...v, id: uid(), finished: finishedOn({}, v.status) }, ...l].slice(0, 500))
    setKey((k) => k + 1)
    setTab(v.status)
  }
  const save = (v) => {
    set('reading', (l) => l.map((b) => (b.id === edit.id ? { ...b, ...v, finished: finishedOn(b, v.status) } : b)))
    setEdit(null)
  }
  const up = (id, patch) => set('reading', (l) => l.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  const bump = (b, pages) => {
    const read = Math.max(0, b.pages ? Math.min(b.pages, b.read + pages) : b.read + pages)
    up(b.id, { read })
  }
  const finish = (b, e) => {
    up(b.id, { status: 'done', read: b.pages || b.read, finished: todayStr() })
    confettiFrom(e, 'stars')
    setTab('done')
  }
  const del = (b) => window.confirm(`Delete “${b.title}”?`) && set('reading', (l) => l.filter((x) => x.id !== b.id))

  return (
    <>
      <PageTitle sub="Books to read, reading now, and finished. Page progress and ratings.">Reading list</PageTitle>
      <div className="grid12">
        <div className="c8 stack-lg">
          <Win title={`Books · ${doneYear} finished in ${year}`}>
            <div className="seg small" role="tablist">
              {READ_STATUS.map(([id, l, e]) => (
                <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
                  {e} {l} ({books.filter((b) => b.status === id).length})
                </button>
              ))}
            </div>
            {list.length === 0 ? (
              <Empty>{tab === 'to' ? 'No books to read yet.' : tab === 'reading' ? 'No books being read right now.' : 'No finished books yet.'}</Empty>
            ) : (
              <ul className="booklist">
                {list.map((b) => (
                  <li key={b.id}>
                    <div className="bk-main">
                      <b>{b.title}</b>
                      <small>{b.author || 'Author unknown'}{b.finished ? ` · finished ${b.finished}` : ''}</small>
                      {b.status === 'reading' && (
                        <>
                          <Progress value={b.read} max={b.pages || 0} label={`Progress of ${b.title}`} />
                          <small>
                            {b.read}
                            {b.pages ? ` / ${b.pages} pages (${Math.round((b.read / b.pages) * 100)}%)` : ' pages'}
                          </small>
                        </>
                      )}
                      {b.status === 'done' && <Rating value={b.rating} label={`Rating for ${b.title}`} onChange={(n) => up(b.id, { rating: n })} />}
                    </div>
                    <div className="bk-act">
                      {b.status === 'to' && (
                        <button className="btn small" onClick={() => up(b.id, { status: 'reading' })}>
                          Start
                        </button>
                      )}
                      {b.status === 'reading' && (
                        <>
                          <button className="btn small ghost" onClick={() => bump(b, 10)}>
                            +10
                          </button>
                          <button className="btn small ghost" onClick={() => bump(b, 25)}>
                            +25
                          </button>
                          <button className="btn small" onClick={(e) => finish(b, e)}>
                            ✓ Done
                          </button>
                        </>
                      )}
                      <button className="btn small ghost" aria-label={`Edit ${b.title}`} onClick={() => setEdit(b)}>
                        ✎
                      </button>
                      <button className="x" aria-label={`Delete ${b.title}`} onClick={() => del(b)}>
                        ×
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Win>
        </div>
        <div className="c4">
          <Win title="Add a book">
            <BookForm key={key} initial={blank()} onSave={add} submitLabel="Add" />
          </Win>
        </div>
      </div>
      {edit && (
        <Modal title={`Edit ${edit.title}`} onClose={() => setEdit(null)}>
          <BookForm initial={{ ...blank(), ...edit, pages: String(edit.pages || ''), read: String(edit.read || '') }} onSave={save} onCancel={() => setEdit(null)} submitLabel="Save" />
        </Modal>
      )}
    </>
  )
}