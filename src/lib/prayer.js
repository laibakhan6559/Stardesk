import { Coordinates, CalculationMethod, Madhab, PrayerTimes, Qibla } from 'adhan'

// Prayer times are calculated on the device with the `adhan` library, so they work offline.

export const METHODS = [
  ['Karachi', 'Karachi – Univ. of Islamic Sciences (Pakistan)'],
  ['MuslimWorldLeague', 'Muslim World League'],
  ['UmmAlQura', 'Umm al-Qura (Makkah)'],
  ['Egyptian', 'Egyptian General Authority'],
  ['NorthAmerica', 'ISNA (North America)'],
  ['Dubai', 'Dubai'],
  ['Turkey', 'Turkey (Diyanet)'],
]

export const PK_CITIES = [
  ['Islamabad', 33.6844, 73.0479],
  ['Rawalpindi', 33.5651, 73.0169],
  ['Lahore', 31.5204, 74.3587],
  ['Karachi', 24.8607, 67.0011],
  ['Peshawar', 34.0151, 71.5249],
  ['Quetta', 30.1798, 66.975],
  ['Faisalabad', 31.4504, 73.135],
  ['Multan', 30.1575, 71.5249],
  ['Hyderabad', 25.396, 68.3578],
  ['Sialkot', 32.4945, 74.5229],
  ['Gujranwala', 32.1877, 74.1945],
  ['Abbottabad', 34.1688, 73.2215],
  ['Muzaffarabad', 34.37, 73.4711],
  ['Gilgit', 35.9208, 74.3144],
  ['Bahawalpur', 29.3544, 71.6911],
  ['Sukkur', 27.7052, 68.8574],
].map(([name, lat, lon]) => ({ name, lat, lon, tz: 'Asia/Karachi' }))

const ORDER = [
  ['fajr', 'Fajr', true],
  ['sunrise', 'Sunrise', false],
  ['dhuhr', 'Dhuhr', true],
  ['asr', 'Asr', true],
  ['maghrib', 'Maghrib', true],
  ['isha', 'Isha', true],
]

export function prayerTimes(place, date = new Date(), { method = 'Karachi', madhab = 'hanafi' } = {}) {
  const params = (CalculationMethod[method] || CalculationMethod.Karachi)()
  params.madhab = madhab === 'shafi' ? Madhab.Shafi : Madhab.Hanafi
  const pt = new PrayerTimes(new Coordinates(place.lat, place.lon), date, params)
  return ORDER.map(([id, label, prayer]) => ({ id, label, prayer, time: pt[id] }))
}

// The next prayer after `now` (tomorrow's Fajr after Isha).
export function nextPrayer(place, now = new Date(), opts) {
  const today = prayerTimes(place, now, opts).filter((p) => p.prayer)
  const hit = today.find((p) => p.time > now)
  if (hit) return { ...hit, tomorrow: false }
  const tmr = new Date(now)
  tmr.setDate(tmr.getDate() + 1)
  return { ...prayerTimes(place, tmr, opts)[0], tomorrow: true }
}

export const qiblaBearing = (place) => Math.round(Qibla(new Coordinates(place.lat, place.lon)))

export const optsFrom = (settings) => ({ method: settings.prayerMethod, madhab: settings.prayerMadhab })

export function fmtAt(date, tz) {
  try {
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz }).format(date)
  } catch {
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date)
  }
}

export function untilText(ms) {
  const m = Math.max(0, Math.round(ms / 60000))
  const h = Math.floor(m / 60)
  return h > 0 ? `${h}h ${m % 60}m` : `${m} min`
}