// Curated cities for the World clock (any IANA zone also works through the "other" box).
export const CITIES = [
  ['Karachi / Islamabad', 'Asia/Karachi'],
  ['Dubai', 'Asia/Dubai'],
  ['Makkah / Riyadh', 'Asia/Riyadh'],
  ['Doha', 'Asia/Qatar'],
  ['Kuwait', 'Asia/Kuwait'],
  ['Tehran', 'Asia/Tehran'],
  ['Istanbul', 'Europe/Istanbul'],
  ['Cairo', 'Africa/Cairo'],
  ['Lagos', 'Africa/Lagos'],
  ['Nairobi', 'Africa/Nairobi'],
  ['Johannesburg', 'Africa/Johannesburg'],
  ['London', 'Europe/London'],
  ['Paris', 'Europe/Paris'],
  ['Berlin', 'Europe/Berlin'],
  ['Madrid', 'Europe/Madrid'],
  ['Rome', 'Europe/Rome'],
  ['Moscow', 'Europe/Moscow'],
  ['New York', 'America/New_York'],
  ['Chicago', 'America/Chicago'],
  ['Denver', 'America/Denver'],
  ['Los Angeles', 'America/Los_Angeles'],
  ['Toronto', 'America/Toronto'],
  ['Vancouver', 'America/Vancouver'],
  ['Mexico City', 'America/Mexico_City'],
  ['São Paulo', 'America/Sao_Paulo'],
  ['Delhi / Mumbai', 'Asia/Kolkata'],
  ['Dhaka', 'Asia/Dhaka'],
  ['Colombo', 'Asia/Colombo'],
  ['Bangkok', 'Asia/Bangkok'],
  ['Kuala Lumpur', 'Asia/Kuala_Lumpur'],
  ['Singapore', 'Asia/Singapore'],
  ['Hong Kong', 'Asia/Hong_Kong'],
  ['Shanghai', 'Asia/Shanghai'],
  ['Tokyo', 'Asia/Tokyo'],
  ['Seoul', 'Asia/Seoul'],
  ['Sydney', 'Australia/Sydney'],
  ['Auckland', 'Pacific/Auckland'],
]

export const deviceTz = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

export const validTz = (tz) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

export function timeIn(tz, date = new Date()) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz }).format(date)
}
export function dateIn(tz, date = new Date()) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', day: 'numeric', month: 'short', timeZone: tz }).format(date)
}

// "wall clock" of a zone expressed as a UTC timestamp, to compare zones with each other.
function wall(tz, date) {
  const o = {}
  for (const p of new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }).formatToParts(date)) o[p.type] = Number(p.value)
  return Date.UTC(o.year, o.month - 1, o.day, o.hour, o.minute, o.second)
}

// How `tz` compares with the device's own zone: minutes ahead (+) / behind (-), and calendar day difference.
export function compareToLocal(tz, date = new Date()) {
  const a = wall(tz, date)
  const b = wall(deviceTz(), date)
  const min = Math.round((a - b) / 60000)
  const day = Math.round((Math.floor(a / 86400000) * 86400000 - Math.floor(b / 86400000) * 86400000) / 86400000)
  return { min, day }
}

export function offsetText({ min, day }) {
  const dayTxt = day === 1 ? 'tomorrow' : day === -1 ? 'yesterday' : 'today'
  if (min === 0) return 'same time as you'
  const a = Math.abs(min)
  const h = Math.floor(a / 60)
  const m = a % 60
  const span = `${h}h${m ? ` ${m}m` : ''}`
  return `${span} ${min > 0 ? 'ahead' : 'behind'} · ${dayTxt}`
}