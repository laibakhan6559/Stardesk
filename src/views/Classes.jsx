import { useState } from 'react'
import { Empty, Field, Modal, PageTitle, Win } from '../components/ui'
import { fmtTime } from '../lib/dates'
import { uid, useStore } from '../lib/store'

const COLORS = ['#7f9bf0', '#ff6fb0', '#b58cf5', '#59c98d', '#f5b84b', '#3fc7e0', '#ff7a59']

export default function Classes() {
  const { data, set, setSetting } = useStore()
  const [form, setForm] = useState(null)
  const sem = data.settings.semester
  const ws = data.settings.weekStart
  const order = ws === 1 ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6]
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const list = data.classes.filter((c) => c.semester === sem)

  return (
    <>
      <PageTitle
        sub="Your courses overview and weekly timetable for each semester."
        right={
          <button className="btn" onClick={() => setForm({})}>
            + Add class
          </button>
        }
      >
        Classes & timetable
      </PageTitle>

      <div className="semtabs">
        {[1, 2].map((n) => (
          <button key={n} className={`sembar ${sem === n ? 'on' : ''}`} aria-pressed={sem === n} onClick={() => setSetting('semester', n)}>
            Semester {n}
          </button>
        ))}
      </div>

      <div className="grid12">
        <div className="c4">
          <Win title="Courses overview">
            {list.length === 0 && <Empty>No classes in Semester {sem} yet.</Empty>}
            <ul className="courses">
              {list.map((c) => (
                <li key={c.id} style={{ '--cat': c.color }}>
                  <button onClick={() => setForm(c)}>
                    <b>{c.name}</b>
                    <small>
                      {[c.teacher, c.room].filter(Boolean).join(' · ') || 'Tap to edit'}
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          </Win>
        </div>
        <div className="c8">
          <Win title={`Timetable · Semester ${sem}`}>
            <div className="tt">
              {order.map((d) => {
                const items = list.filter((c) => c.days.includes(d)).sort((a, b) => a.start.localeCompare(b.start))
                return (
                  <div key={d} className="ttcol">
                    <h3>{names[d]}</h3>
                    {items.length === 0 && <p className="muted tiny">–</p>}
                    {items.map((c) => (
                      <button key={c.id} className="ttitem" style={{ '--cat': c.color }} onClick={() => setForm(c)}>
                        <b>{c.name}</b>
                        <span>
                          {fmtTime(c.start)}–{fmtTime(c.end)}
                        </span>
                        {c.room && <span>{c.room}</span>}
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          </Win>
        </div>
      </div>

      {form && <ClassForm initial={form} semester={sem} onClose={() => setForm(null)} set={set} />}
    </>
  )
}

function ClassForm({ initial, semester, onClose, set }) {
  const [f, setF] = useState({
    name: '',
    teacher: '',
    room: '',
    color: COLORS[0],
    semester,
    days: [1],
    start: '09:00',
    end: '10:00',
    ...initial,
  })
  const edit = Boolean(initial.id)
  const up = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const toggleDay = (d) => setF((x) => ({ ...x, days: x.days.includes(d) ? x.days.filter((n) => n !== d) : [...x.days, d] }))

  const save = (e) => {
    e.preventDefault()
    if (!f.name.trim() || f.days.length === 0) return
    const c = { ...f, id: f.id || uid(), name: f.name.trim() }
    set('classes', (l) => (edit ? l.map((x) => (x.id === c.id ? c : x)) : [...l, c]))
    onClose()
  }
  const remove = () => {
    if (!window.confirm(`Delete ${f.name}?`)) return
    set('classes', (l) => l.filter((x) => x.id !== f.id))
    onClose()
  }

  return (
    <Modal title={edit ? 'Edit class' : 'New class'} onClose={onClose}>
      <form className="form" onSubmit={save}>
        <Field label="Course name">
          <input autoFocus required maxLength={60} value={f.name} onChange={up('name')} placeholder="e.g. Biology 101" />
        </Field>
        <div className="row">
          <Field label="Teacher" grow>
            <input maxLength={50} value={f.teacher} onChange={up('teacher')} />
          </Field>
          <Field label="Room" grow>
            <input maxLength={30} value={f.room} onChange={up('room')} />
          </Field>
        </div>
        <div className="row">
          <Field label="Starts" grow>
            <input type="time" required value={f.start} onChange={up('start')} />
          </Field>
          <Field label="Ends" grow>
            <input type="time" required value={f.end} onChange={up('end')} />
          </Field>
          <Field label="Semester" grow>
            <select value={f.semester} onChange={(e) => setF((x) => ({ ...x, semester: Number(e.target.value) }))}>
              <option value={1}>Semester 1</option>
              <option value={2}>Semester 2</option>
            </select>
          </Field>
        </div>
        <fieldset className="field">
          <legend>Days</legend>
          <div className="emojis">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => (
              <button type="button" key={d} className={f.days.includes(d) ? 'on' : ''} aria-pressed={f.days.includes(d)} onClick={() => toggleDay(d)}>
                {names[d]}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="field">
          <legend>Colour</legend>
          <div className="swatches">
            {COLORS.map((c) => (
              <button
                type="button"
                key={c}
                className={f.color === c ? 'on' : ''}
                style={{ background: c }}
                aria-label={`Colour ${c}`}
                aria-pressed={f.color === c}
                onClick={() => setF((x) => ({ ...x, color: c }))}
              />
            ))}
          </div>
        </fieldset>
        <div className="row end">
          {edit && (
            <button type="button" className="btn danger" onClick={remove}>
              Delete
            </button>
          )}
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn">
            Save
          </button>
        </div>
      </form>
    </Modal>
  )
}
