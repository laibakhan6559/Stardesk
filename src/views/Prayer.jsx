import { useState } from 'react'
import { addDays, eachDayOfInterval, endOfMonth, format, startOfMonth } from 'date-fns'
import { Field, PageTitle, Win } from '../components/ui'
import PlacePicker, { HijriAdjust } from '../components/PlacePicker'
import { formatHijri } from '../lib/hijri'
import { METHODS, fmtAt, nextPrayer, optsFrom, prayerTimes, qiblaBearing, untilText } from '../lib/prayer'
import { useStore } from '../lib/store'
import { useNow } from '../lib/useNow'

export default function Prayer() {
  const { data, setSetting, toast } = useStore()
  const now = useNow(15000)
  const [offset, setOffset] = useState(0)
  const { place, settings: s } = data
  const opts = optsFrom(s)
  const day = addDays(now, offset)
  const isToday = offset === 0

  let list = []
  let next = null
  let qibla = null
  let month = []
  try {
    list = prayerTimes(place, day, opts)
    next = nextPrayer(place, now, opts)
    qibla = qiblaBearing(place)
    month = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) }).map((d) => ({ d, t: prayerTimes(place, d, opts) }))
  } catch {
    /* invalid location */
  }

  const alertsOn = async (on) => {
    setSetting('prayerAlert', on)
    if (on) toast('Prayer alerts on – they ring while Stardesk is open 🔔', 'ok')
  }

  return (
    <>
      <PageTitle sub={`Calculated on your device for ${place.name} – works offline.`}>Prayer times & Hijri</PageTitle>
      <div className="grid12">
        <div className="c8 stack-lg">
          <Win title="Prayer times">
            <div className="row between" style={{ marginTop: 0 }}>
              <button className="btn small ghost" onClick={() => setOffset((o) => o - 1)} aria-label="Previous day">
                ◀
              </button>
              <div className="center">
                <b>{isToday ? 'Today' : format(day, 'EEEE')}</b>
                <p className="tiny muted" style={{ margin: 0 }}>
                  {format(day, 'd MMM yyyy')} · 🌙 {formatHijri(day, s.hijriAdj)}
                </p>
              </div>
              <button className="btn small ghost" onClick={() => setOffset((o) => o + 1)} aria-label="Next day">
                ▶
              </button>
            </div>
            {isToday && next && (
              <p className="next-prayer">
                Next: <b>{next.label}</b> {fmtAt(next.time, place.tz)} <em className="pill soon">in {untilText(next.time - now)}</em>
              </p>
            )}
            <ul className="ptimes big">
              {list.map((p) => (
                <li key={p.id} className={`${isToday && next && !next.tomorrow && next.id === p.id ? 'now' : ''} ${p.prayer ? '' : 'minor'}`}>
                  <span>{p.label}</span>
                  <b>{fmtAt(p.time, place.tz)}</b>
                </li>
              ))}
            </ul>
            {offset !== 0 && (
              <button className="btn small ghost" onClick={() => setOffset(0)}>
                Back to today
              </button>
            )}
          </Win>

          <Win title={`${format(now, 'MMMM yyyy')} timetable`} defaultOpen={false}>
            <div className="tablewrap">
              <table className="ptable">
                <thead>
                  <tr>
                    <th>Date</th>
                    {['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {month.map(({ d, t }) => (
                    <tr key={d.toISOString()} className={format(d, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd') ? 'today' : ''}>
                      <td>{format(d, 'EEE d')}</td>
                      {t.map((p) => (
                        <td key={p.id}>{fmtAt(p.time, place.tz)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Win>
        </div>

        <div className="c4 stack-lg">
          <Win title="Location">
            <PlacePicker />
          </Win>
          <Win title="Settings">
            <div className="form">
              <Field label="Calculation method">
                <select value={s.prayerMethod} onChange={(e) => setSetting('prayerMethod', e.target.value)}>
                  {METHODS.map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Asr calculation">
                <select value={s.prayerMadhab} onChange={(e) => setSetting('prayerMadhab', e.target.value)}>
                  <option value="hanafi">Hanafi (later Asr)</option>
                  <option value="shafi">Shafi / Maliki / Hanbali</option>
                </select>
              </Field>
              <HijriAdjust />
              <label className="switch">
                <input type="checkbox" checked={!!s.prayerAlert} onChange={(e) => alertsOn(e.target.checked)} />
                <span>Remind me at prayer time</span>
              </label>
              <p className="hint">Times can differ by a minute or two from your local masjid timetable. Check with it for exact jamaat times.</p>
            </div>
          </Win>
          {qibla != null && (
            <Win title="Qibla direction">
              <div className="qibla">
                <div className="qibla-dial" aria-hidden="true">
                  <span className="qn">N</span>
                  <i style={{ transform: `rotate(${qibla}deg)` }}>🕋</i>
                </div>
                <p className="small">
                  Qibla is <b>{qibla}°</b> from North (clockwise).
                </p>
              </div>
            </Win>
          )}
        </div>
      </div>
    </>
  )
}