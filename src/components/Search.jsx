import { useEffect, useMemo, useState } from 'react'
import { Modal } from './ui'
import { go } from '../lib/nav'
import { searchSources } from '../lib/searchSources'
import { useStore } from '../lib/store'

export default function Search({ onClose }) {
  const { data, setUi } = useStore()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)

  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return []
    const has = (x) => (x || '').toLowerCase().includes(s)
    const ctx = { data, has, go, setUi }
    // A few results from each source first, so one busy source cannot hide the rest.
    const per = searchSources.map((src) => {
      try {
        return src.run(ctx)
      } catch {
        return []
      }
    })
    const out = []
    for (let round = 0; out.length < 20 && round < 20; round++) {
      let added = false
      for (const list of per) {
        if (list[round]) {
          out.push(list[round])
          added = true
        }
      }
      if (!added) break
    }
    return out.slice(0, 20)
  }, [q, data, setUi])

  useEffect(() => setActive(0), [q])

  const pick = (r) => {
    r.run()
    onClose()
  }
  const onKeyDown = (e) => {
    if (!results.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (a + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      pick(results[active] || results[0])
    }
  }

  return (
    <Modal title="Search" onClose={onClose}>
      <input
        autoFocus
        className="search-input"
        placeholder="Search apps, tasks, events, notes…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={onKeyDown}
        aria-label="Search everything"
        role="combobox"
        aria-expanded={results.length > 0}
        aria-controls="search-results"
        aria-activedescendant={results.length ? `sr-${active}` : undefined}
      />
      <ul className="results" id="search-results" role="listbox">
        {results.map((r, i) => (
          <li key={r.k} id={`sr-${i}`} role="option" aria-selected={i === active}>
            <button type="button" tabIndex={-1} className={i === active ? 'active' : ''} onMouseEnter={() => setActive(i)} onClick={() => pick(r)}>
              <span>
                {r.icon} {r.text}
              </span>
              <em>{r.tag}</em>
            </button>
          </li>
        ))}
        {q.trim() && results.length === 0 && <li className="empty">Nothing found – try another word.</li>}
        {!q.trim() && <li className="empty">Type to search across your whole planner. Use ↑ ↓ and Enter.</li>}
      </ul>
    </Modal>
  )
}