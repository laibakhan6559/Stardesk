import { useState } from 'react'
import { confettiFrom } from '../components/shared'
import { Field, Modal, PageTitle, Progress, Win } from '../components/ui'
import { todayStr } from '../lib/dates'
import { go } from '../lib/nav'
import { uid, useStore } from '../lib/store'
import { ROUTINE_STARTERS, routineProgress, routineStreak, stepDone } from '../lib/work'

const EMOJIS = ['🌅', '🌙', '☀️', '🏃', '🧘', '📚', '💼', '🧹', '🍳', '✨']

const draftFrom = (r) => ({ id: r?.id || null, name: r?.name || '', emoji: r?.emoji || '🌅', time: r?.time || '', steps: (r?.steps || []).map((s) => ({ ...s })) })

function RoutineEditor({ initial, habits, onSave, onCancel, onDelete }) {
  const [d, setD] = useState(initial)
  const [text, setText] = useState('')
  const [hab, setHab] = useState('')
  const move = (i, dir) =>
    setD((x) => {
      const steps = [...x.steps]
      const j = i + dir
      if (j < 0 || j >= steps.length) return x
      ;[steps[i], steps[j]] = [steps[j], steps[i]]
      return { ...x, steps }
    })
  const addStep = (e) => {
    e.preventDefault()
    const h = habits.find((x) => x.id === hab)
    const t = text.trim() || (h ? `${h.emoji} ${h.name}` : '')
    if (!t || d.steps.length >= 15) return
    setD((x) => ({ ...x, steps: [...x.steps, { id: uid(), text: t, habitId: h?.id || null }] }))
    setText('')
    setHab('')
  }
  const submit = (e) => {
    e.preventDefault()
    if (!d.name.trim() || !d.steps.length) return
    onSave({ ...d, name: d.name.trim() })
  }
  return (
    <form className="form" onSubmit={submit}>
      <div className="row wrap">
        <Field label="Routine name" grow>
          <input required autoFocus maxLength={40} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder="e.g. Morning routine" />
        </Field>
        <Field label="Reminder time (optional)">
          <input type="time" value={d.time} onChange={(e) => setD({ ...d, time: e.target.value })} />
        </Field>
      </div>
      <div className="emojis" role="radiogroup" aria-label="Pick an icon">
        {EMOJIS.map((e) => (
          <button type="button" key={e} role="radio" aria-checked={d.emoji === e} className={d.emoji === e ? 'on' : ''} onClick={() => setD({ ...d, emoji: e })}>
            {e}
          </button>
        ))}
      </div>

      <p className="tiny muted">Habit stacking: each step comes <b>after</b> the previous one. Write them in order.</p>
      {d.steps.length > 0 && (
        <ol className="stepedit">
          {d.steps.map((s, i) => (
            <li key={s.id}>
              <span className="se-txt">
                {s.text}
                {s.habitId && <em className="pill far">habit</em>}
              </span>
              <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                ▲
              </button>
              <button type="button" aria-label="Move down" disabled={i === d.steps.length - 1} onClick={() => move(i, 1)}>
                ▼
              </button>
              <button type="button" className="x" aria-label={`Remove ${s.text}`} onClick={() => setD((x) => ({ ...x, steps: x.steps.filter((y) => y.id !== s.id) }))}>
                ×
              </button>
            </li>
          ))}
        </ol>
      )}

      <div className="stepadd">
        <input value={text} maxLength={80} onChange={(e) => setText(e.target.value)} placeholder={d.steps.length ? 'Then I…' : 'First step…'} aria-label="New step" />
        {habits.length > 0 && (
          <select value={hab} onChange={(e) => setHab(e.target.value)} aria-label="Link to a habit">
            <option value="">No habit link</option>
            {habits.map((h) => (
              <option key={h.id} value={h.id}>
                Link: {h.emoji} {h.name}
              </option>
            ))}
          </select>
        )}
        <button type="button" className="btn small" onClick={addStep}>
          + Step
        </button>
      </div>

      <div className="row between">
        {onDelete ? (
          <button type="button" className="btn small ghost danger" onClick={onDelete}>
            Delete
          </button>
        ) : (
          <span />
        )}
        <div className="row">
          <button type="button" className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn" type="submit" disabled={!d.name.trim() || !d.steps.length}>
            Save
          </button>
        </div>
      </div>
    </form>
  )
}

export default function Routines() {
  const { data, set } = useStore()
  const [edit, setEdit] = useState(null) // draft or null
  const today = todayStr()
  const { routines, habits } = data

  // Ticking a step also logs / un-logs the habit it is linked to.
  const setStep = (r, step, on) => {
    set('routines', (l) =>
      l.map((x) => {
        if (x.id !== r.id) return x
        const cur = new Set(x.done?.[today] || [])
        if (on) cur.add(step.id)
        else cur.delete(step.id)
        const done = { ...x.done, [today]: [...cur] }
        for (const k of Object.keys(done).sort().slice(0, -120)) delete done[k]
        return { ...x, done }
      })
    )
    if (step.habitId)
      set('habits', (hs) =>
        hs.map((h) => {
          if (h.id !== step.habitId) return h
          const log = { ...h.log }
          if (on) log[today] = true
          else delete log[today]
          return { ...h, log }
        })
      )
  }
  const completeAll = (r, e) => {
    const todo = r.steps.filter((s) => !stepDone(r, s, today, habits))
    if (!todo.length) return
    set('routines', (l) => l.map((x) => (x.id === r.id ? { ...x, done: { ...x.done, [today]: r.steps.map((s) => s.id) } } : x)))
    const ids = new Set(todo.map((s) => s.habitId).filter(Boolean))
    if (ids.size) set('habits', (hs) => hs.map((h) => (ids.has(h.id) ? { ...h, log: { ...h.log, [today]: true } } : h)))
    confettiFrom(e, 'stars')
  }
  const resetToday = (r) => {
    set('routines', (l) => l.map((x) => (x.id === r.id ? { ...x, done: { ...x.done, [today]: [] } } : x)))
    const ids = new Set(r.steps.map((s) => s.habitId).filter(Boolean))
    if (ids.size)
      set('habits', (hs) =>
        hs.map((h) => {
          if (!ids.has(h.id)) return h
          const log = { ...h.log }
          delete log[today]
          return { ...h, log }
        })
      )
  }

  const save = (d) => {
    if (d.id) set('routines', (l) => l.map((r) => (r.id === d.id ? { ...r, name: d.name, emoji: d.emoji, time: d.time, steps: d.steps } : r)))
    else set('routines', (l) => [...l, { id: uid(), name: d.name, emoji: d.emoji, time: d.time, steps: d.steps, done: {} }].slice(0, 30))
    setEdit(null)
  }
  const remove = (id) => {
    if (!window.confirm('Delete this routine? Linked habits stay as they are.')) return
    set('routines', (l) => l.filter((r) => r.id !== id))
    setEdit(null)
  }
  const starter = (s) =>
    setEdit({ ...draftFrom(null), name: s.name, emoji: s.emoji, time: s.time, steps: s.steps.map((t) => ({ id: uid(), text: t, habitId: null })) })

  return (
    <>
      <PageTitle
        sub="Checklists for your morning and night routines. Complete a whole routine in one click."
        right={
          <button className="btn" onClick={() => setEdit(draftFrom(null))}>
            + New routine
          </button>
        }
      >
        Routines &amp; habit stacking
      </PageTitle>

      {routines.length === 0 ? (
        <Win title="Start with a template">
          <p className="muted">Habit stacking means linking one habit to another (“after tea, 5 minutes of stretching”). Start from a template:</p>
          <div className="patterns">
            {ROUTINE_STARTERS.map((s) => (
              <button key={s.name} type="button" onClick={() => starter(s)}>
                <span>
                  {s.emoji} {s.name}
                </span>
                <small>{s.steps.length} steps</small>
              </button>
            ))}
          </div>
        </Win>
      ) : (
        <div className="routgrid">
          {routines.map((r) => {
            const p = routineProgress(r, today, habits)
            const streak = routineStreak(r, habits)
            return (
              <Win key={r.id} title={`${r.emoji} ${r.name}`} actions={<button type="button" aria-label={`Edit ${r.name}`} title="Edit" onClick={() => setEdit(draftFrom(r))}>✎</button>}>
                <div className="rt-top">
                  <span className="tiny muted">
                    {r.time ? `⏰ ${r.time} · ` : ''}🔥 {streak} day{streak === 1 ? '' : 's'}
                  </span>
                  <b>
                    {p.done}/{p.total}
                  </b>
                </div>
                <Progress value={p.done} max={p.total} label={`${r.name} progress`} />
                <ol className="chain">
                  {r.steps.map((s) => {
                    const on = stepDone(r, s, today, habits)
                    return (
                      <li key={s.id} className={on ? 'done' : ''}>
                        <label>
                          <input type="checkbox" className="chk" checked={on} onChange={(e) => setStep(r, s, e.target.checked)} />
                          <span>{s.text}</span>
                        </label>
                        {s.habitId && habits.some((h) => h.id === s.habitId) && <em className="pill far">habit</em>}
                      </li>
                    )
                  })}
                </ol>
                <div className="row wrap">
                  <button className="btn" disabled={p.complete} onClick={(e) => completeAll(r, e)}>
                    {p.complete ? '✓ Complete!' : '⚡ Complete all'}
                  </button>
                  {p.done > 0 && (
                    <button className="btn small ghost" onClick={() => resetToday(r)}>
                      Reset today
                    </button>
                  )}
                </div>
              </Win>
            )
          })}
        </div>
      )}

      {routines.length > 0 && routines.length < 3 && (
        <p className="tiny muted" style={{ marginTop: '1rem' }}>
          The streak of linked habits also grows on the <a href="#habits" onClick={() => go('habits')}>Habits</a> page.
        </p>
      )}

      {edit && (
        <Modal title={edit.id ? `Edit ${edit.name || 'routine'}` : 'New routine'} onClose={() => setEdit(null)}>
          <RoutineEditor initial={edit} habits={habits} onSave={save} onCancel={() => setEdit(null)} onDelete={edit.id ? () => remove(edit.id) : null} />
        </Modal>
      )}
    </>
  )
}