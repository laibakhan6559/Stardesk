import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Empty, Field, Modal, PageTitle, Win } from '../components/ui'
import { TickList } from '../components/shared'
import { OCCASIONS, REMIND_DAYS, nextOccurrence, occInfo } from '../lib/daily'
import { todayStr } from '../lib/dates'
import { uid, useStore } from '../lib/store'

const blank = () => ({ name: '', kind: 'birthday', date: todayStr(), yearKnown: false, remind: 1, note: '' })

function OccasionForm({ initial, onSave, onCancel, submitLabel }) {
  const [f, setF] = useState(initial)
  const up = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const submit = (e) => {
    e.preventDefault()
    const name = f.name.trim()
    if (!name || !f.date) return
    onSave({ ...f, name, remind: Number(f.remind), note: f.note.trim() })
  }
  return (
    <form className="form" onSubmit={submit}>
      <Field label="Name">
        <input required autoFocus maxLength={40} value={f.name} onChange={up('name')} placeholder="e.g. Mom" />
      </Field>
      <div className="seg small wrapseg" role="tablist">
        {OCCASIONS.map(([v, l, e]) => (
          <button key={v} type="button" role="tab" aria-selected={f.kind === v} className={f.kind === v ? 'on' : ''} onClick={() => setF({ ...f, kind: v })}>
            {e} {l}
          </button>
        ))}
      </div>
      <Field label="Date">
        <input type="date" required value={f.date} onChange={up('date')} />
      </Field>
      <label className="switch">
        <input type="checkbox" checked={f.yearKnown} onChange={(e) => setF({ ...f, yearKnown: e.target.checked })} />
        <span>I know the year (show age / years together)</span>
      </label>
      <Field label="Remind me">
        <select value={f.remind} onChange={up('remind')}>
          {REMIND_DAYS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Note (optional)">
        <input maxLength={80} value={f.note} onChange={up('note')} placeholder="e.g. Chocolate cake" />
      </Field>
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

export default function Birthdays() {
  const { data, set } = useStore()
  const [open, setOpen] = useState(null)
  const [edit, setEdit] = useState(null)
  const [filter, setFilter] = useState('all')
  const today = new Date()

  const rows = data.birthdays
    .filter((b) => filter === 'all' || b.kind === filter)
    .map((b) => ({ b, o: nextOccurrence(b, today) }))
    .filter((r) => r.o)
    .sort((a, c) => a.o.n - c.o.n)

  const add = (v) => set('birthdays', (l) => [...l, { ...v, id: uid(), gifts: [] }])
  const save = (v) => {
    set('birthdays', (l) => l.map((b) => (b.id === edit.id ? { ...b, ...v } : b)))
    setEdit(null)
  }
  const del = (b) => window.confirm(`Delete ${b.name}?`) && set('birthdays', (l) => l.filter((x) => x.id !== b.id))
  const gifts = (id, fn) => set('birthdays', (l) => l.map((b) => (b.id === id ? { ...b, gifts: fn(b.gifts || []) } : b)))

  const when = (n) => (n === 0 ? 'Today! 🎉' : n === 1 ? 'Tomorrow' : `in ${n} days`)

  return (
    <>
      <PageTitle sub="Yearly reminders, plus a place for gift ideas for each person.">Birthdays &amp; anniversaries</PageTitle>
      <div className="grid12">
        <div className="c8 stack-lg">
          <Win title="Coming up">
            <div className="seg small wrapseg" role="tablist" aria-label="Filter">
              <button role="tab" aria-selected={filter === 'all'} className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>
                All
              </button>
              {OCCASIONS.map(([v, l, e]) => (
                <button key={v} role="tab" aria-selected={filter === v} className={filter === v ? 'on' : ''} onClick={() => setFilter(v)}>
                  {e} {l}
                </button>
              ))}
            </div>
            {rows.length === 0 ? (
              <Empty>No dates yet. Add one from the right ➜</Empty>
            ) : (
              <ul className="occlist">
                {rows.map(({ b, o }) => {
                  const [, label, emoji] = occInfo(b.kind)
                  const g = b.gifts || []
                  const isOpen = open === b.id
                  return (
                    <li key={b.id} className={o.n <= 7 ? 'soon' : ''}>
                      <div className="oc-row">
                        <span className="oc-ico" aria-hidden="true">
                          {emoji}
                        </span>
                        <span className="oc-txt">
                          <b>{b.name}</b>
                          <small>
                            {label} · {format(o.date, 'EEE, d MMM')}
                            {o.years != null && o.years > 0 ? ` · ${b.kind === 'birthday' ? `turns ${o.years}` : `${o.years} years`}` : ''}
                          </small>
                          {b.note && <small className="oc-note">📝 {b.note}</small>}
                        </span>
                        <em className={`pill ${o.n <= 1 ? 'hot' : o.n <= 7 ? 'soon' : 'far'}`}>{when(o.n)}</em>
                      </div>
                      <div className="row wrap" style={{ marginTop: '.4rem' }}>
                        <button className="btn small ghost" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : b.id)}>
                          🎁 Gift ideas{g.length ? ` (${g.length})` : ''}
                        </button>
                        <button className="btn small ghost" onClick={() => setEdit(b)}>
                          ✎ Edit
                        </button>
                        <button className="btn small ghost" onClick={() => del(b)}>
                          Delete
                        </button>
                      </div>
                      {isOpen && (
                        <div style={{ marginTop: '.5rem' }}>
                          <TickList
                            items={g}
                            onAdd={(text) => gifts(b.id, (l) => [...l, { id: uid(), text, done: false }])}
                            onToggle={(id, done) => gifts(b.id, (l) => l.map((x) => (x.id === id ? { ...x, done } : x)))}
                            onRemove={(id) => gifts(b.id, (l) => l.filter((x) => x.id !== id))}
                            placeholder="Gift idea…"
                            empty="No ideas yet. Whenever you spot something they would like, note it here."
                          />
                          <p className="hint">Tick = gift bought.</p>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </Win>
        </div>

        <div className="c4 stack-lg">
          <Win title="Add a date">
            <OccasionForm key={data.birthdays.length} initial={blank()} onSave={add} submitLabel="Add" />
          </Win>
          {data.birthdays.length > 0 && (
            <Win title="Whole year" defaultOpen={false}>
              <ul className="yearlist">
                {[...data.birthdays]
                  .sort((a, c) => a.date.slice(5).localeCompare(c.date.slice(5)))
                  .map((b) => (
                    <li key={b.id}>
                      <span>{format(parseISO(b.date), 'd MMM')}</span>
                      <b>
                        {occInfo(b.kind)[2]} {b.name}
                      </b>
                    </li>
                  ))}
              </ul>
            </Win>
          )}
        </div>
      </div>

      {edit && (
        <Modal title={`Edit ${edit.name}`} onClose={() => setEdit(null)}>
          <OccasionForm initial={edit} onSave={save} onCancel={() => setEdit(null)} submitLabel="Save" />
        </Modal>
      )}
    </>
  )
}