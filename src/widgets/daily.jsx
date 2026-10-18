import { format } from 'date-fns'
import { Progress, Win } from '../components/ui'
import { MEAL_SLOTS, assignee, billTotals, money, monthKey, monthSummary, nextDue, nextOccurrence, occInfo, periodOf, suggestDish } from '../lib/daily'
import { todayStr } from '../lib/dates'
import { go } from '../lib/nav'
import { useStore } from '../lib/store'

// Home windows for steps 3-4. Registered in lib/widgets.js and views/Home.jsx.

export function MealsWidget() {
  const { data, set } = useStore()
  const today = todayStr()
  const day = data.meals.plan[today] || {}
  const planned = MEAL_SLOTS.filter(([s]) => day[s])
  const idea = suggestDish(today)
  const useIdea = () =>
    set('meals', (m) => ({ ...m, plan: { ...m.plan, [today]: { ...(m.plan[today] || {}), d: idea } } }))
  return (
    <Win title="What to cook today?">
      {planned.length > 0 ? (
        <ul className="mealtoday">
          {MEAL_SLOTS.map(([s, label, emoji]) => (
            <li key={s} className={day[s] ? '' : 'none'}>
              <span>
                {emoji} {label}
              </span>
              <b>{day[s] || '—'}</b>
            </li>
          ))}
        </ul>
      ) : (
        <div>
          <p className="muted tiny">Today’s menu is not set yet.</p>
          <p>
            💡 Idea: <b>{idea}</b>
          </p>
          <button className="btn small" onClick={useIdea}>
            Dinner tonight
          </button>
        </div>
      )}
      <button className="bigbtn" style={{ marginTop: '.6rem', marginBottom: 0 }} onClick={() => go('meals')}>
        Weekly menu →
      </button>
    </Win>
  )
}

export function BillsWidget() {
  const { data } = useStore()
  const cur = data.settings.currency || 'Rs'
  const now = new Date()
  const rows = data.bills
    .filter((b) => !b.paused)
    .map((b) => ({ b, d: nextDue(b, now) }))
    .filter((r) => !r.d.paid)
    .sort((x, y) => x.d.n - y.d.n)
    .slice(0, 3)
  const t = billTotals(data.bills, now)
  return (
    <Win title="Bills due">
      {data.bills.length === 0 ? (
        <p className="muted tiny">Add electricity, gas or Netflix and get an alert before the due date.</p>
      ) : rows.length === 0 ? (
        <p>All paid this month 🎉</p>
      ) : (
        <ul className="wclist">
          {rows.map(({ b, d }) => (
            <li key={b.id}>
              <span>
                {b.emoji} {b.name}
              </span>
              <b className={d.n <= 1 ? 'neg' : ''}>{d.n < 0 ? 'overdue' : d.n === 0 ? 'today' : `${d.n}d`}</b>
            </li>
          ))}
        </ul>
      )}
      {data.bills.length > 0 && (
        <p className="tiny muted">
          {format(now, 'MMM')}: {money(t.paid, cur)} paid of {money(t.total, cur)}
        </p>
      )}
      <button className="bigbtn" style={{ marginBottom: 0 }} onClick={() => go('bills')}>
        Bills →
      </button>
    </Win>
  )
}

export function BudgetWidget() {
  const { data } = useStore()
  const cur = data.settings.currency || 'Rs'
  const { tx, total } = data.budget
  const s = monthSummary(tx, monthKey(new Date()))
  return (
    <Win title="Budget">
      <p className="big" style={{ marginBottom: '.2rem' }}>
        {money(s.spent, cur)}
      </p>
      <p className="muted tiny">
        {total ? `spent of ${money(total, cur)} this month` : 'spent this month'}
      </p>
      {total > 0 && <Progress value={Math.min(s.spent, total)} max={total} label="Monthly budget used" />}
      {total > 0 && s.spent > total && <p className="neg tiny">⚠️ Over budget</p>}
      <button className="bigbtn" style={{ marginTop: '.6rem', marginBottom: 0 }} onClick={() => go('budget')}>
        Add expense →
      </button>
    </Win>
  )
}

export function ChoresWidget() {
  const { data } = useStore()
  const { people, items } = data.chores
  const now = new Date()
  const todo = items.filter((c) => !c.done?.[periodOf(c.freq, now).key]).slice(0, 4)
  return (
    <Win title="Home chores">
      {items.length === 0 ? (
        <p className="muted tiny">Add chores and share them among the family.</p>
      ) : todo.length === 0 ? (
        <p>All chores done ✨</p>
      ) : (
        <ul className="wclist">
          {todo.map((c) => (
            <li key={c.id}>
              <span>
                {c.emoji} {c.title}
              </span>
              <b>{assignee(c, people, now) || 'anyone'}</b>
            </li>
          ))}
        </ul>
      )}
      <button className="bigbtn" style={{ marginBottom: 0 }} onClick={() => go('chores')}>
        Chores →
      </button>
    </Win>
  )
}

export function BirthdaysWidget() {
  const { data } = useStore()
  const now = new Date()
  const rows = data.birthdays
    .map((b) => ({ b, o: nextOccurrence(b, now) }))
    .filter((r) => r.o)
    .sort((a, c) => a.o.n - c.o.n)
    .slice(0, 3)
  return (
    <Win title="Birthdays">
      {rows.length === 0 ? (
        <p className="muted tiny">Add birthdays and anniversaries and we will remind you.</p>
      ) : (
        <ul className="cdlist">
          {rows.map(({ b, o }) => (
            <li key={b.id}>
              <span className="cd-n">{o.n}</span>
              <span className="cd-t">
                <b>
                  {occInfo(b.kind)[2]} {b.name}
                </b>
                <small>{o.n === 0 ? 'Today!' : o.n === 1 ? 'day to go · tomorrow' : 'days to go'}</small>
              </span>
            </li>
          ))}
        </ul>
      )}
      <button className="bigbtn" style={{ marginBottom: 0 }} onClick={() => go('birthdays')}>
        All dates →
      </button>
    </Win>
  )
}