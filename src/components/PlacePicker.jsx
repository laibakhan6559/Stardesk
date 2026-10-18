import { useState } from 'react'
import { Field } from './ui'
import { PK_CITIES } from '../lib/prayer'
import { searchCities } from '../lib/weather'
import { deviceTz } from '../lib/zones'
import { useStore } from '../lib/store'

// One shared "where am I" for prayer times and weather.
export default function PlacePicker() {
  const { data, set, toast } = useStore()
  const place = data.place
  const [q, setQ] = useState('')
  const [found, setFound] = useState([])
  const [busy, setBusy] = useState(false)
  const preset = PK_CITIES.find((c) => c.name === place.name && c.lat === place.lat)

  const choose = (p) => {
    set('place', { name: p.name, lat: p.lat, lon: p.lon, tz: p.tz })
    setFound([])
    setQ('')
  }

  const locate = () => {
    if (!navigator.geolocation) return toast('This browser cannot share your location.', 'info')
    setBusy(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false)
        choose({ name: 'My location', lat: +pos.coords.latitude.toFixed(4), lon: +pos.coords.longitude.toFixed(4), tz: deviceTz() })
        toast('Location set 📍', 'ok')
      },
      () => {
        setBusy(false)
        toast('Could not get your location – pick a city instead.', 'info')
      },
      { timeout: 10000, maximumAge: 600000 }
    )
  }

  const search = async (e) => {
    e.preventDefault()
    if (q.trim().length < 2) return
    setBusy(true)
    try {
      const r = await searchCities(q.trim())
      setFound(r)
      if (!r.length) toast('No city found – try another spelling.', 'info')
    } catch {
      toast('City search needs internet. Pick a Pakistani city from the list instead.', 'info')
    }
    setBusy(false)
  }

  return (
    <div className="form">
      <p className="small">
        📍 Now using <b>{place.name}</b> <span className="muted tiny">({place.lat.toFixed(2)}, {place.lon.toFixed(2)})</span>
      </p>
      <Field label="Pakistani cities (work offline)">
        <select
          value={preset ? preset.name : ''}
          onChange={(e) => {
            const c = PK_CITIES.find((x) => x.name === e.target.value)
            if (c) choose(c)
          }}
        >
          {!preset && <option value="">{place.name}</option>}
          {PK_CITIES.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <button type="button" className="btn small ghost" onClick={locate} disabled={busy}>
        📍 Use my current location
      </button>
      <form className="row" onSubmit={search}>
        <input className="grow" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search any city (needs internet)" aria-label="Search any city" />
        <button className="btn small" type="submit" disabled={busy}>
          Search
        </button>
      </form>
      {found.length > 0 && (
        <ul className="results">
          {found.map((r, i) => (
            <li key={i}>
              <button type="button" onClick={() => choose(r)}>
                <span>{r.name}</span>
                <em>{r.sub}</em>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function HijriAdjust() {
  const { data, setSetting } = useStore()
  return (
    <Field label="Hijri date adjustment (moon sighting)">
      <select value={data.settings.hijriAdj || 0} onChange={(e) => setSetting('hijriAdj', Number(e.target.value))}>
        {[-2, -1, 0, 1, 2].map((n) => (
          <option key={n} value={n}>
            {n === 0 ? 'No adjustment (Umm al-Qura)' : `${n > 0 ? '+' : ''}${n} day${Math.abs(n) === 1 ? '' : 's'}`}
          </option>
        ))}
      </select>
    </Field>
  )
}