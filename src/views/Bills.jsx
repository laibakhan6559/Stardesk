import { useState } from 'react'
import { format } from 'date-fns'
import { Empty, Field, Modal, PageTitle, Progress, Win } from '../components/ui'
import { BILL_PRESETS, REMIND_DAYS, billTotals, money, monthKey, nextDue } from '../lib/daily'
import { uid, useStore } from '../lib/store'

const blank = () => ({ name: '', emoji: '🧾', kind: 'bill', amount: '', day: 1, remind: 3 })

function BillForm({ initial, onSave, onCancel, submitLabel }) {
  const { data } = useStore()
  const cur = data.settings.currency || 'Rs'
  const [f, setF] = useState(initial)
  const up = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const submit = (e) => {
    e.preventDefault()
    const name = f.name.trim()
    const amount = Math.round(Number(f.amount))
    if (!name || !(amount >= 0)) return
    onSave({ ...f, name, amount, day: Math.min(31, Math.max(1, Number(f.day) || 1)), remind: Number(f.remind) })
  }
  return (
    <form className="form" onSubmit={submit}>
      <Field label="Name">
        <input required autoFocus maxLength={40} value={f.name} onChange={up('name')} placeholder="e.g. Electricity bill" />
      </Field>
      <div className="seg small" role="tablist">
        {[
          ['bill', 'Bill'],
          ['sub', 'Subscription'],
        ].map(([v, l]) => (
          <button key={v} type="button" role="tab" aria-selected={f.kind === v} className={f.kind === v ? 'on' : ''} onClick={() => setF({ ...f, kind: v })}>
            {l}
          </button>
        ))}
      </div>
      <div className="row">
        <Field label={`Amount (${cur})`} grow>
          <input type="number" required min="0" inputMode="numeric" value={f.amount} onChange={up('amount')} />
        </Field>
        <Field label="Due day of month" grow>
          <input type="number" required min="1" max="31" value={f.day} onChange={up('day')} />
        </Field>
      </div>
      <Field label="Remind me">
        <select value={f.remind} onChange={up('remind')}>
          {REMIND_DAYS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
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

export default function Bills() {
  const { data, set } = useStore()
  const cur = data.settings.currency || 'Rs'
  const m = (n) => money(n, cur)
  const [form, setForm] = useState(blank())
  const [edit, setEdit] = useState(null)
  const [key, setKey] = useState(0)
  const today = new Date()
  const mk = monthKey(today)

  const rows = data.bills
    .map((b) => ({ b, d: nextDue(b, today) }))
    .sort((x, y) => Number(!!x.b.paused) - Number(!!y.b.paused) || Number(x.d.paid) - Number(y.d.paid) || x.d.n - y.d.n)
  const totals = billTotals(data.bills, today)

  const add = (v) => {
    set('bills', (l) => [...l, { ...v, id: uid(), paused: false, paid: {} }])
    setForm(blank())
    setKey((k) => k + 1)
  }
  const save = (v) => {
    set('bills', (l) => l.map((b) => (b.id === edit.id ? { ...b, ...v } : b)))
    setEdit(null)
  }
  const togglePaid = (id) =>
    set('bills', (l) =>
      l.map((b) => {
        if (b.id !== id) return b
        const paid = { ...b.paid }
        if (paid[mk]) delete paid[mk]
        else paid[mk] = true
        const keys = Object.keys(paid).sort()
        for (const k of keys.slice(0, Math.max(0, keys.length - 24))) delete paid[k]
        return { ...b, paid }
      })
    )
  const togglePause = (id) => set('bills', (l) => l.map((b) => (b.id === id ? { ...b, paused: !b.paused } : b)))
  const del = (b) => window.confirm(`Delete “${b.name}”?`) && set('bills', (l) => l.filter((x) => x.id !== b.id))

  const pill = (b, d) => {
    if (b.paused) return <em className="pill past">paused</em>
    if (d.paid) return <em className="pill far">paid ✓</em>
    if (d.overdue) return <em className="pill hot">{-d.n} day{d.n === -1 ? '' : 's'} overdue</em>
    if (d.n === 0) return <em className="pill hot">due today</em>
    if (d.n === 1) return <em className="pill hot">tomorrow</em>
    return <em className={`pill ${d.n <= (b.remind || 3) ? 'soon' : 'far'}`}>in {d.n} days</em>
  }

  return (
    <>
      <PageTitle sub="Electricity, gas, internet, Netflix, Spotify. Get an alert before the due date and see the monthly total.">Bills &amp; subscriptions</PageTitle>
      <div className="grid12">
        <div className="c8 stack-lg">
          <Win title={`${format(today, 'MMMM')} total`}>
            <div className="stats3">
              <div>
                <small>This month</small>
                <b>{m(totals.total)}</b>
              </div>
              <div>
                <small>Paid</small>
                <b className="pos">{m(totals.paid)}</b>
              </div>
              <div>
                <small>Still to pay</small>
                <b className={totals.left > 0 ? 'neg' : 'pos'}>{m(totals.left)}</b>
              </div>
            </div>
            <Progress value={totals.paid} max={totals.total} label="Bills paid this month" />
            <p className="tiny muted">
              Bills {m(totals.bills)} · Subscriptions {m(totals.subs)} ({m(totals.subs * 12)} / year)
            </p>
          </Win>

          <Win title="Upcoming">
            {rows.length === 0 ? (
              <Empty>No bills yet. Add one from the right ➜</Empty>
            ) : (
              <ul className="billlist">
                {rows.map(({ b, d }) => (
                  <li key={b.id} className={`${b.paused ? 'paused' : ''} ${d.paid ? 'paid' : ''} ${d.overdue ? 'late' : ''}`}>
                    <span className="bl-ico" aria-hidden="true">
                      {b.emoji}
                    </span>
                    <span className="bl-txt">
                      <b>{b.name}</b>
                      <small>
                        {m(b.amount)} · {b.kind === 'sub' ? 'subscription' : 'bill'} · due {format(d.date, 'd MMM')}
                      </small>
                    </span>
                    {pill(b, d)}
                    <div className="bl-act">
                      {!b.paused && (
                        <button className={`btn small ${d.paid ? 'ghost' : ''}`} onClick={() => togglePaid(b.id)}>
                          {d.paid ? 'Undo' : 'Mark paid'}
                        </button>
                      )}
                      <button className="btn small ghost" aria-label={`Edit ${b.name}`} onClick={() => setEdit(b)}>
                        ✎
                      </button>
                      <button className="btn small ghost" aria-label={b.paused ? `Resume ${b.name}` : `Pause ${b.name}`} title={b.paused ? 'Resume' : 'Pause'} onClick={() => togglePause(b.id)}>
                        {b.paused ? '▶' : '⏸'}
                      </button>
                      <button className="x" aria-label={`Delete ${b.name}`} onClick={() => del(b)}>
                        ×
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Win>
        </div>

        <div className="c4 stack-lg">
          <Win title="Add bill / subscription">
            <div className="chips presets" role="group" aria-label="Quick add">
              {BILL_PRESETS.map(([name, emoji, kind]) => (
                <button
                  key={name}
                  type="button"
                  className="chip"
                  onClick={() => {
                    setForm({ ...blank(), name, emoji, kind })
                    setKey((k) => k + 1)
                  }}
                >
                  {emoji} {name.split(' (')[0]}
                </button>
              ))}
            </div>
            <BillForm key={key} initial={form} onSave={add} submitLabel="Add" />
          </Win>
        </div>
      </div>

      {edit && (
        <Modal title={`Edit ${edit.name}`} onClose={() => setEdit(null)}>
          <BillForm initial={{ ...edit, amount: String(edit.amount) }} onSave={save} onCancel={() => setEdit(null)} submitLabel="Save" />
        </Modal>
      )}
    </>
  )
}