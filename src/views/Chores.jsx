import { useState } from 'react'
import { format } from 'date-fns'
import { Empty, PageTitle, Progress, Win } from '../components/ui'
import { fireConfetti } from '../components/shared'
import { CHORE_FREQ, CHORE_IDEAS, assignee, nextPeriodDate, periodOf } from '../lib/daily'
import { uid, useStore } from '../lib/store'

const freqLabel = (f) => CHORE_FREQ.find((x) => x[0] === f)?.[1] || f
const roundWord = { daily: 'today', weekly: 'this week', monthly: 'this month' }

export default function Chores() {
  const { data, set } = useStore()
  const { people, items } = data.chores
  const [person, setPerson] = useState('')
  const [who, setWho] = useState('all') // filter: all | a person's name
  const [f, setF] = useState({ title: '', emoji: '🧹', freq: 'weekly', who: null })
  const now = new Date()

  const patch = (fn) => set('chores', (c) => fn(c))

  const addPerson = (e) => {
    e.preventDefault()
    const n = person.trim()
    if (!n || people.includes(n)) return
    patch((c) => ({ ...c, people: [...c.people, n] }))
    setPerson('')
  }
  const removePerson = (n) => {
    if (!window.confirm(`Remove ${n} from the family list?`)) return
    patch((c) => ({ ...c, people: c.people.filter((p) => p !== n), items: c.items.map((i) => ({ ...i, who: i.who.filter((w) => w !== n) })) }))
    if (who === n) setWho('all')
  }

  const chosen = f.who ?? people // default: everyone takes part
  const toggleWho = (n) => setF((x) => ({ ...x, who: (x.who ?? people).includes(n) ? (x.who ?? people).filter((p) => p !== n) : [...(x.who ?? people), n] }))

  const addChore = (e) => {
    e.preventDefault()
    const title = f.title.trim()
    if (!title) return
    patch((c) => ({ ...c, items: [...c.items, { id: uid(), title, emoji: f.emoji, freq: f.freq, who: chosen.filter((p) => people.includes(p)), offset: c.items.length, done: {} }] }))
    setF({ title: '', emoji: '🧹', freq: f.freq, who: null })
  }
  const delChore = (id) => patch((c) => ({ ...c, items: c.items.filter((i) => i.id !== id) }))

  const tick = (chore, e) => {
    const { key } = periodOf(chore.freq, now)
    const was = chore.done?.[key]
    patch((c) => ({
      ...c,
      items: c.items.map((i) => {
        if (i.id !== chore.id) return i
        const done = { ...i.done }
        if (was) delete done[key]
        else done[key] = assignee(i, c.people, now) || 'Someone'
        // keep the record small: only the latest 40 rounds
        const keys = Object.keys(done).sort()
        for (const k of keys.slice(0, Math.max(0, keys.length - 40))) delete done[k]
        return { ...i, done }
      }),
    }))
    if (!was) fireConfetti({ x: e?.clientX, y: e?.clientY, kind: 'stars', count: 30 })
  }

  const rows = items.map((c) => ({ c, now: assignee(c, people, now), next: assignee(c, people, nextPeriodDate(c.freq, now)), done: !!c.done?.[periodOf(c.freq, now).key] }))
  const shown = rows.filter((r) => who === 'all' || r.now === who)
  const doneCount = rows.filter((r) => r.done).length

  return (
    <>
      <PageTitle sub="Cleaning, laundry, watering plants. With rotation, each round the next member takes their turn.">Home chores</PageTitle>
      <div className="grid12">
        <div className="c8 stack-lg">
          <Win title="Whose turn is it?">
            {people.length > 0 && (
              <div className="seg small wrapseg" role="tablist" aria-label="Filter by person">
                <button role="tab" aria-selected={who === 'all'} className={who === 'all' ? 'on' : ''} onClick={() => setWho('all')}>
                  Everyone
                </button>
                {people.map((p) => (
                  <button key={p} role="tab" aria-selected={who === p} className={who === p ? 'on' : ''} onClick={() => setWho(p)}>
                    {p}
                  </button>
                ))}
              </div>
            )}
            {items.length === 0 ? (
              <Empty>No chores yet. Add family members and chores from the right.</Empty>
            ) : (
              <>
                <Progress value={doneCount} max={rows.length} label="Chores done this round" />
                <p className="tiny muted">
                  {doneCount}/{rows.length} done in the current round
                </p>
                {shown.length === 0 && <Empty>{who} has no chores right now 🎉</Empty>}
                <ul className="chorelist">
                  {shown.map(({ c, now: who1, next, done }) => (
                    <li key={c.id} className={done ? 'done' : ''}>
                      <input type="checkbox" className="chk" checked={done} onChange={(e) => tick(c, e.nativeEvent)} aria-label={`${c.title} done`} />
                      <span className="ch-ico" aria-hidden="true">
                        {c.emoji}
                      </span>
                      <span className="ch-txt">
                        <b>{c.title}</b>
                        <small>
                          {freqLabel(c.freq)} · {who1 ? <>{who1}’s turn {roundWord[c.freq]}</> : 'anyone can do it'}
                          {done && c.done[periodOf(c.freq, now).key] ? ` · done by ${c.done[periodOf(c.freq, now).key]}` : ''}
                          {next && c.who.length > 1 ? ` · next: ${next}` : ''}
                        </small>
                      </span>
                      <span className="ch-when" title="Next round starts">↻ {format(nextPeriodDate(c.freq, now), 'd MMM')}</span>
                      <button className="x" aria-label={`Delete ${c.title}`} onClick={() => window.confirm(`Delete “${c.title}”?`) && delChore(c.id)}>
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="hint">A new round starts on the date shown with ↻, and the turn passes to the next member.</p>
              </>
            )}
          </Win>
        </div>

        <div className="c4 stack-lg">
          <Win title="Family members">
            <form className="row" onSubmit={addPerson}>
              <input className="grow" maxLength={24} value={person} onChange={(e) => setPerson(e.target.value)} placeholder="Name" aria-label="Family member name" />
              <button className="btn small" type="submit">
                Add
              </button>
            </form>
            {people.length > 0 ? (
              <ul className="chips" style={{ marginTop: '.6rem' }}>
                {people.map((p) => (
                  <li key={p}>
                    {p}
                    <button aria-label={`Remove ${p}`} onClick={() => removePerson(p)}>
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="hint">Add family member names first (including your own).</p>
            )}
          </Win>

          <Win title="Add a chore">
            <form className="form" onSubmit={addChore}>
              <input required maxLength={50} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Wash dishes" aria-label="Chore" />
              <div className="emojis" role="group" aria-label="Quick ideas">
                {CHORE_IDEAS.map(([e, t]) => (
                  <button type="button" key={t} title={t} className={f.title === t ? 'on' : ''} onClick={() => setF({ ...f, emoji: e, title: t })}>
                    {e}
                  </button>
                ))}
              </div>
              <select value={f.freq} onChange={(e) => setF({ ...f, freq: e.target.value })} aria-label="How often">
                {CHORE_FREQ.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
              {people.length > 0 && (
                <fieldset className="field">
                  <legend>Rotate between</legend>
                  <div className="stack">
                    {people.map((p) => (
                      <label key={p} className="switch">
                        <input type="checkbox" checked={chosen.includes(p)} onChange={() => toggleWho(p)} />
                        <span>{p}</span>
                      </label>
                    ))}
                  </div>
                  <p className="hint">Pick just one name and the chore will always be theirs.</p>
                </fieldset>
              )}
              <button className="btn" type="submit">
                Add chore
              </button>
            </form>
          </Win>
        </div>
      </div>
    </>
  )
}