import { useState } from 'react'
import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { Empty, Field, Modal, PageTitle, Progress, Win } from '../components/ui'
import { TickList } from '../components/shared'
import { BOOKING_PRESETS, money, tripDays } from '../lib/daily'
import { todayStr } from '../lib/dates'
import { uid, useStore } from '../lib/store'

const EMOJIS = ['✈️', '🚌', '🚆', '🏔️', '🏖️', '🕋', '🏕️', '🌆']
const blank = () => ({ name: '', emoji: '✈️', place: '', start: todayStr(), end: todayStr(), budget: '' })

function TripForm({ initial, onSave, onCancel, submitLabel }) {
  const { data } = useStore()
  const cur = data.settings.currency || 'Rs'
  const [f, setF] = useState(initial)
  const up = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const submit = (e) => {
    e.preventDefault()
    const name = f.name.trim()
    if (!name || !f.start) return
    const end = f.end && f.end >= f.start ? f.end : f.start
    onSave({ ...f, name, place: f.place.trim(), end, budget: Math.max(0, Math.round(Number(f.budget) || 0)) })
  }
  return (
    <form className="form" onSubmit={submit}>
      <Field label="Trip name">
        <input required autoFocus maxLength={40} value={f.name} onChange={up('name')} placeholder="e.g. Hunza trip" />
      </Field>
      <Field label="Where to?">
        <input maxLength={40} value={f.place} onChange={up('place')} placeholder="e.g. Karimabad, Hunza" />
      </Field>
      <div className="emojis" role="radiogroup" aria-label="Icon">
        {EMOJIS.map((e) => (
          <button type="button" key={e} role="radio" aria-checked={f.emoji === e} className={f.emoji === e ? 'on' : ''} onClick={() => setF({ ...f, emoji: e })}>
            {e}
          </button>
        ))}
      </div>
      <div className="row">
        <Field label="From" grow>
          <input type="date" required value={f.start} onChange={up('start')} />
        </Field>
        <Field label="To" grow>
          <input type="date" required min={f.start} value={f.end} onChange={up('end')} />
        </Field>
      </div>
      <Field label={`Budget (${cur})`}>
        <input type="number" min="0" inputMode="numeric" value={f.budget} onChange={up('budget')} placeholder="Optional" />
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

const TABS = [
  ['plan', 'Itinerary'],
  ['book', 'Bookings'],
  ['money', 'Budget'],
]

export default function Travel() {
  const { data, set } = useStore()
  const cur = data.settings.currency || 'Rs'
  const m = (n) => money(n, cur)
  const trips = [...data.trips].sort((a, b) => a.start.localeCompare(b.start))
  const [sel, setSel] = useState(null)
  const [tab, setTab] = useState('plan')
  const [edit, setEdit] = useState(false)
  const [adding, setAdding] = useState(false)
  const [it, setIt] = useState({ day: '', time: '', text: '' })
  const [ex, setEx] = useState({ text: '', amount: '' })
  const trip = trips.find((t) => t.id === sel) || trips.find((t) => t.end >= todayStr()) || trips[trips.length - 1] || null

  const patch = (fn) => set('trips', (l) => l.map((t) => (t.id === trip.id ? fn(t) : t)))
  const addTrip = (v) => {
    const t = { ...v, id: uid(), itinerary: [], bookings: [], expenses: [] }
    set('trips', (l) => [...l, t])
    setSel(t.id)
    setAdding(false)
  }
  const saveTrip = (v) => {
    patch((t) => ({ ...t, ...v }))
    setEdit(false)
  }
  const delTrip = () => {
    if (!window.confirm(`Delete “${trip.name}” and everything in it?`)) return
    set('trips', (l) => l.filter((t) => t.id !== trip.id))
    setSel(null)
  }

  const days = trip ? tripDays(trip) : []
  const day = it.day && days.includes(it.day) ? it.day : days[0] || ''
  const addItin = (e) => {
    e.preventDefault()
    const text = it.text.trim()
    if (!text) return
    patch((t) => ({ ...t, itinerary: [...t.itinerary, { id: uid(), day, time: it.time, text }] }))
    setIt({ day, time: '', text: '' })
  }
  const addExpense = (e) => {
    e.preventDefault()
    const text = ex.text.trim()
    const amount = Math.round(Number(ex.amount))
    if (!text || !(amount > 0)) return
    patch((t) => ({ ...t, expenses: [...t.expenses, { id: uid(), text, amount }] }))
    setEx({ text: '', amount: '' })
  }

  const until = trip ? differenceInCalendarDays(parseISO(trip.start), new Date()) : 0
  const during = trip && trip.start <= todayStr() && trip.end >= todayStr()
  const spent = trip ? trip.expenses.reduce((a, x) => a + x.amount, 0) : 0
  const bDone = trip ? trip.bookings.filter((b) => b.done).length : 0

  return (
    <>
      <PageTitle sub="Trip dates, itinerary, budget and a bookings checklist in one place.">Travel planner</PageTitle>
      <div className="grid12">
        <div className="c4 stack-lg">
          <Win title="My trips">
            {trips.length === 0 ? (
              <Empty>No trips yet.</Empty>
            ) : (
              <ul className="listpick">
                {trips.map((t) => {
                  const past = t.end < todayStr()
                  return (
                    <li key={t.id}>
                      <button className={trip?.id === t.id ? 'on' : ''} onClick={() => setSel(t.id)} style={past ? { opacity: 0.6 } : undefined}>
                        <span>
                          {t.emoji} {t.name}
                        </span>
                        <small>{format(parseISO(t.start), 'd MMM')}</small>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            <button className="btn small" style={{ marginTop: '.7rem' }} onClick={() => setAdding(true)}>
              + New trip
            </button>
          </Win>
        </div>

        <div className="c8 stack-lg">
          {!trip ? (
            <Win title="Travel">
              <Empty>Tap “New trip” and plan your first journey ✈️</Empty>
            </Win>
          ) : (
            <>
              <Win title={`${trip.emoji} ${trip.name}`}>
                <div className="trip-head">
                  <div>
                    <p className="big" style={{ marginBottom: '.2rem' }}>
                      {during ? 'Trip in progress 🎒' : until > 0 ? `${until} days left` : until === 0 ? 'Today!' : 'Trip finished'}
                    </p>
                    <p className="muted">
                      {trip.place && <>📍 {trip.place} · </>}
                      {format(parseISO(trip.start), 'd MMM')} – {format(parseISO(trip.end), 'd MMM yyyy')} · {days.length} day{days.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="row wrap">
                    <button className="btn small ghost" onClick={() => setEdit(true)}>
                      ✎ Edit
                    </button>
                    <button className="btn small ghost" onClick={delTrip}>
                      Delete
                    </button>
                  </div>
                </div>
                <div className="seg small" role="tablist" style={{ marginTop: '.8rem' }}>
                  {TABS.map(([id, label]) => (
                    <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
                      {label}
                    </button>
                  ))}
                </div>

                {tab === 'plan' && (
                  <>
                    <form className="row wrap" onSubmit={addItin}>
                      <select value={day} onChange={(e) => setIt({ ...it, day: e.target.value })} aria-label="Day">
                        {days.map((d, i) => (
                          <option key={d} value={d}>
                            Day {i + 1} · {format(parseISO(d), 'EEE d MMM')}
                          </option>
                        ))}
                      </select>
                      <input type="time" value={it.time} onChange={(e) => setIt({ ...it, time: e.target.value })} aria-label="Time" />
                      <input className="grow" maxLength={90} value={it.text} onChange={(e) => setIt({ ...it, text: e.target.value })} placeholder="e.g. Baltit Fort visit" aria-label="Plan" />
                      <button className="btn small" type="submit">
                        Add
                      </button>
                    </form>
                    <div className="itin">
                      {days.map((d, i) => {
                        const list = trip.itinerary.filter((x) => x.day === d).sort((a, b) => (a.time || '99').localeCompare(b.time || '99'))
                        return (
                          <section key={d}>
                            <h3>
                              Day {i + 1} <small>{format(parseISO(d), 'EEE, d MMM')}</small>
                            </h3>
                            {list.length === 0 ? (
                              <p className="hint">Nothing planned.</p>
                            ) : (
                              <ul>
                                {list.map((x) => (
                                  <li key={x.id}>
                                    <time>{x.time || '—'}</time>
                                    <span>{x.text}</span>
                                    <button className="x" aria-label={`Remove ${x.text}`} onClick={() => patch((t) => ({ ...t, itinerary: t.itinerary.filter((y) => y.id !== x.id) }))}>
                                      ×
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </section>
                        )
                      })}
                      {/* items whose day is no longer inside the trip dates */}
                      {trip.itinerary.some((x) => !days.includes(x.day)) && (
                        <section>
                          <h3>Other days</h3>
                          <ul>
                            {trip.itinerary
                              .filter((x) => !days.includes(x.day))
                              .map((x) => (
                                <li key={x.id}>
                                  <time>{x.day ? format(parseISO(x.day), 'd MMM') : '—'}</time>
                                  <span>{x.text}</span>
                                  <button className="x" aria-label={`Remove ${x.text}`} onClick={() => patch((t) => ({ ...t, itinerary: t.itinerary.filter((y) => y.id !== x.id) }))}>
                                    ×
                                  </button>
                                </li>
                              ))}
                          </ul>
                        </section>
                      )}
                    </div>
                  </>
                )}

                {tab === 'book' && (
                  <>
                    <TickList
                      items={trip.bookings}
                      onAdd={(text) => patch((t) => ({ ...t, bookings: [...t.bookings, { id: uid(), text, done: false }] }))}
                      onToggle={(id, done) => patch((t) => ({ ...t, bookings: t.bookings.map((b) => (b.id === id ? { ...b, done } : b)) }))}
                      onRemove={(id) => patch((t) => ({ ...t, bookings: t.bookings.filter((b) => b.id !== id) }))}
                      placeholder="e.g. Hotel booking"
                      empty="The bookings checklist is empty."
                    />
                    <div className="chips presets" style={{ marginTop: '.6rem' }}>
                      {BOOKING_PRESETS.filter((p) => !trip.bookings.some((b) => b.text === p)).map((p) => (
                        <button key={p} className="chip" onClick={() => patch((t) => ({ ...t, bookings: [...t.bookings, { id: uid(), text: p, done: false }] }))}>
                          + {p}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {tab === 'money' && (
                  <>
                    <div className="stats3">
                      <div>
                        <small>Budget</small>
                        <b>{trip.budget ? m(trip.budget) : '—'}</b>
                      </div>
                      <div>
                        <small>Spent / planned</small>
                        <b className="neg">{m(spent)}</b>
                      </div>
                      <div>
                        <small>Left</small>
                        <b className={trip.budget && spent > trip.budget ? 'neg' : 'pos'}>{trip.budget ? m(trip.budget - spent) : '—'}</b>
                      </div>
                    </div>
                    {trip.budget > 0 && <Progress value={Math.min(spent, trip.budget)} max={trip.budget} label="Trip budget used" />}
                    {trip.budget > 0 && spent > trip.budget && (
                      <p className="banner bad" role="alert">
                        ⚠️ Over the trip budget by {m(spent - trip.budget)}.
                      </p>
                    )}
                    <form className="row wrap" onSubmit={addExpense} style={{ marginTop: '.7rem' }}>
                      <input className="grow" maxLength={60} value={ex.text} onChange={(e) => setEx({ ...ex, text: e.target.value })} placeholder="e.g. Hotel (3 nights)" aria-label="Expense" />
                      <input type="number" min="1" inputMode="numeric" value={ex.amount} onChange={(e) => setEx({ ...ex, amount: e.target.value })} placeholder={cur} aria-label="Amount" style={{ maxWidth: 130 }} />
                      <button className="btn small" type="submit">
                        Add
                      </button>
                    </form>
                    {trip.expenses.length > 0 && (
                      <ul className="txlist" style={{ marginTop: '.6rem' }}>
                        {trip.expenses.map((x) => (
                          <li key={x.id}>
                            <span className="tx-txt">
                              <b>{x.text}</b>
                            </span>
                            <b>{m(x.amount)}</b>
                            <button className="x" aria-label={`Remove ${x.text}`} onClick={() => patch((t) => ({ ...t, expenses: t.expenses.filter((y) => y.id !== x.id) }))}>
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </Win>
              <p className="hint">
                Bookings {bDone}/{trip.bookings.length} done. The trip start also shows in Countdowns.
              </p>
            </>
          )}
        </div>
      </div>

      {adding && (
        <Modal title="New trip" onClose={() => setAdding(false)}>
          <TripForm initial={blank()} onSave={addTrip} onCancel={() => setAdding(false)} submitLabel="Create trip" />
        </Modal>
      )}
      {edit && trip && (
        <Modal title={`Edit ${trip.name}`} onClose={() => setEdit(false)}>
          <TripForm initial={{ ...trip, budget: trip.budget ? String(trip.budget) : '' }} onSave={saveTrip} onCancel={() => setEdit(false)} submitLabel="Save" />
        </Modal>
      )}
    </>
  )
}