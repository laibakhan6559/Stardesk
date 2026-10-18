import { addDays, differenceInCalendarDays, format, getDay, parseISO } from 'date-fns'

export const ymd = (d) => format(d, 'yyyy-MM-dd')
export const todayStr = () => ymd(new Date())

export const CATS = {
  study: { label: 'Study', color: '#7f9bf0', emoji: '📚' },
  class: { label: 'Class', color: '#b58cf5', emoji: '🎓' },
  exam: { label: 'Exam', color: '#ff5d7a', emoji: '📝' },
  personal: { label: 'Personal', color: '#ff6fb0', emoji: '🌸' },
  work: { label: 'Work', color: '#f5b84b', emoji: '💼' },
  health: { label: 'Health', color: '#59c98d', emoji: '🍀' },
  fun: { label: 'Fun', color: '#3fc7e0', emoji: '🎮' },
}

export const REMINDERS = [
  [-1, 'No reminder'],
  [0, 'At time of event'],
  [5, '5 minutes before'],
  [10, '10 minutes before'],
  [30, '30 minutes before'],
  [60, '1 hour before'],
  [180, '3 hours before'],
  [1440, '1 day before'],
]

export const REPEATS = [
  ['none', 'Does not repeat'],
  ['daily', 'Every day'],
  ['weekdays', 'Weekdays (Mon–Fri)'],
  ['weekly', 'Every week'],
  ['monthly', 'Every month'],
]

export const PRIORITIES = {
  1: { label: 'Low', color: '#59c98d' },
  2: { label: 'Medium', color: '#f5b84b' },
  3: { label: 'High', color: '#ff5d7a' },
}

export function occursOn(ev, ds) {
  if (ev.date === ds) return true
  if (!ev.repeat || ev.repeat === 'none' || ds < ev.date) return false
  const a = parseISO(ev.date)
  const b = parseISO(ds)
  switch (ev.repeat) {
    case 'daily':
      return true
    case 'weekdays': {
      const g = getDay(b)
      return g > 0 && g < 6
    }
    case 'weekly':
      return differenceInCalendarDays(b, a) % 7 === 0
    case 'monthly':
      return a.getDate() === b.getDate()
    default:
      return false
  }
}

export function eventsOn(events, ds) {
  return events
    .filter((e) => occursOn(e, ds))
    .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'))
}

export function classesOn(classes, ds, semester) {
  const dow = getDay(parseISO(ds))
  return classes
    .filter((c) => c.semester === semester && c.days.includes(dow))
    .sort((a, b) => a.start.localeCompare(b.start))
}

export function dayItems(data, ds) {
  return {
    events: eventsOn(data.events, ds),
    classes: classesOn(data.classes, ds, data.settings.semester),
    keys: data.keyDates.filter((k) => k.date === ds),
    tasks: data.tasks.filter((t) => t.due === ds),
  }
}

export function countdown(ds) {
  const n = differenceInCalendarDays(parseISO(ds), new Date())
  if (n === 0) return { text: 'Today!', tone: 'hot', n }
  if (n === 1) return { text: 'Tomorrow', tone: 'hot', n }
  if (n > 1) return { text: `in ${n} days`, tone: n <= 7 ? 'soon' : 'far', n }
  if (n === -1) return { text: 'Yesterday', tone: 'past', n }
  return { text: `${-n} days ago`, tone: 'past', n }
}

export function fmtTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return format(d, 'h:mm a')
}

export const lastNDays = (n, from = new Date()) =>
  Array.from({ length: n }, (_, i) => ymd(addDays(from, i - (n - 1))))

export function greeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Still up'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 22) return 'Good evening'
  return 'Good night'
}
