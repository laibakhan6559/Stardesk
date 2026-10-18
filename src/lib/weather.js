import { useCallback, useEffect, useRef, useState } from 'react'

// Weather comes from Open-Meteo (free, no API key). The last result is cached in
// localStorage (separately from your planner data) so Home still shows something offline.
const CACHE = 'stardesk:weather'
const TTL = 30 * 60 * 1000

const WMO = {
  0: ['☀️', 'Clear sky'],
  1: ['🌤️', 'Mostly clear'],
  2: ['⛅', 'Partly cloudy'],
  3: ['☁️', 'Cloudy'],
  45: ['🌫️', 'Fog'],
  48: ['🌫️', 'Rime fog'],
  51: ['🌦️', 'Light drizzle'],
  53: ['🌦️', 'Drizzle'],
  55: ['🌧️', 'Heavy drizzle'],
  56: ['🌧️', 'Freezing drizzle'],
  57: ['🌧️', 'Freezing drizzle'],
  61: ['🌧️', 'Light rain'],
  63: ['🌧️', 'Rain'],
  65: ['🌧️', 'Heavy rain'],
  66: ['🌧️', 'Freezing rain'],
  67: ['🌧️', 'Freezing rain'],
  71: ['🌨️', 'Light snow'],
  73: ['🌨️', 'Snow'],
  75: ['❄️', 'Heavy snow'],
  77: ['🌨️', 'Snow grains'],
  80: ['🌦️', 'Rain showers'],
  81: ['🌧️', 'Rain showers'],
  82: ['⛈️', 'Violent showers'],
  85: ['🌨️', 'Snow showers'],
  86: ['🌨️', 'Snow showers'],
  95: ['⛈️', 'Thunderstorm'],
  96: ['⛈️', 'Thunderstorm, hail'],
  99: ['⛈️', 'Thunderstorm, hail'],
}
export const wmo = (code) => WMO[code] || ['🌡️', 'Unknown']

const keyOf = (p) => `${p.lat.toFixed(2)},${p.lon.toFixed(2)}`

const readCache = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHE) || 'null')
  } catch {
    return null
  }
}

export function parseWeather(j) {
  const c = j.current
  const d = j.daily
  return {
    now: {
      temp: Math.round(c.temperature_2m),
      feels: Math.round(c.apparent_temperature),
      humidity: Math.round(c.relative_humidity_2m),
      wind: Math.round(c.wind_speed_10m),
      code: c.weather_code,
      day: c.is_day === 1,
    },
    days: d.time.map((t, i) => ({
      date: t,
      code: d.weather_code[i],
      hi: Math.round(d.temperature_2m_max[i]),
      lo: Math.round(d.temperature_2m_min[i]),
      rain: d.precipitation_probability_max?.[i] ?? 0,
    })),
  }
}

export async function loadWeather(place, { force = false } = {}) {
  const key = keyOf(place)
  const cached = readCache()
  const same = cached && cached.key === key
  if (same && !force && Date.now() - cached.at < TTL) return { data: cached.data, at: cached.at, stale: false }
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}` +
    '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day' +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=5'
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(String(res.status))
    const data = parseWeather(await res.json())
    const at = Date.now()
    try {
      localStorage.setItem(CACHE, JSON.stringify({ key, at, data }))
    } catch {
      /* ignore */
    }
    return { data, at, stale: false }
  } catch (err) {
    if (same) return { data: cached.data, at: cached.at, stale: true }
    throw err
  }
}

export function useWeather(place) {
  const [state, setState] = useState({ data: null, at: 0, stale: false, loading: true, error: false })
  const run = useRef(0)
  const load = useCallback(
    (force = false) => {
      const id = ++run.current
      setState((s) => ({ ...s, loading: true, error: false }))
      loadWeather(place, { force })
        .then((r) => id === run.current && setState({ ...r, loading: false, error: false }))
        .catch(() => id === run.current && setState((s) => ({ ...s, data: null, loading: false, error: true })))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [place.lat, place.lon]
  )
  useEffect(() => {
    load(false)
    const on = () => load(false)
    window.addEventListener('online', on)
    return () => window.removeEventListener('online', on)
  }, [load])
  return { ...state, refresh: () => load(true) }
}

// City search (Open-Meteo geocoding, also free / no key).
export async function searchCities(q) {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`)
  if (!res.ok) throw new Error('search failed')
  const j = await res.json()
  return (j.results || []).map((r) => ({
    name: r.name,
    sub: [r.admin1, r.country].filter(Boolean).join(', '),
    lat: r.latitude,
    lon: r.longitude,
    tz: r.timezone || 'UTC',
  }))
}