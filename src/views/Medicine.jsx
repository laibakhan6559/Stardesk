import { useState } from 'react'
import { DOW, MED_EMOJI, MED_FREQ, adherence, dosesOn, medDays, validTime } from '../lib/health'
import { Empty, Field, Modal, PageTitle, Win } from '../components/ui'
import { fmtTime, todayStr } from '../lib/dates'
import { uid, useStore } from '../lib/store'

const blank = () => ({ name: '', emoji: '💊', dose: '', freq: 'once', times: ['08:00'], dow: [0, 1, 2, 3, 4, 5, 6] })

function MedForm({ initial, onSave, onCancel, submitLabel }) {
  const [f, setF] = useState(initial)
  const pickFreq = (id) => {
    const preset = MED_FREQ.find((x) => x[0] === id)
    setF((x) => ({ ...x, freq: id, times: preset[2] ? [...preset[2]] : x.times }))
  }
  const setTime = (i, v) => setF((x) => ({ ...x, freq: 'custom', times: x.times.map((t, j) => (j === i ? v : t)) }))
  const toggleDay = (d) => setF((x) => ({ ...x, dow: x.dow.includes(d) ? x.dow.filter((v) => v !== d) : [...x.dow, d].sort() }))
  const submit = (e) => {
    e.preventDefault()
    const name = f.name.trim()
    const times = [...new Set(f.times.filter(validTime))].sort()
    if (!name || !times.length || !f.dow.length) return
    onSave({ name, emoji: f.emoji, dose: f.dose.trim(), times, dow: f.dow })
  }
  return (
    <form className="form" onSubmit={submit}>
      <Field label="Medicine name">
        <input required autoFocus maxLength={40} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Vitamin D" />
      </Field>
      <Field label="Dose (optional)">
        <input maxLength={40} value={f.dose} onChange={(e) => setF({ ...f, dose: e.target.value })} placeholder="e.g. 1 tablet, 5 ml, 2 drops" />
      </Field>
      <div className="chips presets" role="group" aria-label="Icon">
        {MED_EMOJI.map((e) => (
          <button key={e} type="button" className={`chip ${f.emoji === e ? 'on' : ''}`} aria-pressed={f.emoji === e} onClick={() => setF({ ...f, emoji: e })}>
            {e}
          </button>
        ))}
      </div>
      <Field label="How often">
        <select value={f.freq} onChange={(e) => pickFreq(e.target.value)}>
          {MED_FREQ.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <div className="stack">
        <span className="tiny muted">Dose times</span>
        {f.times.map((t, i) => (
          <div key={i} className="row">
            <input className="grow" type="time" required aria-label={`Dose time ${i + 1}`} value={t} onChange={(e) => setTime(i, e.target.value)} />
            <button type="button" className="x" aria-label="Remove time" disabled={f.times.length === 1} onClick={() => setF((x) => ({ ...x, freq: 'custom', times: x.times.filter((_, j) => j !== i) }))}>
              ×
            </button>
          </div>
        ))}
        {f.times.length < 6 && (
          <button type="button" className="btn small ghost" onClick={() => setF((x) => ({ ...x, freq: 'custom', times: [...x.times, '12:00'] }))}>
            + Add time
          </button>
        )}
      </div>
      <div className="stack">
        <span className="tiny muted">On these days</span>
        <div className="chips presets" role="group" aria-label="Days">
          {DOW.map((d, i) => (
            <button key={d} type="button" className={`chip ${f.dow.includes(i) ? 'on' : ''}`} aria-pressed={f.dow.includes(i)} onClick={() => toggleDay(i)}>
              {d}
            </button>
          ))}
        </div>
      </div>
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

export default function Medicine() {
  const { data, set } = useStore()
  const [edit, setEdit] = useState(null)
  const today = todayStr()
  const now = new Date()
  const doses = dosesOn(data.meds, now, now)
  const left = doses.filter((d) => !d.taken).length
  const adh = adherence(data.meds, 7, now)

  const add = (v) => set('meds', (l) => [...l, { ...v, id: uid(), paused: false, taken: {} }])
  const save = (v) => {
    set('meds', (l) => l.map((m) => (m.id === edit.id ? { ...m, ...v } : m)))
    setEdit(null)
  }
  const toggleTaken = (id, time) =>
    set('meds', (l) =>
      l.map((m) => {
        if (m.id !== id) return m
        const taken = { ...m.taken }
        const day = { ...(taken[today] || {}) }
        if (day[time]) delete day[time]
        else day[time] = 1
        if (Object.keys(day).length) taken[today] = day
        else delete taken[today]
        for (const k of Object.keys(taken).sort().slice(0, Math.max(0, Object.keys(taken).length - 45))) delete taken[k]
        return { ...m, taken }
      })
    )
  const togglePause = (id) => set('meds', (l) => l.map((m) => (m.id === id ? { ...m, paused: !m.paused } : m)))
  const del = (m) => window.confirm(`Delete “${m.name}”?`) && set('meds', (l) => l.filter((x) => x.id !== m.id))

  const pill = (s) =>
    s === 'taken' ? <em className="pill far">taken ✓</em> : s === 'missed' ? <em className="pill hot">missed</em> : s === 'due' ? <em className="pill soon">due now</em> : <em className="pill past">later</em>

  return (
    <>
      <PageTitle sub="Medicine times and doses. You get an alert on time while Stardesk is open.">Medicine reminder</PageTitle>
      <div className="grid12">
        <div className="c7 stack-lg">
          <Win title="Today's doses">
            {data.meds.length === 0 ? (
              <Empty>No medicines yet. Add one from the right ➜</Empty>
            ) : doses.length === 0 ? (
              <Empty>No doses scheduled today.</Empty>
            ) : (
              <>
                <p className="tiny muted">{left === 0 ? 'All doses taken today 🎉' : `${left} dose${left === 1 ? '' : 's'} still to go today.`}</p>
                <ul className="doselist">
                  {doses.map((r) => (
                    <li key={r.key} className={r.status}>
                      <span className="bl-ico" aria-hidden="true">
                        {r.m.emoji}
                      </span>
                      <span className="bl-txt">
                        <b>{r.m.name}</b>
                        <small>
                          {fmtTime(r.time)}
                          {r.m.dose ? ` · ${r.m.dose}` : ''}
                        </small>
                      </span>
                      {pill(r.status)}
                      <button className={`btn small ${r.taken ? 'ghost' : ''}`} onClick={() => toggleTaken(r.m.id, r.time)}>
                        {r.taken ? 'Undo' : 'Taken'}
                      </button>
                    </li>
                  ))}
                </ul>
                {adh.pct != null && (
                  <p className="tiny muted">
                    Last 7 days: {adh.taken} of {adh.planned} doses taken ({adh.pct}%).
                  </p>
                )}
              </>
            )}
          </Win>

          <Win title="My medicines">
            {data.meds.length === 0 ? (
              <Empty>The list is empty for now.</Empty>
            ) : (
              <ul className="billlist">
                {data.meds.map((m) => (
                  <li key={m.id} className={m.paused ? 'paused' : ''}>
                    <span className="bl-ico" aria-hidden="true">
                      {m.emoji}
                    </span>
                    <span className="bl-txt">
                      <b>{m.name}</b>
                      <small>
                        {m.times.map(fmtTime).join(', ')}
                        {m.dose ? ` · ${m.dose}` : ''} · {medDays(m).length === 7 ? 'every day' : medDays(m).map((d) => DOW[d]).join(' ')}
                      </small>
                    </span>
                    <div className="bl-act">
                      <button className="btn small ghost" aria-label={`Edit ${m.name}`} onClick={() => setEdit(m)}>
                        ✎
                      </button>
                      <button className="btn small ghost" aria-label={m.paused ? `Resume ${m.name}` : `Pause ${m.name}`} title={m.paused ? 'Resume' : 'Pause'} onClick={() => togglePause(m.id)}>
                        {m.paused ? '▶' : '⏸'}
                      </button>
                      <button className="x" aria-label={`Delete ${m.name}`} onClick={() => del(m)}>
                        ×
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Win>
        </div>

        <div className="c5 stack-lg">
          <Win title="Add medicine">
            <MedForm key={data.meds.length} initial={blank()} onSave={add} submitLabel="Add" />
          </Win>
          <p className="hint">Reminders fire at the dose time and once more after 30 minutes if you have not tapped “Taken”. Turn on browser notifications in Settings to get them outside this tab.</p>
        </div>
      </div>

      {edit && (
        <Modal title={`Edit ${edit.name}`} onClose={() => setEdit(null)}>
          <MedForm initial={{ ...edit, freq: 'custom' }} onSave={save} onCancel={() => setEdit(null)} submitLabel="Save" />
        </Modal>
      )}
    </>
  )
}