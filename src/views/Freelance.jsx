import { useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { confettiFrom } from '../components/shared'
import { Empty, Field, Modal, PageTitle, Progress, Win } from '../components/ui'
import { countdown, todayStr, ymd } from '../lib/dates'
import { money } from '../lib/daily'
import { uid, useStore } from '../lib/store'
import { useNow } from '../lib/useNow'
import { INVOICE_STATUS, PAY_LABEL, fmtHm, freelanceTotals, hms, invoiceState, nextInvoiceNumber, projectStats, timerSeconds, unbilledMin } from '../lib/work'

const blankProject = () => ({ client: '', name: '', rate: '', deadline: '', note: '' })

function ProjectForm({ initial, cur, onSave, onCancel, submitLabel }) {
  const [f, setF] = useState(initial)
  const up = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const submit = (e) => {
    e.preventDefault()
    const name = f.name.trim()
    const client = f.client.trim()
    if (!name || !client) return
    onSave({ ...f, name, client, rate: Math.max(0, Math.round(Number(f.rate) || 0)), note: f.note.trim() })
  }
  return (
    <form className="form" onSubmit={submit}>
      <Field label="Client">
        <input required autoFocus maxLength={50} value={f.client} onChange={up('client')} placeholder="e.g. Ali Traders" />
      </Field>
      <Field label="Project">
        <input required maxLength={60} value={f.name} onChange={up('name')} placeholder="e.g. Website redesign" />
      </Field>
      <div className="row wrap">
        <Field label={`Hourly rate (${cur})`} grow>
          <input type="number" min="0" inputMode="numeric" value={f.rate} onChange={up('rate')} placeholder="0" />
        </Field>
        <Field label="Deadline" grow>
          <input type="date" value={f.deadline} onChange={up('deadline')} />
        </Field>
      </div>
      <Field label="Notes">
        <textarea rows={2} maxLength={400} value={f.note} onChange={up('note')} />
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

function TimerWin({ fl, set, projects }) {
  const now = useNow(1000)
  const [pid, setPid] = useState('')
  const [note, setNote] = useState('')
  const running = fl.timer
  const run = running ? projects.find((p) => p.id === running.projectId) : null
  const pick = pid && projects.some((p) => p.id === pid) ? pid : projects[0]?.id || ''

  const start = () => {
    if (!pick) return
    set('freelance', (f) => ({ ...f, timer: { projectId: pick, start: Date.now() } }))
  }
  const stop = () => {
    if (!running) return
    const min = Math.max(1, Math.round(timerSeconds(running) / 60))
    set('freelance', (f) => ({
      ...f,
      timer: null,
      time: [...f.time, { id: uid(), projectId: running.projectId, date: todayStr(), min, note: note.trim(), billed: null }].slice(-2000),
    }))
    setNote('')
  }
  const discard = () => window.confirm('Discard this timer without saving the time?') && set('freelance', (f) => ({ ...f, timer: null }))

  return (
    <Win title="Time tracker">
      {projects.length === 0 ? (
        <Empty>Add a project first, then start the timer.</Empty>
      ) : running ? (
        <div className="timerbox running">
          <p className="timer-big" aria-live="off">
            {hms(timerSeconds(running, now.getTime()))}
          </p>
          <p className="tiny muted center-text">
            {run ? `${run.client} · ${run.name}` : 'Project deleted'} · started {format(new Date(running.start), 'h:mm a')}
          </p>
          <input value={note} maxLength={80} placeholder="What did you work on? (optional)" aria-label="Time note" onChange={(e) => setNote(e.target.value)} />
          <div className="row wrap center">
            <button className="btn" onClick={stop}>
              ■ Stop &amp; save
            </button>
            <button className="btn ghost" onClick={discard}>
              Discard
            </button>
          </div>
        </div>
      ) : (
        <div className="timerbox">
          <p className="timer-big idle">00:00:00</p>
          <select value={pick} onChange={(e) => setPid(e.target.value)} aria-label="Project to track">
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.client} · {p.name}
              </option>
            ))}
          </select>
          <button className="btn" onClick={start}>
            ▶ Start timer
          </button>
        </div>
      )}
    </Win>
  )
}

function ManualTime({ projects, set }) {
  const [pid, setPid] = useState('')
  const [date, setDate] = useState(todayStr())
  const [h, setH] = useState('')
  const [m, setM] = useState('')
  const [note, setNote] = useState('')
  const pick = pid && projects.some((p) => p.id === pid) ? pid : projects[0]?.id || ''
  const submit = (e) => {
    e.preventDefault()
    const min = Math.round((Number(h) || 0) * 60 + (Number(m) || 0))
    if (!pick || !(min > 0) || min > 24 * 60) return
    set('freelance', (f) => ({ ...f, time: [...f.time, { id: uid(), projectId: pick, date, min, note: note.trim(), billed: null }].slice(-2000) }))
    setH('')
    setM('')
    setNote('')
  }
  if (!projects.length) return null
  return (
    <Win title="Add time by hand" defaultOpen={false}>
      <form className="form" onSubmit={submit}>
        <select value={pick} onChange={(e) => setPid(e.target.value)} aria-label="Project">
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.client} · {p.name}
            </option>
          ))}
        </select>
        <div className="row wrap">
          <Field label="Date" grow>
            <input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Hours" grow>
            <input type="number" min="0" max="24" inputMode="numeric" value={h} onChange={(e) => setH(e.target.value)} placeholder="0" />
          </Field>
          <Field label="Minutes" grow>
            <input type="number" min="0" max="59" inputMode="numeric" value={m} onChange={(e) => setM(e.target.value)} placeholder="0" />
          </Field>
        </div>
        <input maxLength={80} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" aria-label="Note" />
        <button className="btn" type="submit">
          Add time
        </button>
      </form>
    </Win>
  )
}

export default function Freelance() {
  const { data, set, toast } = useStore()
  const fl = data.freelance
  const cur = data.settings.currency || 'Rs'
  const m = (n) => money(n, cur)
  const today = new Date()
  const [pform, setPform] = useState(blankProject())
  const [pkey, setPkey] = useState(0)
  const [editP, setEditP] = useState(null)
  const [showDone, setShowDone] = useState(false)
  const [inv, setInv] = useState({ projectId: '', title: '', amount: '', due: ymd(addDays(today, 14)) })

  const active = fl.projects.filter((p) => p.status !== 'done')
  const shown = fl.projects.filter((p) => (showDone ? true : p.status !== 'done'))
  const totals = freelanceTotals(fl, today)
  const projName = (id) => {
    const p = fl.projects.find((x) => x.id === id)
    return p ? `${p.client} · ${p.name}` : 'Deleted project'
  }

  const addProject = (v) => {
    set('freelance', (f) => ({ ...f, projects: [{ ...v, id: uid(), status: 'active' }, ...f.projects] }))
    setPform(blankProject())
    setPkey((k) => k + 1)
  }
  const saveProject = (v) => {
    set('freelance', (f) => ({ ...f, projects: f.projects.map((p) => (p.id === editP.id ? { ...p, ...v } : p)) }))
    setEditP(null)
  }
  const toggleDone = (p, e) => {
    set('freelance', (f) => ({ ...f, projects: f.projects.map((x) => (x.id === p.id ? { ...x, status: x.status === 'done' ? 'active' : 'done' } : x)) }))
    if (p.status !== 'done') confettiFrom(e, 'stars')
  }
  const delProject = (p) => {
    if (!window.confirm(`Delete “${p.name}” with its time entries and invoices?`)) return
    set('freelance', (f) => ({
      ...f,
      projects: f.projects.filter((x) => x.id !== p.id),
      invoices: f.invoices.filter((i) => i.projectId !== p.id),
      time: f.time.filter((t) => t.projectId !== p.id),
      timer: f.timer?.projectId === p.id ? null : f.timer,
    }))
  }

  // Turns all not-yet-billed time of a project into a draft invoice (hours x rate).
  const invoiceFromTime = (p) => {
    const min = unbilledMin(p.id, fl.time)
    if (!min) return
    const id = uid()
    const amount = Math.round((min / 60) * (p.rate || 0))
    set('freelance', (f) => ({
      ...f,
      invoices: [
        { id, projectId: p.id, number: nextInvoiceNumber(f.invoices), title: `${p.name} – ${fmtHm(min)}`, amount, issued: todayStr(), due: ymd(addDays(new Date(), 14)), status: 'draft', paidOn: null },
        ...f.invoices,
      ],
      time: f.time.map((t) => (t.projectId === p.id && !t.billed ? { ...t, billed: id } : t)),
    }))
    toast(`Draft invoice bana di: ${fmtHm(min)} = ${m(amount)}`, 'info')
  }

  const addInvoice = (e) => {
    e.preventDefault()
    const projectId = inv.projectId && fl.projects.some((p) => p.id === inv.projectId) ? inv.projectId : fl.projects[0]?.id
    const amount = Math.round(Number(inv.amount))
    if (!projectId || !(amount > 0)) return
    const p = fl.projects.find((x) => x.id === projectId)
    set('freelance', (f) => ({
      ...f,
      invoices: [{ id: uid(), projectId, number: nextInvoiceNumber(f.invoices), title: inv.title.trim() || p.name, amount, issued: todayStr(), due: inv.due, status: 'draft', paidOn: null }, ...f.invoices],
    }))
    setInv({ ...inv, title: '', amount: '' })
  }
  const setInvStatus = (i, status, e) => {
    set('freelance', (f) => ({ ...f, invoices: f.invoices.map((x) => (x.id === i.id ? { ...x, status, paidOn: status === 'paid' ? todayStr() : null } : x)) }))
    if (status === 'paid' && i.status !== 'paid') confettiFrom(e, 'confetti')
  }
  const delInvoice = (i) => {
    if (!window.confirm(`Delete invoice ${i.number}?`)) return
    set('freelance', (f) => ({
      ...f,
      invoices: f.invoices.filter((x) => x.id !== i.id),
      time: f.time.map((t) => (t.billed === i.id ? { ...t, billed: null } : t)),
    }))
  }
  const delTime = (t) => set('freelance', (f) => ({ ...f, time: f.time.filter((x) => x.id !== t.id) }))

  const invoices = [...fl.invoices].sort((a, b) => {
    const order = { overdue: 0, sent: 1, draft: 2, paid: 3 }
    return order[invoiceState(a, today).key] - order[invoiceState(b, today).key] || (a.due || '').localeCompare(b.due || '')
  })
  const recent = [...fl.time].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12)

  const payPill = (s) => <em className={`pill ${s.pay === 'paid' ? 'far' : s.pay === 'overdue' ? 'hot' : s.pay === 'none' ? 'past' : 'soon'}`}>{PAY_LABEL[s.pay]}</em>

  return (
    <>
      <PageTitle sub="Clients, deadlines, payment status and an hourly time tracker. Turn tracked time straight into an invoice.">Freelance &amp; invoices</PageTitle>
      <div className="grid12">
        <div className="c8 stack-lg">
          <Win title="Money & hours">
            <div className="stats3 stats4">
              <div>
                <small>To be paid</small>
                <b>{m(totals.outstanding)}</b>
              </div>
              <div>
                <small>Overdue</small>
                <b className={totals.overdue > 0 ? 'neg' : 'pos'}>{m(totals.overdue)}</b>
              </div>
              <div>
                <small>Earned in {format(today, 'MMM')}</small>
                <b className="pos">{m(totals.earned)}</b>
              </div>
              <div>
                <small>Hours in {format(today, 'MMM')}</small>
                <b>{fmtHm(totals.monthMin)}</b>
              </div>
            </div>
          </Win>

          <Win
            title="Projects"
            actions={
              <button type="button" aria-label={showDone ? 'Hide finished projects' : 'Show finished projects'} title={showDone ? 'Hide finished' : 'Show finished'} onClick={() => setShowDone((s) => !s)}>
                {showDone ? '◉' : '○'}
              </button>
            }
          >
            {shown.length === 0 ? (
              <Empty>{fl.projects.length ? 'All projects finished 🎉' : 'No projects yet. Add one from the right ➜'}</Empty>
            ) : (
              <ul className="projlist">
                {shown.map((p) => {
                  const s = projectStats(p, fl, today)
                  const cd = p.deadline && p.status !== 'done' ? countdown(p.deadline) : null
                  return (
                    <li key={p.id} className={p.status === 'done' ? 'done' : ''}>
                      <div className="pj-head">
                        <span className="bl-txt">
                          <b>{p.name}</b>
                          <small>
                            {p.client}
                            {p.rate ? ` · ${m(p.rate)}/hr` : ''}
                          </small>
                        </span>
                        {cd && <em className={`pill ${cd.n < 0 ? 'hot' : cd.tone}`}>{cd.n < 0 ? `deadline ${-cd.n}d late` : `deadline ${cd.text}`}</em>}
                        {payPill(s)}
                      </div>
                      <p className="pj-nums tiny muted">
                        ⏱ {fmtHm(s.trackedMin)} tracked · invoiced {m(s.invoiced)} · paid {m(s.paid)}
                        {s.unbilled > 0 && (
                          <>
                            {' '}
                            · <b>{fmtHm(s.unbilled)} unbilled{p.rate ? ` (${m(s.unbilledValue)})` : ''}</b>
                          </>
                        )}
                      </p>
                      <Progress value={s.paid} max={Math.max(s.invoiced, 1)} label={`Paid so far on ${p.name}`} />
                      {p.note && <p className="tiny muted">{p.note}</p>}
                      <div className="bl-act pj-act">
                        {s.unbilled > 0 && (
                          <button className="btn small" onClick={() => invoiceFromTime(p)}>
                            🧾 Invoice unbilled time
                          </button>
                        )}
                        <button className="btn small ghost" onClick={(e) => toggleDone(p, e)}>
                          {p.status === 'done' ? 'Reopen' : '✓ Finished'}
                        </button>
                        <button className="btn small ghost" aria-label={`Edit ${p.name}`} onClick={() => setEditP(p)}>
                          ✎
                        </button>
                        <button className="x" aria-label={`Delete ${p.name}`} onClick={() => delProject(p)}>
                          ×
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Win>

          <Win title="Invoices">
            {fl.projects.length > 0 && (
              <form className="row wrap invform" onSubmit={addInvoice}>
                <select value={inv.projectId || fl.projects[0].id} onChange={(e) => setInv({ ...inv, projectId: e.target.value })} aria-label="Invoice project">
                  {fl.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.client} · {p.name}
                    </option>
                  ))}
                </select>
                <input className="grow" maxLength={60} value={inv.title} onChange={(e) => setInv({ ...inv, title: e.target.value })} placeholder="Description (optional)" aria-label="Invoice description" />
                <input type="number" min="1" inputMode="numeric" value={inv.amount} onChange={(e) => setInv({ ...inv, amount: e.target.value })} placeholder={`Amount (${cur})`} aria-label="Invoice amount" style={{ maxWidth: '9rem' }} />
                <input type="date" value={inv.due} onChange={(e) => setInv({ ...inv, due: e.target.value })} aria-label="Due date" />
                <button className="btn small" type="submit">
                  + Invoice
                </button>
              </form>
            )}
            {invoices.length === 0 ? (
              <Empty>No invoices yet.</Empty>
            ) : (
              <ul className="billlist">
                {invoices.map((i) => {
                  const st = invoiceState(i, today)
                  return (
                    <li key={i.id} className={`${st.key === 'paid' ? 'paid' : ''} ${st.key === 'overdue' ? 'late' : ''}`}>
                      <span className="bl-txt">
                        <b>
                          {i.number} · {m(i.amount)}
                        </b>
                        <small>
                          {projName(i.projectId)} · {i.title}
                          {i.status === 'paid' && i.paidOn ? ` · paid ${format(parseISO(i.paidOn), 'd MMM')}` : i.due ? ` · due ${format(parseISO(i.due), 'd MMM')}` : ''}
                        </small>
                      </span>
                      {st.key === 'overdue' && <em className="pill hot">{-st.n}d overdue</em>}
                      <div className="bl-act">
                        <select value={i.status} aria-label={`Status of ${i.number}`} onChange={(e) => setInvStatus(i, e.target.value, e)}>
                          {INVOICE_STATUS.map(([v, l]) => (
                            <option key={v} value={v}>
                              {l}
                            </option>
                          ))}
                        </select>
                        <button className="x" aria-label={`Delete ${i.number}`} onClick={() => delInvoice(i)}>
                          ×
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Win>
        </div>

        <div className="c4 stack-lg">
          <TimerWin fl={fl} set={set} projects={active} />
          <Win title="New project">
            <ProjectForm key={pkey} cur={cur} initial={pform} onSave={addProject} submitLabel="Add project" />
          </Win>
          <ManualTime projects={active} set={set} />
          <Win title="Recent time" defaultOpen={false}>
            {recent.length === 0 ? (
              <Empty>No entries yet.</Empty>
            ) : (
              <ul className="wolist">
                {recent.map((t) => (
                  <li key={t.id}>
                    <span className="wo-txt">
                      <b>
                        {fmtHm(t.min)} · {format(parseISO(t.date), 'd MMM')}
                      </b>
                      <small>
                        {projName(t.projectId)}
                        {t.note ? ` · ${t.note}` : ''}
                        {t.billed ? ' · billed' : ''}
                      </small>
                    </span>
                    <button className="x" aria-label="Delete time entry" onClick={() => delTime(t)}>
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Win>
        </div>
      </div>

      {editP && (
        <Modal title={`Edit ${editP.name}`} onClose={() => setEditP(null)}>
          <ProjectForm cur={cur} initial={{ ...blankProject(), ...editP, rate: String(editP.rate || '') }} onSave={saveProject} onCancel={() => setEditP(null)} submitLabel="Save" />
        </Modal>
      )}
    </>
  )
}