import { useState } from 'react'
import { addDays, format } from 'date-fns'
import { PageTitle, Win } from '../components/ui'
import { TickList } from '../components/shared'
import { DISH_IDEAS, MEAL_SLOTS, suggestDish, weekDays } from '../lib/daily'
import { todayStr, ymd } from '../lib/dates'
import { uid, useStore } from '../lib/store'

export default function Meals() {
  const { data, set, toast } = useStore()
  const [anchor, setAnchor] = useState(new Date())
  const { plan, grocery } = data.meals
  const days = weekDays(anchor, data.settings.weekStart)
  const today = todayStr()

  const setSlot = (ds, slot, val) =>
    set('meals', (m) => {
      const day = { ...(m.plan[ds] || {}), [slot]: val }
      const next = { ...m.plan }
      if (!day.b && !day.l && !day.d) delete next[ds]
      else next[ds] = day
      return { ...m, plan: next }
    })

  const copyToNextWeek = () => {
    let n = 0
    set('meals', (m) => {
      const next = { ...m.plan }
      for (const d of days) {
        const src = m.plan[ymd(d)]
        if (src) {
          next[ymd(addDays(d, 7))] = { ...src }
          n++
        }
      }
      return { ...m, plan: next }
    })
    setAnchor(addDays(anchor, 7))
    toast(n ? 'Menu copied to next week 🍲' : 'This week has no menu to copy yet.', n ? 'ok' : 'info')
  }

  const clearWeek = () => {
    if (!window.confirm('Clear the menu for this week?')) return
    set('meals', (m) => {
      const next = { ...m.plan }
      for (const d of days) delete next[ymd(d)]
      return { ...m, plan: next }
    })
  }

  const planned = days.filter((d) => plan[ymd(d)]).length

  const addItem = (text) => set('meals', (m) => ({ ...m, grocery: [...m.grocery, { id: uid(), text, done: false }] }))
  const toggleItem = (id, done) => set('meals', (m) => ({ ...m, grocery: m.grocery.map((g) => (g.id === id ? { ...g, done } : g)) }))
  const removeItem = (id) => set('meals', (m) => ({ ...m, grocery: m.grocery.filter((g) => g.id !== id) }))
  const clearTicked = () => set('meals', (m) => ({ ...m, grocery: m.grocery.filter((g) => !g.done) }))
  const untickAll = () => set('meals', (m) => ({ ...m, grocery: m.grocery.map((g) => ({ ...g, done: false })) }))

  return (
    <>
      <PageTitle sub="Plan the weekly menu and build the grocery list. “What to cook today” also shows on Home.">Meal planner</PageTitle>
      <div className="grid12">
        <div className="c8 stack-lg">
          <Win title={`Week of ${format(days[0], 'd MMM')} – ${format(days[6], 'd MMM')}`}>
            <div className="row wrap" style={{ marginBottom: '.7rem' }}>
              <button className="btn small ghost" onClick={() => setAnchor(addDays(anchor, -7))} aria-label="Previous week">
                ◀
              </button>
              <button className="btn small ghost" onClick={() => setAnchor(new Date())}>
                This week
              </button>
              <button className="btn small ghost" onClick={() => setAnchor(addDays(anchor, 7))} aria-label="Next week">
                ▶
              </button>
              <span className="grow" />
              <button className="btn small ghost" onClick={copyToNextWeek}>
                Copy to next week
              </button>
              {planned > 0 && (
                <button className="btn small ghost" onClick={clearWeek}>
                  Clear week
                </button>
              )}
            </div>

            <ul className="mealweek">
              {days.map((d) => {
                const ds = ymd(d)
                const day = plan[ds] || {}
                return (
                  <li key={ds} className={`mealday ${ds === today ? 'today' : ''}`}>
                    <header>
                      <b>{format(d, 'EEEE')}</b>
                      <small>{format(d, 'd MMM')}</small>
                      <button type="button" className="dice" title="Suggest a dinner" aria-label={`Suggest dinner for ${format(d, 'EEEE')}`} onClick={() => setSlot(ds, 'd', DISH_IDEAS[Math.floor(Math.random() * DISH_IDEAS.length)])}>
                        🎲
                      </button>
                    </header>
                    {MEAL_SLOTS.map(([slot, label, emoji]) => (
                      <label key={slot} className="mealslot">
                        <span>
                          {emoji} {label}
                        </span>
                        <input list="dish-ideas" maxLength={80} value={day[slot] || ''} placeholder="—" onChange={(e) => setSlot(ds, slot, e.target.value)} />
                      </label>
                    ))}
                  </li>
                )
              })}
            </ul>
            <datalist id="dish-ideas">
              {DISH_IDEAS.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </Win>
        </div>

        <div className="c4 stack-lg">
          <Win title="Grocery list">
            <TickList
              items={grocery}
              onAdd={addItem}
              onToggle={toggleItem}
              onRemove={removeItem}
              placeholder="e.g. Flour 10 kg"
              empty="The list is empty. Add items based on your menu."
            />
            {grocery.length > 0 && (
              <div className="row wrap" style={{ marginTop: '.6rem' }}>
                <button className="btn small ghost" onClick={clearTicked} disabled={!grocery.some((g) => g.done)}>
                  Remove ticked
                </button>
                <button className="btn small ghost" onClick={untickAll} disabled={!grocery.some((g) => g.done)}>
                  Untick all
                </button>
              </div>
            )}
          </Win>
          <Win title="Today’s idea" defaultOpen={false}>
            <p>
              🍽️ <b>{suggestDish(today)}</b>
            </p>
            <p className="hint">A new idea appears every day. Tap 🎲 in the dinner box to set a random dish.</p>
          </Win>
        </div>
      </div>
    </>
  )
}