import { Win } from '../components/ui'
import { go } from '../lib/nav'
import { useStore } from '../lib/store'
import { buildCountdowns } from '../lib/countdowns'
import { formatHijri } from '../lib/hijri'
import { fmtAt, nextPrayer, optsFrom, prayerTimes, untilText } from '../lib/prayer'
import { useNow } from '../lib/useNow'
import { useWeather, wmo } from '../lib/weather'
import { timeIn } from '../lib/zones'

// Home windows for step 2. Registered in lib/widgets.js and views/Home.jsx.

export function PrayerWidget() {
  const { data } = useStore()
  const now = useNow(20000)
  const { place, settings: s } = data
  let list = []
  let next = null
  try {
    list = prayerTimes(place, now, optsFrom(s))
    next = nextPrayer(place, now, optsFrom(s))
  } catch {
    /* bad coordinates */
  }
  return (
    <Win title="Prayer times">
      <p className="hijri-line">🌙 {formatHijri(now, s.hijriAdj)}</p>
      {next && (
        <p className="next-prayer">
          Next: <b>{next.label}</b> {fmtAt(next.time, place.tz)} <em className="pill soon">in {untilText(next.time - now)}</em>
        </p>
      )}
      <ul className="ptimes">
        {list.map((p) => (
          <li key={p.id} className={`${next && !next.tomorrow && next.id === p.id ? 'now' : ''} ${p.prayer ? '' : 'minor'}`}>
            <span>{p.label}</span>
            <b>{fmtAt(p.time, place.tz)}</b>
          </li>
        ))}
      </ul>
      <button className="bigbtn" style={{ marginBottom: 0 }} onClick={() => go('prayer')}>
        {place.name} · more →
      </button>
    </Win>
  )
}

export function WeatherWidget() {
  const { data } = useStore()
  const { place } = data
  const w = useWeather(place)
  const [emoji, label] = w.data ? wmo(w.data.now.code) : ['', '']
  const today = w.data?.days[0]
  return (
    <Win title="Weather">
      {w.loading && !w.data && <p className="muted tiny">Loading weather…</p>}
      {w.error && !w.data && <p className="muted tiny">Weather needs internet. We will show it here as soon as you are online.</p>}
      {w.data && (
        <button className="wx-now" onClick={() => go('weather')} aria-label="Open weather">
          <span className="wx-ico">{emoji}</span>
          <span className="wx-temp">{w.data.now.temp}°C</span>
          <span className="wx-txt">
            {label}
            <small>
              Feels {w.data.now.feels}° · H {today?.hi}° L {today?.lo}°
            </small>
          </span>
        </button>
      )}
      <p className="muted tiny">
        📍 {place.name}
        {w.stale && w.data ? ' · offline, last known' : ''}
      </p>
    </Win>
  )
}

export function CountdownsWidget() {
  const { data } = useStore()
  const items = buildCountdowns(data).slice(0, 4)
  return (
    <Win title="Countdowns">
      {items.length === 0 ? (
        <p className="muted tiny">Add a trip or event to start counting down.</p>
      ) : (
        <ul className="cdlist">
          {items.map((c) => (
            <li key={c.id}>
              <span className="cd-n">{c.n}</span>
              <span className="cd-t">
                <b>
                  {c.emoji} {c.title}
                </b>
                <small>{c.n === 0 ? 'Today!' : c.n === 1 ? 'day to go · tomorrow' : 'days to go'}</small>
              </span>
            </li>
          ))}
        </ul>
      )}
      <button className="bigbtn" style={{ marginBottom: 0 }} onClick={() => go('countdowns')}>
        All countdowns →
      </button>
    </Win>
  )
}

export function ClockWidget() {
  const { data } = useStore()
  const now = useNow(15000)
  const clocks = data.clocks.slice(0, 4)
  return (
    <Win title="World clock">
      {clocks.length === 0 ? (
        <p className="muted tiny">Add cities in the World clock app.</p>
      ) : (
        <ul className="wclist">
          {clocks.map((c) => (
            <li key={c.id}>
              <span>{c.label}</span>
              <b>{timeIn(c.tz, now)}</b>
            </li>
          ))}
        </ul>
      )}
      <button className="bigbtn" style={{ marginBottom: 0 }} onClick={() => go('clock')}>
        World clock →
      </button>
    </Win>
  )
}