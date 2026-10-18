import { useState } from 'react'
import { Empty, Field, PageTitle, Win } from '../components/ui'
import { uid, useStore } from '../lib/store'
import { useNow } from '../lib/useNow'
import { CITIES, compareToLocal, dateIn, deviceTz, offsetText, timeIn, validTz } from '../lib/zones'

export default function Clock() {
  const { data, set, toast } = useStore()
  const now = useNow(1000)
  const [pick, setPick] = useState(CITIES[1][1])
  const [other, setOther] = useState('')
  const [at, setAt] = useState('09:00')

  const add = (label, tz) => {
    if (data.clocks.some((c) => c.tz === tz && c.label === label)) return toast('Already on your list.', 'info')
    set('clocks', (l) => [...l, { id: uid(), label, tz }])
  }
  const addOther = (e) => {
    e.preventDefault()
    const tz = other.trim()
    if (!validTz(tz)) return toast('Unknown zone. Use a name like Asia/Tokyo or Europe/Oslo.', 'info')
    add(tz.split('/').pop().replace(/_/g, ' '), tz)
    setOther('')
  }
  const del = (id) => set('clocks', (l) => l.filter((c) => c.id !== id))

  // "If it is [at] for me, what time is it there?"
  const base = (() => {
    const [h, m] = at.split(':').map(Number)
    const d = new Date()
    d.setHours(h || 0, m || 0, 0, 0)
    return d
  })()

  const local = deviceTz()
  return (
    <>
      <PageTitle sub="Know what time it is for friends and clients around the world.">World clock</PageTitle>
      <div className="grid12">
        <div className="c8 stack-lg">
          <Win title="My cities">
            <ul className="clocks">
              <li className="clock-card me">
                <span className="cc-city">You · {local.split('/').pop().replace(/_/g, ' ')}</span>
                <b className="cc-time">{timeIn(local, now)}</b>
                <small>{dateIn(local, now)}</small>
              </li>
              {data.clocks.map((c) => {
                const cmp = compareToLocal(c.tz, now)
                return (
                  <li key={c.id} className="clock-card">
                    <button className="x" aria-label={`Remove ${c.label}`} onClick={() => del(c.id)}>
                      ×
                    </button>
                    <span className="cc-city">{c.label}</span>
                    <b className="cc-time">{timeIn(c.tz, now)}</b>
                    <small>
                      {dateIn(c.tz, now)} · {offsetText(cmp)}
                    </small>
                  </li>
                )
              })}
            </ul>
            {data.clocks.length === 0 && <Empty>No cities yet – add some on the right ➜</Empty>}
          </Win>

          <Win title="Meeting time converter">
            <div className="form">
              <Field label="If it is this time for you today…">
                <input type="time" value={at} onChange={(e) => setAt(e.target.value)} />
              </Field>
              {data.clocks.length === 0 ? (
                <p className="muted tiny">Add a city to see its time.</p>
              ) : (
                <ul className="wclist">
                  {data.clocks.map((c) => {
                    const d = compareToLocal(c.tz, base).day
                    return (
                      <li key={c.id}>
                        <span>{c.label}</span>
                        <b>
                          {timeIn(c.tz, base)}
                          {d !== 0 && <small> {d > 0 ? '(next day)' : '(prev. day)'}</small>}
                        </b>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </Win>
        </div>

        <div className="c4">
          <Win title="Add a city">
            <div className="form">
              <Field label="Pick a city">
                <select value={pick} onChange={(e) => setPick(e.target.value)}>
                  {CITIES.map(([label, tz]) => (
                    <option key={tz} value={tz}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <button className="btn" onClick={() => add(CITIES.find((c) => c[1] === pick)[0], pick)}>
                Add city
              </button>
              <form className="form" onSubmit={addOther}>
                <Field label="Or any zone name">
                  <input value={other} onChange={(e) => setOther(e.target.value)} placeholder="e.g. Asia/Tashkent" />
                </Field>
                <button className="btn small ghost" type="submit">
                  Add zone
                </button>
              </form>
            </div>
          </Win>
        </div>
      </div>
    </>
  )
}