import { addDays } from 'date-fns'
import { ymd } from './dates'

// Hijri dates come from the browser's built-in Umm al-Qura calendar (works offline).
// Pakistan follows local moon sighting, which is often a day later, so every function
// takes `adj` = days to shift (-2 .. +2, set in the Prayer times app).
const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric' })

export const HIJRI_MONTHS = ['Muharram', 'Safar', 'Rabi ul Awwal', 'Rabi ul Thani', 'Jumada ul Awwal', 'Jumada ul Thani', 'Rajab', 'Shaban', 'Ramadan', 'Shawwal', 'Dhul Qadah', 'Dhul Hijjah']

export function hijriParts(date = new Date(), adj = 0) {
  const d = new Date(date)
  d.setDate(d.getDate() + (adj || 0))
  const o = {}
  for (const p of fmt.formatToParts(d)) if (p.type !== 'literal') o[p.type] = p.value
  return { day: Number(o.day), month: Number(o.month), year: Number(o.year) }
}

export function formatHijri(date = new Date(), adj = 0) {
  try {
    const h = hijriParts(date, adj)
    return `${h.day} ${HIJRI_MONTHS[h.month - 1]} ${h.year} AH`
  } catch {
    return ''
  }
}

// [id, label, emoji, hijri month, hijri day]
export const ISLAMIC_DATES = [
  ['ramadan', 'Ramadan begins', '🌙', 9, 1],
  ['eid-fitr', 'Eid ul Fitr', '🎉', 10, 1],
  ['arafah', 'Youm-e-Arafah', '⛰️', 12, 9],
  ['eid-adha', 'Eid ul Adha', '🐑', 12, 10],
  ['hijri-new-year', 'Islamic New Year', '✨', 1, 1],
  ['ashura', 'Ashura (10 Muharram)', '🤲', 1, 10],
  ['shab-e-barat', 'Shab-e-Barat', '🌕', 8, 15],
  ['mawlid', '12 Rabi ul Awwal', '💚', 3, 12],
]

const cache = new Map()

// Next Gregorian date (yyyy-MM-dd) for each Islamic date, looking up to ~13 months ahead.
export function upcomingIslamic(adj = 0, from = new Date()) {
  const key = `${adj}|${ymd(from)}`
  if (cache.has(key)) return cache.get(key)
  const out = {}
  try {
    for (let i = 0; i < 400; i++) {
      const d = addDays(from, i)
      const h = hijriParts(d, adj)
      for (const [id, , , m, day] of ISLAMIC_DATES) if (!out[id] && h.month === m && h.day === day) out[id] = ymd(d)
    }
  } catch {
    /* Intl calendar unsupported - no Islamic countdowns */
  }
  cache.clear()
  cache.set(key, out)
  return out
}