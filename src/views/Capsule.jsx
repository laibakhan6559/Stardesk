import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { fireConfetti } from '../components/shared'
import { Empty, Field, PageTitle, Win } from '../components/ui'
import { addDays } from 'date-fns'
import { todayStr, ymd } from '../lib/dates'
import { CAPSULE_PRESETS, capsuleDate, capsuleState } from '../lib/growth'
import { uid, useStore } from '../lib/store'

export default function Capsule() {
  const { data, set } = useStore()
  const today = todayStr()
  const [f, setF] = useState({ title: '', text: '', opens: capsuleDate(6) })
  const [seen, setSeen] = useState(null) // id of the capsule that was just opened
  const tomorrow = ymd(addDays(new Date(), 1))
  const list = [...data.capsule].sort((a, b) => a.opens.localeCompare(b.opens))

  const seal = (e) => {
    e.preventDefault()
    if (!f.text.trim() || f.opens < tomorrow) return
    set('capsule', (l) => [...l, { id: uid(), title: f.title.trim(), text: f.text.trim(), created: today, opens: f.opens, openedOn: null }].slice(0, 100))
    setF({ title: '', text: '', opens: capsuleDate(6) })
    fireConfetti({ kind: 'stars', count: 30 })
  }
  const open = (c) => {
    set('capsule', (l) => l.map((x) => (x.id === c.id ? { ...x, openedOn: today } : x)))
    setSeen(c.id)
    fireConfetti({ kind: 'confetti', count: 90 })
  }
  const del = (c) => {
    const msg = capsuleState(c).key === 'sealed' ? 'This capsule is still sealed. Deleting it will lose the message forever. Continue?' : 'Delete this capsule?'
    if (window.confirm(msg)) set('capsule', (l) => l.filter((x) => x.id !== c.id))
  }

  return (
    <>
      <PageTitle sub="Write a message to yourself that opens later.">Time capsule</PageTitle>
      <div className="grid12">
        <div className="c8 stack-lg">
          {list.length === 0 ? (
            <Win title="Your capsules">
              <Empty>No capsules yet. Seal your first one from the right ➜</Empty>
            </Win>
          ) : (
            list.map((c) => {
              const st = capsuleState(c)
              return (
                <Win key={c.id} title={`${st.key === 'sealed' ? '🔒' : st.key === 'ready' ? '🎁' : '💌'} ${c.title || 'Letter to myself'}`}>
                  <p className="tiny muted">
                    Written {format(parseISO(c.created), 'd MMM yyyy')} · opens {format(parseISO(c.opens), 'd MMM yyyy')}
                  </p>
                  {st.key === 'sealed' && (
                    <p className="capsule-sealed">
                      🔒 Sealed – {st.n} days left{st.n > 30 ? ` (~${Math.round(st.n / 30)} months)` : ''}
                    </p>
                  )}
                  {st.key === 'ready' && (
                    <div className="row wrap">
                      <button className="btn" onClick={() => open(c)}>
                        🎁 Open my capsule
                      </button>
                    </div>
                  )}
                  {st.key === 'opened' && <p className={`capsule-text ${seen === c.id ? 'fresh' : ''}`}>{c.text}</p>}
                  <div className="row end">
                    <button className="btn small ghost" onClick={() => del(c)}>
                      Delete
                    </button>
                  </div>
                </Win>
              )
            })
          )}
        </div>
        <div className="c4 stack-lg">
          <Win title="Write a new capsule">
            <form className="form" onSubmit={seal}>
              <Field label="Title (optional)">
                <input maxLength={60} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Dear future me" />
              </Field>
              <Field label="Message">
                <textarea required rows={6} maxLength={4000} value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} placeholder="How am I feeling today, and what am I hoping for…" />
              </Field>
              <div className="chips presets" role="group" aria-label="Open after">
                {CAPSULE_PRESETS.map(([m, l]) => (
                  <button key={m} type="button" className="chip" onClick={() => setF({ ...f, opens: capsuleDate(m) })}>
                    {l}
                  </button>
                ))}
              </div>
              <Field label="Opens on">
                <input type="date" min={tomorrow} value={f.opens} onChange={(e) => setF({ ...f, opens: e.target.value })} />
              </Field>
              <button className="btn" type="submit" disabled={!f.text.trim() || f.opens < tomorrow}>
                🔒 Seal capsule
              </button>
            </form>
            <p className="tiny muted">
              Capsules stay only in this browser and never show up in search. Note: they are not encrypted, and the message is stored as plain text in the backup file.
            </p>
          </Win>
        </div>
      </div>
    </>
  )
}