import { addDays, differenceInCalendarDays, endOfMonth, format, getDay, isValid, parseISO, startOfMonth, startOfWeek } from 'date-fns'
import { ymd } from './dates'

// Pure helpers for the Health apps (water & sleep, workout, medicine, cycle, breathing, mood).
// No React in here.

export const lastDays = (n, from = new Date()) => Array.from({ length: n }, (_, i) => addDays(from, i - (n - 1)))

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
export const validTime = (t) => typeof t === 'string' && TIME_RE.test(t)
const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))

/* ============================ water & sleep ============================ */

export const GLASS_ML = [150, 200, 250, 300, 500]
export const waterCount = (water, ds) => Math.max(0, Number(water?.log?.[ds]) || 0)

// Bed time -> wake time in minutes (a night crosses midnight, so wake <= bed means "next day").
export function sleepMins(bed, wake) {
  if (!validTime(bed) || !validTime(wake)) return 0
  let d = toMin(wake) - toMin(bed)
  if (d <= 0) d += 1440
  return d
}
export const sleepFor = (sleep, ds) => {
  const e = sleep?.log?.[ds]
  return e ? sleepMins(e.bed, e.wake) : 0
}
export const fmtDur = (min) => `${Math.floor(min / 60)}h ${String(Math.round(min % 60)).padStart(2, '0')}m`
export const hoursOf = (min) => Math.round((min / 60) * 10) / 10

/* ============================ workouts ============================ */

export const EXERCISES = ['Push-ups', 'Squats', 'Lunges', 'Pull-ups', 'Crunches', 'Burpees', 'Bench press', 'Deadlift', 'Shoulder press', 'Bicep curls', 'Dumbbell rows', 'Leg press']
export const CARDIO = ['Walking', 'Running', 'Cycling', 'Skipping rope', 'Swimming', 'Plank', 'Yoga', 'Football / cricket']

export const setsVolume = (sets) => (sets || []).reduce((a, s) => a + (Number(s.reps) || 0) * (Number(s.kg) || 0), 0)
export const setLine = (sets) => {
  if (!sets?.length) return ''
  const same = sets.every((s) => s.reps === sets[0].reps && s.kg === sets[0].kg)
  const w = (s) => (s.kg ? ` @ ${s.kg}kg` : '')
  return same ? `${sets.length} × ${sets[0].reps}${w(sets[0])}` : sets.map((s) => `${s.reps}${w(s)}`).join(' · ')
}

// The most recent earlier entry for the same exercise (for the "last time" hint).
export function lastTime(workouts, name, beforeDate) {
  const n = name.trim().toLowerCase()
  if (!n) return null
  return (
    [...workouts]
      .filter((w) => w.name.toLowerCase() === n && w.date < beforeDate)
      .sort((a, b) => b.date.localeCompare(a.date))[0] || null
  )
}

// Heaviest set ever (or most reps for bodyweight) per strength exercise.
export function personalBests(workouts) {
  const best = {}
  for (const w of workouts) {
    if (w.type === 'cardio') continue
    for (const s of w.sets || []) {
      const key = w.name
      const score = (Number(s.kg) || 0) * 1000 + (Number(s.reps) || 0)
      if (!best[key] || score > best[key].score) best[key] = { name: w.name, kg: Number(s.kg) || 0, reps: Number(s.reps) || 0, date: w.date, score }
    }
  }
  return Object.values(best).sort((a, b) => b.score - a.score)
}

// Last n calendar weeks (oldest first): days trained, sets, volume, cardio minutes.
export function weeklyStats(workouts, n = 8, today = new Date(), weekStart = 1) {
  const start = startOfWeek(today, { weekStartsOn: weekStart })
  return Array.from({ length: n }, (_, i) => {
    const from = addDays(start, (i - (n - 1)) * 7)
    const a = ymd(from)
    const b = ymd(addDays(from, 6))
    const rows = workouts.filter((w) => w.date >= a && w.date <= b)
    return {
      from,
      label: format(from, 'd MMM'),
      days: new Set(rows.map((r) => r.date)).size,
      sets: rows.reduce((t, r) => t + (r.type === 'cardio' ? 0 : r.sets?.length || 0), 0),
      volume: Math.round(rows.reduce((t, r) => t + setsVolume(r.sets), 0)),
      cardio: rows.reduce((t, r) => t + (r.type === 'cardio' ? Number(r.min) || 0 : 0), 0),
    }
  })
}

/* ============================ medicine ============================ */

export const MED_EMOJI = ['💊', '💉', '🧴', '👁️', '🫁', '🩹', '🌿']
export const MED_FREQ = [
  ['once', 'Once a day', ['08:00']],
  ['twice', 'Twice a day', ['08:00', '20:00']],
  ['thrice', 'Three times a day', ['08:00', '14:00', '21:00']],
  ['custom', 'Custom times', null],
]
export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]
export const medDays = (m) => (Array.isArray(m.dow) && m.dow.length ? m.dow : ALL_DAYS)
export const isTaken = (m, ds, time) => !!m.taken?.[ds]?.[time]

// Every dose scheduled for date d, sorted by time, with a status for "now".
export function dosesOn(meds, d = new Date(), now = new Date()) {
  const ds = ymd(d)
  const out = []
  for (const m of meds) {
    if (m.paused || !medDays(m).includes(getDay(d))) continue
    for (const time of m.times || []) {
      if (!validTime(time)) continue
      const taken = isTaken(m, ds, time)
      const at = new Date(`${ds}T${time}:00`)
      const late = (now - at) / 60000
      const status = taken ? 'taken' : late > 90 ? 'missed' : late >= 0 ? 'due' : 'later'
      out.push({ m, time, ds, taken, status, key: `${m.id}|${time}` })
    }
  }
  return out.sort((a, b) => a.time.localeCompare(b.time) || a.m.name.localeCompare(b.m.name))
}

// Share of doses taken over the last n days (today only counts doses that are already due).
export function adherence(meds, n = 7, now = new Date()) {
  let planned = 0
  let taken = 0
  for (const d of lastDays(n, now)) {
    for (const r of dosesOn(meds, d, now)) {
      if (r.status === 'later') continue
      planned++
      if (r.taken) taken++
    }
  }
  return { planned, taken, pct: planned ? Math.round((taken / planned) * 100) : null }
}

/* ============================ cycle ============================ */

const okDate = (s) => typeof s === 'string' && isValid(parseISO(s))

export function cycleInfo(c, today = new Date()) {
  const periods = (c.periods || []).filter((p) => okDate(p.start)).sort((a, b) => a.start.localeCompare(b.start))
  const starts = periods.map((p) => parseISO(p.start))
  const gaps = starts
    .slice(1)
    .map((d, i) => differenceInCalendarDays(d, starts[i]))
    .filter((g) => g >= 15 && g <= 60)
    .slice(-6)
  const avg = gaps.length ? Math.round(gaps.reduce((a, g) => a + g, 0) / gaps.length) : c.cycleLen || 28
  const lens = periods
    .filter((p) => okDate(p.end) && p.end >= p.start)
    .map((p) => differenceInCalendarDays(parseISO(p.end), parseISO(p.start)) + 1)
    .filter((n) => n >= 1 && n <= 12)
    .slice(-6)
  const plen = lens.length ? Math.round(lens.reduce((a, g) => a + g, 0) / lens.length) : c.periodLen || 5
  const last = periods[periods.length - 1]
  const base = { periods, avg, plen, learned: gaps.length > 0 }
  if (!last) return { ...base, empty: true }
  const lastStart = parseISO(last.start)
  const next = addDays(lastStart, avg)
  const ongoing = !last.end && differenceInCalendarDays(today, lastStart) < Math.max(plen + 3, 8)
  return {
    ...base,
    last,
    lastStart,
    next,
    n: differenceInCalendarDays(next, today),
    day: differenceInCalendarDays(today, lastStart) + 1,
    ongoing,
  }
}

// yyyy-MM-dd strings for the days of every logged period, and for the next 3 predicted ones.
export function cycleDays(c, info) {
  const logged = new Set()
  for (const p of info.periods) {
    const a = parseISO(p.start)
    const len = okDate(p.end) && p.end >= p.start ? differenceInCalendarDays(parseISO(p.end), a) + 1 : info.plen
    for (let i = 0; i < Math.min(len, 14); i++) logged.add(ymd(addDays(a, i)))
  }
  const predicted = new Set()
  if (info.lastStart) {
    for (let k = 1; k <= 3; k++) {
      for (let i = 0; i < info.plen; i++) {
        const ds = ymd(addDays(info.lastStart, info.avg * k + i))
        if (!logged.has(ds)) predicted.add(ds)
      }
    }
  }
  return { logged, predicted }
}

export const CYCLE_REMIND = [
  [-1, 'Off'],
  [0, 'On the day'],
  [1, '1 day before'],
  [2, '2 days before'],
  [3, '3 days before'],
]

/* ============================ mood ============================ */

export const MOODS = [
  ['😞', 'Rough'],
  ['😕', 'Meh'],
  ['😐', 'Okay'],
  ['🙂', 'Good'],
  ['😄', 'Great'],
]

// Calendar cells for a month: null for padding, Date for real days. Always whole weeks.
export function monthCells(month, weekStart = 1) {
  const first = startOfMonth(month)
  const lead = (getDay(first) - weekStart + 7) % 7
  const total = endOfMonth(month).getDate()
  const cells = [...Array(lead).fill(null), ...Array.from({ length: total }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))]
  while (cells.length % 7) cells.push(null)
  return cells
}
export const weekdayHeads = (weekStart = 1) => Array.from({ length: 7 }, (_, i) => ['S', 'M', 'T', 'W', 'T', 'F', 'S'][(i + weekStart) % 7])

export function moodMonth(mood, notes, month) {
  const prefix = format(month, 'yyyy-MM')
  const days = Object.entries(mood || {}).filter(([d, v]) => d.startsWith(prefix) && v >= 1 && v <= 5)
  const counts = [0, 0, 0, 0, 0]
  let sum = 0
  for (const [, v] of days) {
    counts[v - 1]++
    sum += v
  }
  const written = Object.keys(notes || {}).filter((d) => d.startsWith(prefix) && notes[d]).length
  return { n: days.length, avg: days.length ? sum / days.length : 0, counts, written }
}

// Consecutive days (ending today, or yesterday if today is still empty) with a mood saved.
export function moodStreak(mood, today = new Date()) {
  let d = today
  if (!mood?.[ymd(d)]) d = addDays(d, -1)
  let n = 0
  while (mood?.[ymd(d)]) {
    n++
    d = addDays(d, -1)
  }
  return n
}

/* ============================ breathing ============================ */

// steps: [phase, seconds]
export const PATTERNS = [
  { id: 'box', label: 'Box 4·4·4·4', hint: 'Steady and focusing', steps: [['in', 4], ['hold', 4], ['out', 4], ['hold', 4]] },
  { id: '478', label: 'Relax 4·7·8', hint: 'Slow down before sleep', steps: [['in', 4], ['hold', 7], ['out', 8]] },
  { id: 'calm', label: 'Calm 5·5', hint: 'Simple and gentle', steps: [['in', 5], ['out', 5]] },
  { id: 'long', label: 'Long exhale 4·6', hint: 'Eases stress and nerves', steps: [['in', 4], ['out', 6]] },
]
export const patternById = (id) => PATTERNS.find((p) => p.id === id) || PATTERNS[0]
export const DURATIONS = [1, 3, 5, 10]
export const PHASE_TEXT = { in: 'Breathe in', hold: 'Hold', out: 'Breathe out' }

// Where are we `sec` seconds into a pattern? Returns phase, seconds left in it and orb size (0 small .. 1 big).
export function breathState(pattern, sec) {
  const total = pattern.steps.reduce((a, s) => a + s[1], 0)
  let t = sec % total
  let size = 0
  for (const [phase, len] of pattern.steps) {
    if (t < len) {
      const p = t / len
      const cur = phase === 'in' ? p : phase === 'out' ? 1 - p : size
      return { phase, left: Math.ceil(len - t), size: phase === 'hold' ? size : cur }
    }
    t -= len
    size = phase === 'in' ? 1 : phase === 'out' ? 0 : size
  }
  return { phase: 'in', left: 0, size: 0 }
}