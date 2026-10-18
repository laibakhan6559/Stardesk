import { useState } from 'react'
import { addMonths, format, parseISO } from 'date-fns'
import { Empty, PageTitle, Progress, Win } from '../components/ui'
import { BarChart } from '../components/shared'
import { EXPENSE_CATS, INCOME_CATS, budgetState, catInfo, lastMonths, money, monthKey, monthSummary } from '../lib/daily'
import { todayStr } from '../lib/dates'
import { uid, useStore } from '../lib/store'

export default function Budget() {
  const { data, set, setSetting, toast } = useStore()
  const cur = data.settings.currency || 'Rs'
  const { tx, limits, total } = data.budget
  const [month, setMonth] = useState(new Date())
  const [f, setF] = useState({ type: 'out', amount: '', cat: 'food', date: todayStr(), note: '' })
  const mk = monthKey(month)
  const sum = monthSummary(tx, mk)
  const m = (n) => money(n, cur)

  const patch = (fn) => set('budget', (b) => fn(b))

  const setType = (type) => setF((x) => ({ ...x, type, cat: type === 'in' ? 'salary' : 'food' }))

  const add = (e) => {
    e.preventDefault()
    const amount = Math.round(Number(f.amount))
    if (!amount || amount <= 0) return
    const row = { id: uid(), type: f.type, amount, cat: f.cat, date: f.date, note: f.note.trim() }
    patch((b) => ({ ...b, tx: [row, ...b.tx] }))

    // Warn the moment a limit is crossed.
    if (f.type === 'out') {
      const month0 = f.date.slice(0, 7)
      const before = monthSummary(tx, month0)
      const after = monthSummary([row, ...tx], month0)
      const catLimit = limits[f.cat]
      if (catLimit && before.byCat[f.cat] <= catLimit && after.byCat[f.cat] > catLimit) {
        toast(`⚠️ ${catInfo('out', f.cat)[1]} limit (${m(catLimit)}) exceeded!`, 'bell')
      } else if (total && before.spent <= total && after.spent > total) {
        toast(`⚠️ This month’s budget (${m(total)}) has been exceeded!`, 'bell')
      } else if (total && before.spent < total * 0.8 && after.spent >= total * 0.8) {
        toast(`80% of your budget is spent (${m(after.spent)} / ${m(total)}).`, 'info')
      }
    }
    setF((x) => ({ ...x, amount: '', note: '' }))
    if (f.date.slice(0, 7) !== mk) setMonth(parseISO(f.date))
  }
  const del = (id) => patch((b) => ({ ...b, tx: b.tx.filter((t) => t.id !== id) }))
  const setLimit = (cat, v) =>
    patch((b) => {
      const next = { ...b.limits }
      const n = Math.max(0, Math.round(Number(v) || 0))
      if (n) next[cat] = n
      else delete next[cat]
      return { ...b, limits: next }
    })
  const setTotal = (v) => patch((b) => ({ ...b, total: Math.max(0, Math.round(Number(v) || 0)) }))

  const state = budgetState(sum.spent, total)
  const over = EXPENSE_CATS.filter(([id]) => limits[id] && (sum.byCat[id] || 0) > limits[id])
  const history = lastMonths(6, new Date()).map((d) => ({ label: format(d, 'MMM'), value: monthSummary(tx, monthKey(d)).spent }))
  const cats = EXPENSE_CATS.filter(([id]) => sum.byCat[id] || limits[id])
  const list = [...sum.rows].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <>
      <PageTitle sub="Log income and spending, view categories, and get a warning when you go over budget.">Budget &amp; expenses</PageTitle>

      {(state === 'over' || state === 'near' || over.length > 0) && (
        <div className={`banner ${state === 'over' || over.length ? 'bad' : 'warn'}`} role="alert">
          {state === 'over' && (
            <p>
              ⚠️ Your budget for this month (<b>{m(total)}</b>) has been exceeded. Spent so far: <b>{m(sum.spent)}</b> (<b>{m(sum.spent - total)}</b> over).
            </p>
          )}
          {state === 'near' && (
            <p>
              🔔 {Math.round((sum.spent / total) * 100)}% of your budget is spent. Only <b>{m(total - sum.spent)}</b> left.
            </p>
          )}
          {over.map(([id, label, emoji]) => (
            <p key={id}>
              {emoji} {label}: <b>{m(sum.byCat[id])}</b> / {m(limits[id])} over the limit.
            </p>
          ))}
        </div>
      )}

      <div className="grid12">
        <div className="c8 stack-lg">
          <Win title="This month">
            <div className="row wrap" style={{ marginBottom: '.7rem' }}>
              <button className="btn small ghost" onClick={() => setMonth(addMonths(month, -1))} aria-label="Previous month">
                ◀
              </button>
              <b className="grow center">{format(month, 'MMMM yyyy')}</b>
              <button className="btn small ghost" onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month">
                ▶
              </button>
            </div>
            <div className="stats3">
              <div>
                <small>Income</small>
                <b className="pos">{m(sum.income)}</b>
              </div>
              <div>
                <small>Spent</small>
                <b className="neg">{m(sum.spent)}</b>
              </div>
              <div>
                <small>Left</small>
                <b className={sum.left < 0 ? 'neg' : 'pos'}>{m(sum.left)}</b>
              </div>
            </div>
            {total > 0 && (
              <>
                <Progress value={Math.min(sum.spent, total)} max={total} label="Monthly budget used" />
                <p className="tiny muted">
                  {m(sum.spent)} of {m(total)} budget
                </p>
              </>
            )}
          </Win>

          <Win title="Last 6 months – spending">
            <BarChart data={history} limit={total || undefined} format={(v) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : v)} label="Spending in the last six months" />
            {total > 0 && <p className="hint">Dashed line = your monthly budget. Red bar = over budget.</p>}
          </Win>

          <Win title="By category">
            {cats.length === 0 ? (
              <Empty>No expenses logged this month.</Empty>
            ) : (
              <ul className="catlist">
                {cats.map(([id, label, emoji]) => {
                  const spent = sum.byCat[id] || 0
                  const st = budgetState(spent, limits[id])
                  return (
                    <li key={id} className={`st-${st}`}>
                      <div className="row between" style={{ margin: 0 }}>
                        <span>
                          {emoji} {label}
                        </span>
                        <b>
                          {m(spent)}
                          {limits[id] ? <small className="muted"> / {m(limits[id])}</small> : ''}
                        </b>
                      </div>
                      {limits[id] ? <Progress value={Math.min(spent, limits[id])} max={limits[id]} label={`${label} limit`} /> : null}
                    </li>
                  )
                })}
              </ul>
            )}
          </Win>

          <Win title={`Transactions (${list.length})`}>
            {list.length === 0 ? (
              <Empty>No entries this month.</Empty>
            ) : (
              <ul className="txlist">
                {list.map((t) => {
                  const [, label, emoji] = catInfo(t.type, t.cat)
                  return (
                    <li key={t.id}>
                      <span className="tx-ico" aria-hidden="true">
                        {emoji}
                      </span>
                      <span className="tx-txt">
                        <b>{t.note || label}</b>
                        <small>
                          {label} · {format(parseISO(t.date), 'd MMM')}
                        </small>
                      </span>
                      <b className={t.type === 'in' ? 'pos' : 'neg'}>
                        {t.type === 'in' ? '+' : '−'}
                        {m(t.amount)}
                      </b>
                      <button className="x" aria-label={`Delete ${t.note || label}`} onClick={() => del(t.id)}>
                        ×
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </Win>
        </div>

        <div className="c4 stack-lg">
          <Win title="Add entry">
            <form className="form" onSubmit={add}>
              <div className="seg small" role="tablist">
                <button type="button" role="tab" aria-selected={f.type === 'out'} className={f.type === 'out' ? 'on' : ''} onClick={() => setType('out')}>
                  Expense
                </button>
                <button type="button" role="tab" aria-selected={f.type === 'in'} className={f.type === 'in' ? 'on' : ''} onClick={() => setType('in')}>
                  Income
                </button>
              </div>
              <input type="number" required min="1" inputMode="numeric" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder={`Amount (${cur})`} aria-label="Amount" />
              <select value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })} aria-label="Category">
                {(f.type === 'in' ? INCOME_CATS : EXPENSE_CATS).map(([id, label, emoji]) => (
                  <option key={id} value={id}>
                    {emoji} {label}
                  </option>
                ))}
              </select>
              <input type="date" required value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} aria-label="Date" />
              <input maxLength={60} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Note (optional)" aria-label="Note" />
              <button className="btn" type="submit">
                Add
              </button>
            </form>
          </Win>

          <Win title="Limits" defaultOpen={total === 0}>
            <div className="form">
              <label className="field">
                <span>Monthly budget ({cur})</span>
                <input type="number" min="0" inputMode="numeric" value={total || ''} onChange={(e) => setTotal(e.target.value)} placeholder="e.g. 60000" />
              </label>
              {EXPENSE_CATS.map(([id, label, emoji]) => (
                <label key={id} className="field">
                  <span>
                    {emoji} {label} limit
                  </span>
                  <input type="number" min="0" inputMode="numeric" value={limits[id] || ''} onChange={(e) => setLimit(id, e.target.value)} placeholder="No limit" />
                </label>
              ))}
              <label className="field">
                <span>Currency label</span>
                <input maxLength={4} value={cur} onChange={(e) => setSetting('currency', e.target.value || 'Rs')} />
              </label>
            </div>
          </Win>
        </div>
      </div>
    </>
  )
}