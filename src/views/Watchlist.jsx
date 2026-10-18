import { useState } from 'react'
import { confettiFrom } from '../components/shared'
import { Empty, PageTitle, Win } from '../components/ui'
import { WATCH_KINDS, WATCH_STATUS, kindEmoji } from '../lib/growth'
import { uid, useStore } from '../lib/store'

export default function Watchlist() {
  const { data, set } = useStore()
  const [tab, setTab] = useState('to')
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState('movie')
  const items = data.watch
  const list = items.filter((w) => w.status === tab)
  const up = (id, patch) => set('watch', (l) => l.map((w) => (w.id === id ? { ...w, ...patch } : w)))

  const add = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    set('watch', (l) => [{ id: uid(), title: title.trim(), kind, status: 'to', rating: 0, note: '' }, ...l].slice(0, 500))
    setTitle('')
    setTab('to')
  }
  const finish = (w, e) => {
    up(w.id, { status: 'done' })
    confettiFrom(e, 'stars')
  }
  const del = (w) => set('watch', (l) => l.filter((x) => x.id !== w.id))
  const pickRandom = () => {
    const pool = items.filter((w) => w.status === 'to')
    if (!pool.length) return
    const w = pool[Math.floor(Math.random() * pool.length)]
    window.alert(`Tonight: ${kindEmoji(w.kind)} ${w.title}`)
  }
  const avg = (() => {
    const r = items.filter((w) => w.rating > 0)
    return r.length ? (r.reduce((a, w) => a + w.rating, 0) / r.length).toFixed(1) : null
  })()

  return (
    <>
      <PageTitle sub="To watch, watching, watched, and ratings. Can’t decide? There is a random pick too.">Movies &amp; shows</PageTitle>
      <div className="grid12">
        <div className="c8">
          <Win title={`Watchlist${avg ? ` · avg ★ ${avg}` : ''}`}>
            <div className="seg small" role="tablist">
              {WATCH_STATUS.map(([id, l, e]) => (
                <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
                  {e} {l} ({items.filter((w) => w.status === id).length})
                </button>
              ))}
            </div>
            {list.length === 0 ? (
              <Empty>{tab === 'to' ? 'Your watchlist is empty. Add something from the right ➜' : 'Nothing here yet.'}</Empty>
            ) : (
              <ul className="booklist">
                {list.map((w) => (
                  <li key={w.id}>
                    <div className="bk-main">
                      <b>
                        {kindEmoji(w.kind)} {w.title}
                      </b>
                      <small>{WATCH_KINDS.find((k) => k[0] === w.kind)?.[1]}</small>
                      {w.status === 'done' && (
                        <>
                          <span className="starrate" role="radiogroup" aria-label={`Rating for ${w.title}`}>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button key={n} type="button" role="radio" aria-checked={w.rating === n} aria-label={`${n} stars`} className={n <= w.rating ? 'on' : ''} onClick={() => up(w.id, { rating: w.rating === n ? 0 : n })}>
                                ★
                              </button>
                            ))}
                          </span>
                          <input className="wnote" maxLength={120} value={w.note} placeholder="One-line review…" aria-label={`Note on ${w.title}`} onChange={(e) => up(w.id, { note: e.target.value })} />
                        </>
                      )}
                    </div>
                    <div className="bk-act">
                      {w.status === 'to' && (
                        <button className="btn small" onClick={() => up(w.id, { status: 'watching' })}>
                          Start
                        </button>
                      )}
                      {w.status !== 'done' && (
                        <button className="btn small" onClick={(e) => finish(w, e)}>
                          ✓ Watched
                        </button>
                      )}
                      <button className="x" aria-label={`Delete ${w.title}`} onClick={() => del(w)}>
                        ×
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Win>
        </div>
        <div className="c4 stack-lg">
          <Win title="Add to watchlist">
            <form className="form" onSubmit={add}>
              <input required maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" aria-label="Title" />
              <div className="seg small wrapseg" role="tablist">
                {WATCH_KINDS.map(([id, l, e]) => (
                  <button key={id} type="button" role="tab" aria-selected={kind === id} className={kind === id ? 'on' : ''} onClick={() => setKind(id)}>
                    {e} {l}
                  </button>
                ))}
              </div>
              <button className="btn" type="submit">
                Add
              </button>
            </form>
          </Win>
          {items.some((w) => w.status === 'to') && (
            <button className="bigbtn" onClick={pickRandom}>
              🎲 What to watch tonight?
            </button>
          )}
        </div>
      </div>
    </>
  )
}