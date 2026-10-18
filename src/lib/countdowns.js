import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { ISLAMIC_DATES, upcomingIslamic } from './hijri'
import { nextOccurrence, occInfo } from './daily'

// Merges the user's own dates (keyDates) with the Islamic dates they switched on.
// Returns upcoming items sorted by date: { id, title, emoji, date, n, kind }
export function buildCountdowns(data, today = new Date()) {
  const adj = data.settings.hijriAdj || 0
  const on = new Set(data.cd?.islamic || [])
  const isl = upcomingIslamic(adj, today)
  const out = []
  for (const [id, label, emoji] of ISLAMIC_DATES) {
    if (on.has(id) && isl[id]) out.push({ id: `i:${id}`, title: label, emoji, date: isl[id], kind: 'islamic' })
  }
  // trips (step 4) and birthdays / anniversaries (step 4)
  for (const t of data.trips || []) if (t.start) out.push({ id: `t:${t.id}`, title: t.name, emoji: t.emoji || '✈️', date: t.start, kind: 'trip' })
  for (const b of data.birthdays || []) {
    const o = nextOccurrence(b, today)
    if (o && o.n <= 90) out.push({ id: `b:${b.id}`, title: `${b.name}${b.kind === 'birthday' ? '’s birthday' : b.kind === 'anniversary' ? '’s anniversary' : ''}`, emoji: occInfo(b.kind)[2], date: format(o.date, 'yyyy-MM-dd'), kind: 'birthday' })
  }
  for (const k of data.keyDates) out.push({ id: k.id, title: k.title, emoji: k.emoji || (k.type === 'exam' ? '📝' : '⭐'), date: k.date, kind: 'mine', key: k })
  return out
    .map((c) => ({ ...c, n: differenceInCalendarDays(parseISO(c.date), today) }))
    .filter((c) => c.n >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))
}

export const daysText = (n) => (n === 0 ? 'Today!' : n === 1 ? 'Tomorrow' : `${n} days to go`)