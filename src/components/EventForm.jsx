import { useState } from 'react'
import { Field, Modal } from './ui'
import { CATS, REMINDERS, REPEATS, todayStr } from '../lib/dates'
import { uid, useStore } from '../lib/store'
import { askNotifyPermission } from '../lib/sound'

export default function EventForm({ initial, onClose }) {
  const { data, set, setSetting, toast } = useStore()
  const [f, setF] = useState(() => ({
    title: '',
    date: todayStr(),
    time: '',
    cat: 'study',
    remind: 10,
    repeat: 'none',
    notes: '',
    ...initial,
  }))
  const edit = Boolean(initial?.id)
  const up = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))

  const save = async (e) => {
    e.preventDefault()
    if (!f.title.trim()) return
    const ev = {
      ...f,
      id: f.id || uid(),
      title: f.title.trim(),
      remind: Number(f.remind),
      doneOn: f.doneOn || {},
    }
    set('events', (list) => (edit ? list.map((x) => (x.id === ev.id ? ev : x)) : [...list, ev]))
    if (ev.remind >= 0 && !data.settings.notif && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      const p = await askNotifyPermission()
      if (p === 'granted') {
        setSetting('notif', true)
        toast('Browser notifications are on 🔔', 'ok')
      }
    }
    onClose()
  }

  const remove = () => {
    if (!window.confirm('Delete this event' + (f.repeat !== 'none' ? ' and all its repeats?' : '?'))) return
    set('events', (list) => list.filter((x) => x.id !== f.id))
    onClose()
  }

  return (
    <Modal title={edit ? 'Edit event' : 'New event'} onClose={onClose}>
      <form className="form" onSubmit={save}>
        <Field label="What are you planning?">
          <input autoFocus required maxLength={90} value={f.title} onChange={up('title')} placeholder="e.g. Chemistry revision" />
        </Field>
        <div className="row">
          <Field label="Date" grow>
            <input type="date" required value={f.date} onChange={up('date')} />
          </Field>
          <Field label="Time (optional)" grow>
            <input type="time" value={f.time} onChange={up('time')} />
          </Field>
        </div>
        <div className="row">
          <Field label="Category" grow>
            <select value={f.cat} onChange={up('cat')}>
              {Object.entries(CATS).map(([id, c]) => (
                <option key={id} value={id}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Repeat" grow>
            <select value={f.repeat} onChange={up('repeat')}>
              {REPEATS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Reminder">
          <select value={f.remind} onChange={up('remind')}>
            {REMINDERS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        {!f.time && Number(f.remind) >= 0 && <p className="hint">No time set – the reminder rings around 9:00 AM.</p>}
        <Field label="Notes">
          <textarea rows={3} maxLength={500} value={f.notes} onChange={up('notes')} placeholder="Anything to remember…" />
        </Field>
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
            {edit ? 'Save' : 'Add event'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
