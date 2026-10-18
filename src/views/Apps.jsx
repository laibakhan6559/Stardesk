import { useMemo, useState } from 'react'
import { PageTitle } from '../components/ui'
import { APPS, GROUPS } from '../lib/apps'
import { useStore } from '../lib/store'

function AppCard({ app, pinned, onPin }) {
  return (
    <li className={`app-card ${app.ready ? '' : 'soon'}`}>
      {app.ready ? (
        <a className="app-link" href={`#${app.id}`} onClick={() => window.scrollTo({ top: 0 })}>
          <span className="app-ico" aria-hidden="true">
            {app.emoji}
          </span>
          <span className="app-txt">
            <b>{app.label}</b>
            <small>{app.desc}</small>
          </span>
        </a>
      ) : (
        <div className="app-link" aria-disabled="true">
          <span className="app-ico" aria-hidden="true">
            {app.emoji}
          </span>
          <span className="app-txt">
            <b>{app.label}</b>
            <small>{app.desc}</small>
          </span>
          <em className="pill soon">Soon</em>
        </div>
      )}
      {app.ready && (
        <button type="button" className={`pin ${pinned ? 'on' : ''}`} aria-pressed={pinned} aria-label={pinned ? `Unpin ${app.label}` : `Pin ${app.label} to Home`} title={pinned ? 'Unpin from Home' : 'Pin to Home'} onClick={() => onPin(app.id)}>
          {pinned ? '★' : '☆'}
        </button>
      )}
    </li>
  )
}

export default function Apps() {
  const { data, set } = useStore()
  const [q, setQ] = useState('')
  const pins = data.pins || []
  const togglePin = (id) => set('pins', (p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  const s = q.trim().toLowerCase()
  const match = (a) => !s || a.label.toLowerCase().includes(s) || a.desc.toLowerCase().includes(s)
  const groups = useMemo(() => GROUPS.map(([id, label, emoji]) => ({ id, label, emoji, apps: APPS.filter((a) => a.group === id && match(a)) })).filter((g) => g.apps.length), [s]) // eslint-disable-line react-hooks/exhaustive-deps
  const pinned = APPS.filter((a) => a.ready && pins.includes(a.id) && match(a))
  const ready = APPS.filter((a) => a.ready).length

  return (
    <>
      <PageTitle
        sub={`${ready} of ${APPS.length} apps ready. Pin your favourites with ☆ to show them on Home.`}
        right={<input className="app-search" type="search" placeholder="Find an app…" aria-label="Find an app" value={q} onChange={(e) => setQ(e.target.value)} />}
      >
        Apps
      </PageTitle>

      {pinned.length > 0 && (
        <section className="app-group" aria-label="Pinned apps">
          <h2>⭐ Pinned</h2>
          <ul className="app-grid">
            {pinned.map((a) => (
              <AppCard key={a.id} app={a} pinned onPin={togglePin} />
            ))}
          </ul>
        </section>
      )}

      {groups.map((g) => (
        <section key={g.id} className="app-group" aria-label={g.label}>
          <h2>
            {g.emoji} {g.label} <small>{g.apps.length}</small>
          </h2>
          <ul className="app-grid">
            {g.apps.map((a) => (
              <AppCard key={a.id} app={a} pinned={pins.includes(a.id)} onPin={togglePin} />
            ))}
          </ul>
        </section>
      ))}

      {groups.length === 0 && <p className="empty">No app matches “{q}”.</p>}
    </>
  )
}