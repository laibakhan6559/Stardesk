import { useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { confettiFrom } from '../components/shared'
import { Empty, Field, Modal, PageTitle, Win } from '../components/ui'
import { todayStr, ymd } from '../lib/dates'
import { uid, useStore } from '../lib/store'
import { JOB_STATUS, followInfo, followOpen, jobCounts, jobStatus } from '../lib/work'

const blank = () => ({ company: '', role: '', status: 'applied', applied: todayStr(), follow: ymd(addDays(new Date(), 7)), link: '', contact: '', note: '' })

function JobForm({ initial, onSave, onCancel, submitLabel }) {
  const [f, setF] = useState(initial)
  const up = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const submit = (e) => {
    e.preventDefault()
    const company = f.company.trim()
    if (!company) return
    onSave({ ...f, company, role: f.role.trim(), link: f.link.trim(), contact: f.contact.trim(), note: f.note.trim() })
  }
  return (
    <form className="form" onSubmit={submit}>
      <div className="row wrap">
        <Field label="Company" grow>
          <input required autoFocus maxLength={50} value={f.company} onChange={up('company')} placeholder="e.g. Systems Ltd" />
        </Field>
        <Field label="Role" grow>
          <input maxLength={60} value={f.role} onChange={up('role')} placeholder="e.g. Frontend developer" />
        </Field>
      </div>
      <Field label="Status">
        <select value={f.status} onChange={up('status')}>
          {JOB_STATUS.map(([id, label, emoji]) => (
            <option key={id} value={id}>
              {emoji} {label}
            </option>
          ))}
        </select>
      </Field>
      <div className="row wrap">
        <Field label="Applied on" grow>
          <input type="date" value={f.applied} onChange={up('applied')} />
        </Field>
        <Field label="Follow-up on" grow>
          <input type="date" value={f.follow} onChange={up('follow')} />
        </Field>
      </div>
      <Field label="Job link (optional)">
        <input type="url" maxLength={300} value={f.link} onChange={up('link')} placeholder="https://…" />
      </Field>
      <Field label="Contact person (optional)">
        <input maxLength={80} value={f.contact} onChange={up('contact')} placeholder="Name / email of the recruiter" />
      </Field>
      <Field label="Notes">
        <textarea rows={3} maxLength={600} value={f.note} onChange={up('note')} placeholder="Salary, interview questions, how it went…" />
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

export default function Jobs() {
  const { data, set } = useStore()
  const [filter, setFilter] = useState('open')
  const [edit, setEdit] = useState(null)
  const [key, setKey] = useState(0)
  const today = new Date()
  const counts = jobCounts(data.jobs)
  const active = counts.applied + counts.interview

  const add = (v) => {
    set('jobs', (l) => [{ ...v, id: uid() }, ...l])
    setKey((k) => k + 1)
  }
  const save = (v) => {
    set('jobs', (l) => l.map((j) => (j.id === edit.id ? { ...j, ...v } : j)))
    setEdit(null)
  }
  const setStatus = (j, status, e) => {
    set('jobs', (l) => l.map((x) => (x.id === j.id ? { ...x, status } : x)))
    if (status === 'offer') confettiFrom(e, 'confetti')
  }
  // "Followed up" pushes the next reminder a week out.
  const snooze = (j) => set('jobs', (l) => l.map((x) => (x.id === j.id ? { ...x, follow: ymd(addDays(new Date(), 7)) } : x)))
  const del = (j) => window.confirm(`Delete “${j.company}”?`) && set('jobs', (l) => l.filter((x) => x.id !== j.id))

  const rank = (j) => {
    const f = followInfo(j, today)
    return f ? f.n : 9998 + JOB_STATUS.findIndex((s) => s[0] === j.status)
  }
  const list = data.jobs
    .filter((j) => (filter === 'open' ? j.status !== 'rejected' : filter === 'all' ? true : j.status === filter))
    .sort((a, b) => rank(a) - rank(b))

  const pill = (j) => {
    const f = followInfo(j, today)
    if (!f) return null
    if (f.overdue) return <em className="pill hot">follow up {-f.n}d late</em>
    if (f.n === 0) return <em className="pill hot">follow up today</em>
    return <em className={`pill ${f.n <= 3 ? 'soon' : 'far'}`}>follow up in {f.n}d</em>
  }

  return (
    <>
      <PageTitle sub="Company, status and follow-up date. You will get a reminder when a follow-up is due.">Job applications</PageTitle>
      <div className="grid12">
        <div className="c8 stack-lg">
          <Win title="Pipeline">
            <div className="stats3 stats5">
              {JOB_STATUS.filter((s) => s[0] !== 'wish').map(([id, label, emoji]) => (
                <div key={id}>
                  <small>
                    {emoji} {label}
                  </small>
                  <b>{counts[id]}</b>
                </div>
              ))}
            </div>
            <p className="tiny muted">
              {active} application{active === 1 ? '' : 's'} still in play · {counts.wish} on the wishlist
            </p>
          </Win>

          <Win title="My applications">
            <div className="seg small wrapseg" role="tablist">
              {[['open', 'Active'], ...JOB_STATUS.map(([id, l]) => [id, l]), ['all', 'All']].map(([id, label]) => (
                <button key={id} role="tab" aria-selected={filter === id} className={filter === id ? 'on' : ''} onClick={() => setFilter(id)}>
                  {label}
                </button>
              ))}
            </div>
            {list.length === 0 ? (
              <Empty>{data.jobs.length ? 'Nothing matches this filter.' : 'No applications yet. Add your first one from the right ➜'}</Empty>
            ) : (
              <ul className="joblist">
                {list.map((j) => {
                  const [, , emoji] = jobStatus(j.status)
                  return (
                    <li key={j.id} className={`st-${j.status}`}>
                      <div className="jb-main">
                        <b>
                          {emoji} {j.company}
                        </b>
                        <small>
                          {j.role || 'Role not set'}
                          {j.applied ? ` · applied ${format(parseISO(j.applied), 'd MMM')}` : ''}
                        </small>
                        {j.contact && <small>👤 {j.contact}</small>}
                        {j.note && <small className="jb-note">{j.note}</small>}
                        {j.link && /^https?:\/\//i.test(j.link) && (
                          <small>
                            <a href={j.link} target="_blank" rel="noopener noreferrer">
                              Open job post ↗
                            </a>
                          </small>
                        )}
                      </div>
                      <div className="jb-side">
                        {pill(j)}
                        <select value={j.status} aria-label={`Status of ${j.company}`} onChange={(e) => setStatus(j, e.target.value, e)}>
                          {JOB_STATUS.map(([id, label]) => (
                            <option key={id} value={id}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <div className="bl-act">
                          {followOpen(j) && (
                            <button className="btn small" title="Follow-up sent: next reminder in 7 days" onClick={() => snooze(j)}>
                              Followed up
                            </button>
                          )}
                          <button className="btn small ghost" aria-label={`Edit ${j.company}`} onClick={() => setEdit(j)}>
                            ✎
                          </button>
                          <button className="x" aria-label={`Delete ${j.company}`} onClick={() => del(j)}>
                            ×
                          </button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Win>
        </div>

        <div className="c4">
          <Win title="Add application">
            <JobForm key={key} initial={blank()} onSave={add} submitLabel="Add" />
          </Win>
        </div>
      </div>

      {edit && (
        <Modal title={`Edit ${edit.company}`} onClose={() => setEdit(null)}>
          <JobForm initial={{ ...blank(), ...edit }} onSave={save} onCancel={() => setEdit(null)} submitLabel="Save" />
        </Modal>
      )}
    </>
  )
}