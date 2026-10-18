import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { TickList } from '../components/shared'
import { Empty, Field, PageTitle, Win } from '../components/ui'
import { fmtTime, todayStr } from '../lib/dates'
import { uid, useStore } from '../lib/store'
import { MEETING_TEMPLATES, meetingTemplate } from '../lib/work'

const openActions = (m) => (m.actions || []).filter((a) => !a.done).length

function asText(m) {
  const box = (i) => `${i.done ? '[x]' : '[ ]'} ${i.text}`
  const lines = [`${m.title || 'Meeting'}`, `${m.date}${m.time ? ` ${fmtTime(m.time)}` : ''}${m.who ? ` · ${m.who}` : ''}`, '']
  if (m.agenda.length) lines.push('Agenda', ...m.agenda.map(box), '')
  if (m.notes.trim()) lines.push('Notes', m.notes.trim(), '')
  if (m.actions.length) lines.push('Action items', ...m.actions.map(box))
  return lines.join('\n').trim()
}

export default function Meetings() {
  const { data, set, toast } = useStore()
  const [sel, setSel] = useState(null)
  const [tpl, setTpl] = useState('blank')
  const [q, setQ] = useState('')

  const list = [...data.meetings]
    .filter((m) => !q.trim() || [m.title, m.who, m.notes].some((x) => (x || '').toLowerCase().includes(q.trim().toLowerCase())))
    .sort((a, b) => `${b.date} ${b.time || ''}`.localeCompare(`${a.date} ${a.time || ''}`))
  const cur = data.meetings.find((m) => m.id === sel) || null
  const pending = data.meetings.reduce((a, m) => a + openActions(m), 0)

  const patch = (id, p) => set('meetings', (l) => l.map((m) => (m.id === id ? { ...m, ...p } : m)))
  const patchList = (id, key, fn) => set('meetings', (l) => l.map((m) => (m.id === id ? { ...m, [key]: fn(m[key] || []) } : m)))

  const create = () => {
    const t = meetingTemplate(tpl)
    const m = {
      id: uid(),
      title: t.id === 'blank' ? '' : t.label,
      date: todayStr(),
      time: '',
      who: '',
      template: t.id,
      agenda: t.agenda.map((text) => ({ id: uid(), text, done: false })),
      notes: t.notes,
      actions: [],
    }
    set('meetings', (l) => [m, ...l].slice(0, 400))
    setSel(m.id)
  }
  const del = (m) => {
    if (!window.confirm(`Delete “${m.title || 'this meeting'}”?`)) return
    set('meetings', (l) => l.filter((x) => x.id !== m.id))
    setSel(null)
  }
  const copy = async (m) => {
    try {
      await navigator.clipboard.writeText(asText(m))
      toast('Meeting notes copied ✓', 'info')
    } catch {
      toast('Could not copy – the browser blocked it.', 'info')
    }
  }

  return (
    <>
      <PageTitle sub="Start from a template with agenda, notes and action items. Everything in one place.">Meeting notes</PageTitle>
      <div className="grid12">
        <div className="c4 stack-lg">
          <Win title="New meeting">
            <div className="patterns" role="radiogroup" aria-label="Template">
              {MEETING_TEMPLATES.map((t) => (
                <button key={t.id} type="button" role="radio" aria-checked={tpl === t.id} className={tpl === t.id ? 'on' : ''} onClick={() => setTpl(t.id)}>
                  <span>
                    {t.emoji} {t.label}
                  </span>
                  <small>{t.agenda.length ? `${t.agenda.length} agenda points` : 'empty page'}</small>
                </button>
              ))}
            </div>
            <button className="btn" style={{ marginTop: '.7rem' }} onClick={create}>
              + Start meeting notes
            </button>
          </Win>

          <Win title={`All meetings${data.meetings.length ? ` (${data.meetings.length})` : ''}`}>
            {data.meetings.length > 0 && (
              <>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search meetings…" aria-label="Search meetings" style={{ marginBottom: '.5rem' }} />
                {pending > 0 && <p className="tiny muted">{pending} action item{pending === 1 ? '' : 's'} still open</p>}
              </>
            )}
            {list.length === 0 ? (
              <Empty>{data.meetings.length ? 'Nothing found.' : 'No meetings yet.'}</Empty>
            ) : (
              <ul className="listpick">
                {list.map((m) => (
                  <li key={m.id}>
                    <button type="button" className={sel === m.id ? 'on' : ''} onClick={() => setSel(m.id)}>
                      <span>
                        {meetingTemplate(m.template).emoji} {m.title || 'Untitled meeting'}
                        <br />
                        <small>{format(parseISO(m.date), 'd MMM yyyy')}</small>
                      </span>
                      {openActions(m) > 0 && <small>{openActions(m)} to do</small>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Win>
        </div>

        <div className="c8 stack-lg">
          {!cur ? (
            <Win title="Meeting">
              <Empty>Pick a template on the left to start a meeting, or open an old one.</Empty>
            </Win>
          ) : (
            <>
              <Win
                title={cur.title || 'Untitled meeting'}
                actions={
                  <button type="button" aria-label="Copy notes as text" title="Copy as text" onClick={() => copy(cur)}>
                    ⧉
                  </button>
                }
              >
                <div className="form">
                  <Field label="Title">
                    <input maxLength={80} value={cur.title} onChange={(e) => patch(cur.id, { title: e.target.value })} placeholder="e.g. Weekly sync with design team" />
                  </Field>
                  <div className="row wrap">
                    <Field label="Date" grow>
                      <input type="date" value={cur.date} onChange={(e) => e.target.value && patch(cur.id, { date: e.target.value })} />
                    </Field>
                    <Field label="Time" grow>
                      <input type="time" value={cur.time || ''} onChange={(e) => patch(cur.id, { time: e.target.value })} />
                    </Field>
                  </div>
                  <Field label="Who is there">
                    <input maxLength={160} value={cur.who} onChange={(e) => patch(cur.id, { who: e.target.value })} placeholder="Names, comma separated" />
                  </Field>
                </div>
              </Win>

              <Win title="Agenda">
                <TickList
                  items={cur.agenda}
                  placeholder="Add an agenda point…"
                  empty="The agenda is empty."
                  onAdd={(text) => patchList(cur.id, 'agenda', (l) => [...l, { id: uid(), text, done: false }])}
                  onToggle={(id, done) => patchList(cur.id, 'agenda', (l) => l.map((i) => (i.id === id ? { ...i, done } : i)))}
                  onRemove={(id) => patchList(cur.id, 'agenda', (l) => l.filter((i) => i.id !== id))}
                />
              </Win>

              <Win title="Notes">
                <textarea className="meetnotes" rows={9} maxLength={8000} value={cur.notes} onChange={(e) => patch(cur.id, { notes: e.target.value })} aria-label="Meeting notes" placeholder="Decisions, numbers, things people said…" />
              </Win>

              <Win title={`Action items${openActions(cur) ? ` · ${openActions(cur)} open` : ''}`}>
                <TickList
                  items={cur.actions}
                  placeholder="Who does what by when…"
                  empty="No action items."
                  onAdd={(text) => patchList(cur.id, 'actions', (l) => [...l, { id: uid(), text, done: false }])}
                  onToggle={(id, done) => patchList(cur.id, 'actions', (l) => l.map((i) => (i.id === id ? { ...i, done } : i)))}
                  onRemove={(id) => patchList(cur.id, 'actions', (l) => l.filter((i) => i.id !== id))}
                />
                {cur.actions.some((a) => !a.done) && (
                  <button
                    className="btn small ghost"
                    style={{ marginTop: '.6rem' }}
                    title="Send open action items to Tasks"
                    onClick={() => {
                      const open = cur.actions.filter((a) => !a.done)
                      set('tasks', (l) => [...open.map((a) => ({ id: uid(), title: a.text.slice(0, 120), pri: 2, due: '', done: false })), ...l])
                      toast(`${open.length} task${open.length === 1 ? '' : 's'} added ✓`, 'info')
                    }}
                  >
                    → Send open items to Tasks
                  </button>
                )}
              </Win>

              <div className="row end">
                <button className="btn ghost danger" onClick={() => del(cur)}>
                  Delete this meeting
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}