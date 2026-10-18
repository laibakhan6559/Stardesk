import { format, parseISO } from 'date-fns'
import { PageTitle, Win } from '../components/ui'
import PlacePicker from '../components/PlacePicker'
import { useStore } from '../lib/store'
import { useWeather, wmo } from '../lib/weather'

export default function Weather() {
  const { data } = useStore()
  const { place } = data
  const w = useWeather(place)
  const d = w.data
  const [emoji, label] = d ? wmo(d.now.code) : ['', '']

  return (
    <>
      <PageTitle
        sub={`Live weather for ${place.name}, from Open-Meteo.`}
        right={
          <button className="btn small ghost" onClick={w.refresh} disabled={w.loading}>
            {w.loading ? 'Updating…' : '↻ Refresh'}
          </button>
        }
      >
        Weather
      </PageTitle>
      <div className="grid12">
        <div className="c8 stack-lg">
          <Win title={`Now in ${place.name}`}>
            {w.loading && !d && <p className="muted">Loading…</p>}
            {w.error && !d && <p className="muted">Could not load the weather. Check your internet connection and tap Refresh.</p>}
            {d && (
              <>
                <div className="wx-big">
                  <span className="wx-ico big">{emoji}</span>
                  <div>
                    <b className="wx-temp big">{d.now.temp}°C</b>
                    <p className="small">{label}</p>
                  </div>
                </div>
                <ul className="stats">
                  <li>
                    <b>{d.now.feels}°</b>
                    <span>feels like</span>
                  </li>
                  <li>
                    <b>{d.now.humidity}%</b>
                    <span>humidity</span>
                  </li>
                  <li>
                    <b>{d.now.wind}</b>
                    <span>km/h wind</span>
                  </li>
                </ul>
                {w.stale && <p className="hint">You are offline – showing the last saved weather ({new Date(w.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}).</p>}
              </>
            )}
          </Win>

          {d && (
            <Win title="Next 5 days">
              <ul className="forecast">
                {d.days.map((x, i) => (
                  <li key={x.date}>
                    <b>{i === 0 ? 'Today' : format(parseISO(x.date), 'EEE')}</b>
                    <span className="wx-ico">{wmo(x.code)[0]}</span>
                    <span>
                      {x.hi}° <small className="muted">{x.lo}°</small>
                    </span>
                    <small className="muted">💧 {x.rain}%</small>
                  </li>
                ))}
              </ul>
            </Win>
          )}
        </div>
        <div className="c4">
          <Win title="Location">
            <PlacePicker />
          </Win>
        </div>
      </div>
    </>
  )
}