import { useMemo, useState } from 'react'
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { Empty, PageTitle, Win } from '../components/ui'
import EventRow from '../components/EventRow'
import EventForm from '../components/EventForm'
import { CATS, dayItems, fmtTime, todayStr, ymd } from '../lib/dates'
import { useStore } from '../lib/store'

export default function Planner() {
  const { data, set, ui, setUi } = useStore()
  const [form, setForm] = useState(null)
  const view = ui.plannerView
  const date = parseISO(ui.plannerDate)
  const ws = data.settings.weekStart
  const today = todayStr()

  const shift = (n) => {
    const next = view === 'month' ? addMonths(date, n) : view === 'week' ? addDays(date, 7 * n) : addDays(date, n)
    setUi({ plannerDate: ymd(next) })
  }
  const openDay = (ds) => setUi({ plannerDate: ds, plannerView: 'day' })

  const title =
    view === 'month'
      ? format(date, 'MMMM yyyy')
      : view === 'week'
        ? `${format(startOfWeek(date, { weekStartsOn: ws }), 'd MMM')} – ${format(endOfWeek(date, { weekStartsOn: ws }), 'd MMM yyyy')}`
        : format(date, 'EEEE, d MMMM yyyy')

  return (
    <>
      <PageTitle
        sub="Plan by day, week or month. Tap an item to edit it, tick it when it is done."
        right={
          <button className="btn" onClick={() => setForm({ date: ui.plannerDate })}>
            + Add event
          </button>
        }
      >
        Planner
      </PageTitle>

      <div className="toolbar">
        <div className="seg" role="tablist" aria-label="Planner view">
          {['day', 'week', 'month'].map((v) => (
            <button key={v} role="tab" aria-selected={view === v} className={view === v ? 'on' : ''} onClick={() => setUi({ plannerView: v })}>
              {v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        <div className="navbtns">
          <button className="btn small ghost" onClick={() => shift(-1)} aria-label="Previous">
            ◀
          </button>
          <button className="btn small ghost" onClick={() => setUi({ plannerDate: today })}>
            Today
          </button>
          <button className="btn small ghost" onClick={() => shift(1)} aria-label="Next">
            ▶
          </button>
          <input
            type="date"
            className="datepick"
            value={ui.plannerDate}
            onChange={(e) => e.target.value && setUi({ plannerDate: e.target.value })}
            aria-label="Jump to date"
          />
        </div>
      </div>

      <h2 className="range-title">{title}</h2>

      {view === 'day' && <DayView ds={ui.plannerDate} onEdit={setForm} onAdd={() => setForm({ date: ui.plannerDate })} />}
      {view === 'week' && <WeekView date={date} ws={ws} onOpen={openDay} onEdit={setForm} />}
      {view === 'month' && <MonthView date={date} ws={ws} onOpen={openDay} />}

      {form && <EventForm initial={form} onClose={() => setForm(null)} />}
    </>
  )
}

function DayView({ ds, onEdit, onAdd }) {
  const { data, set } = useStore()
  const { events, classes, keys, tasks } = dayItems(data, ds)
  const toggleTask = (id) => set('tasks', (l) => l.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  const empty = !events.length && !classes.length && !keys.length && !tasks.length
  return (
    <div className="grid12">
      <div className="c8">
        <Win title={`Schedule · ${format(parseISO(ds), 'EEE d MMM')}`}>
          {events.length === 0 && <Empty>Nothing planned yet. A calm day, or time to add something?</Empty>}
          <div className="stack">
            {events.map((ev) => (
              <EventRow key={ev.id} ev={ev} ds={ds} onEdit={onEdit} />
            ))}
          </div>
          <button className="btn small" style={{ marginTop: '.8rem' }} onClick={onAdd}>
            + Add to this day
          </button>
        </Win>
      </div>
      <div className="c4 stack-lg">
        {keys.length > 0 && (
          <Win title="Important!!!">
            {keys.map((k) => (
              <p key={k.id} className="keyline">
                ⭐ {k.title}
              </p>
            ))}
          </Win>
        )}
        <Win title="Classes">
          {classes.length === 0 ? (
            <Empty>No classes this day (Semester {data.settings.semester}).</Empty>
          ) : (
            classes.map((c) => (
              <p key={c.id} className="classline" style={{ '--cat': c.color }}>
                <b>{c.name}</b>
                <span>
                  {fmtTime(c.start)} – {fmtTime(c.end)}
                  {c.room ? ` · ${c.room}` : ''}
                </span>
              </p>
            ))
          )}
        </Win>
        <Win title="Tasks due">
          {tasks.length === 0 ? (
            <Empty>No tasks due.</Empty>
          ) : (
            tasks.map((t) => (
              <label key={t.id} className={`taskline ${t.done ? 'done' : ''}`}>
                <input type="checkbox" className="chk" checked={t.done} onChange={() => toggleTask(t.id)} />
                <span>{t.title}</span>
              </label>
            ))
          )}
        </Win>
        {empty && <p className="hint center">Tip: press “+ Add event” and pick a reminder 🔔</p>}
      </div>
    </div>
  )
}

function WeekView({ date, ws, onOpen, onEdit }) {
  const { data } = useStore()
  const days = eachDayOfInterval({ start: startOfWeek(date, { weekStartsOn: ws }), end: endOfWeek(date, { weekStartsOn: ws }) })
  const today = todayStr()
  return (
    <div className="week">
      {days.map((d) => {
        const ds = ymd(d)
        const it = dayItems(data, ds)
        return (
          <section key={ds} className={`win daycol ${ds === today ? 'is-today' : ''}`}>
            <header className="win-bar">
              <h2>{format(d, 'EEE d')}</h2>
              <div className="win-btns">
                <button type="button" aria-label={`Open ${format(d, 'EEEE d MMMM')}`} onClick={() => onOpen(ds)}>
                  ▢
                </button>
              </div>
            </header>
            <div className="win-body">
              {it.keys.map((k) => (
                <p key={k.id} className="keyline small">
                  ⭐ {k.title}
                </p>
              ))}
              {it.classes.map((c) => (
                <p key={c.id} className="classline small" style={{ '--cat': c.color }}>
                  <b>{c.name}</b>
                  <span>{fmtTime(c.start)}</span>
                </p>
              ))}
              {it.events.map((ev) => (
                <EventRow key={ev.id} ev={ev} ds={ds} onEdit={onEdit} compact />
              ))}
              {!it.keys.length && !it.classes.length && !it.events.length && <p className="muted tiny">Free ✨</p>}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function MonthView({ date, ws, onOpen }) {
  const { data } = useStore()
  const today = todayStr()
  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(date), { weekStartsOn: ws }),
        end: endOfWeek(endOfMonth(date), { weekStartsOn: ws }),
      }),
    [date, ws]
  )
  return (
    <div className="win month">
      <div className="dow">
        {days.slice(0, 7).map((d) => (
          <span key={ymd(d)}>{format(d, 'EEE')}</span>
        ))}
      </div>
      <div className="mgrid">
        {days.map((d) => {
          const ds = ymd(d)
          const it = dayItems(data, ds)
          const dots = [...it.keys.map(() => '#ffd95e'), ...it.events.map((e) => (CATS[e.cat] || CATS.personal).color)]
          return (
            <button
              key={ds}
              type="button"
              className={`mcell ${isSameMonth(d, date) ? '' : 'off'} ${ds === today ? 'today' : ''} ${ds === ymd(date) ? 'sel' : ''}`}
              onClick={() => onOpen(ds)}
              aria-label={`${format(d, 'EEEE d MMMM')}, ${it.events.length} events`}
            >
              <b>{format(d, 'd')}</b>
              <span className="dots">
                {dots.slice(0, 6).map((c, i) => (
                  <i key={i} style={{ background: c }} />
                ))}
              </span>
              {it.events[0] && <em className="mtitle">{it.events[0].title}</em>}
              {it.events.length > 1 && <em className="mmore">+{it.events.length - 1} more</em>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
