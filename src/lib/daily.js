import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarWeeks,
  endOfMonth,
  format,
  isValid,
  parseISO,
  startOfWeek,
} from 'date-fns'
import { ymd } from './dates'

// Pure helpers for the Daily-life apps (meals, lists, chores, budget, bills, birthdays, travel).
// No React in here, so everything can be tested on its own.

export const money = (n, cur = 'Rs') => `${cur} ${Math.round(Number(n) || 0).toLocaleString('en-US')}`

/* ============================ meals ============================ */

export const MEAL_SLOTS = [
  ['b', 'Breakfast', '🍳'],
  ['l', 'Lunch', '🍛'],
  ['d', 'Dinner', '🍲'],
]

export const DISH_IDEAS = [
  'Potato paratha + tea',
  'Egg omelette + paratha',
  'Halwa puri',
  'Lentils & rice',
  'Chicken biryani',
  'Potato & mutton curry',
  'Chicken karahi',
  'Minced meat & peas',
  'Spinach paneer + flatbread',
  'Vegetable curry + flatbread',
  'Chickpea pulao + raita',
  'Kadhi pakora + rice',
  'Nihari',
  'Chapli kabab + naan',
  'Macaroni / pasta',
  'Khichdi + pickle',
  'Mixed lentils + flatbread',
  'Okra curry + flatbread',
  'Potato & cauliflower + flatbread',
  'Chicken pulao',
]

export const weekDays = (anchor, weekStart = 1) => {
  const s = startOfWeek(anchor, { weekStartsOn: weekStart })
  return Array.from({ length: 7 }, (_, i) => addDays(s, i))
}

// Picks a stable "random" dish for a date, so the suggestion does not change on every render.
export const suggestDish = (ds, salt = 0) => {
  let h = salt
  for (const ch of ds) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return DISH_IDEAS[h % DISH_IDEAS.length]
}

/* ============================ lists ============================ */

export const LIST_TEMPLATES = [
  {
    name: 'Travel packing',
    emoji: '🧳',
    items: ['ID card / passport', 'Tickets & bookings', 'Phone charger', 'Power bank', 'Cash & cards', 'Medicines', 'Clothes (per day + 1)', 'Toiletries', 'Shoes / sandals', 'Umbrella / jacket', 'Water bottle', 'Snacks'],
  },
  {
    name: 'Monthly groceries',
    emoji: '🛒',
    items: ['Flour (atta)', 'Rice', 'Sugar', 'Cooking oil / ghee', 'Lentils & pulses', 'Tea leaves', 'Salt & spices', 'Milk / milk powder', 'Eggs', 'Onions, potatoes, tomatoes', 'Soap & detergent', 'Tissue / kitchen roll'],
  },
  {
    name: 'Eid shopping',
    emoji: '🌙',
    items: ['Clothes', 'Shoes / sandals', 'Bangles & jewellery', 'Henna (mehndi)', 'Eid money envelopes', 'Sweets / vermicelli ingredients', 'Gifts'],
  },
  {
    name: 'School / uni bag',
    emoji: '🎒',
    items: ['Notebooks', 'Pens & pencils', 'Laptop & charger', 'ID card', 'Water bottle', 'Lunch box'],
  },
]

/* ============================ chores ============================ */

export const CHORE_FREQ = [
  ['daily', 'Every day'],
  ['weekly', 'Every week'],
  ['monthly', 'Every month'],
]

export const CHORE_IDEAS = [
  ['🧹', 'Sweep / clean'],
  ['🍽️', 'Wash dishes'],
  ['👕', 'Do laundry'],
  ['🪴', 'Water the plants'],
  ['🗑️', 'Take out the trash'],
  ['🛏️', 'Make the bed'],
  ['🧽', 'Clean the bathroom'],
  ['🐈', 'Feed the pet'],
]

const EPOCH = new Date(2020, 0, 6) // a Monday

// Which "round" a chore is in (day / week / month number) and the key used to remember it was done.
export function periodOf(freq, d = new Date()) {
  if (freq === 'weekly') return { idx: differenceInCalendarWeeks(d, EPOCH, { weekStartsOn: 1 }), key: `w${format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd')}` }
  if (freq === 'monthly') return { idx: differenceInCalendarMonths(d, EPOCH), key: `m${format(d, 'yyyy-MM')}` }
  return { idx: differenceInCalendarDays(d, EPOCH), key: `d${ymd(d)}` }
}

export function nextPeriodDate(freq, d = new Date()) {
  if (freq === 'weekly') return addDays(startOfWeek(d, { weekStartsOn: 1 }), 7)
  if (freq === 'monthly') return new Date(d.getFullYear(), d.getMonth() + 1, 1)
  return addDays(d, 1)
}

// Who has to do this chore in the round that contains date d.
export function assignee(chore, people, d = new Date()) {
  const who = (chore.who || []).filter((w) => people.includes(w))
  if (!who.length) return ''
  const { idx } = periodOf(chore.freq, d)
  return who[(((idx + (chore.offset || 0)) % who.length) + who.length) % who.length]
}

/* ============================ budget ============================ */

export const EXPENSE_CATS = [
  ['food', 'Food & groceries', '🍽️'],
  ['bills', 'Bills', '🧾'],
  ['transport', 'Transport / petrol', '🚌'],
  ['shopping', 'Shopping', '🛍️'],
  ['health', 'Health', '💊'],
  ['edu', 'Education', '🎓'],
  ['fun', 'Fun & outings', '🎮'],
  ['family', 'Family & gifts', '🎁'],
  ['other', 'Other', '📦'],
]
export const INCOME_CATS = [
  ['salary', 'Salary', '💼'],
  ['freelance', 'Freelance', '🧑‍💻'],
  ['pocket', 'Pocket money', '👛'],
  ['gift', 'Gift / Eid money', '🎁'],
  ['other', 'Other', '📦'],
]
export const catInfo = (type, id) => (type === 'in' ? INCOME_CATS : EXPENSE_CATS).find((c) => c[0] === id) || ['other', 'Other', '📦']

export const monthKey = (d) => format(d, 'yyyy-MM')

export function monthSummary(tx, month) {
  const rows = tx.filter((t) => t.date.startsWith(month))
  const income = rows.filter((t) => t.type === 'in').reduce((a, t) => a + t.amount, 0)
  const spent = rows.filter((t) => t.type === 'out').reduce((a, t) => a + t.amount, 0)
  const byCat = {}
  for (const t of rows) if (t.type === 'out') byCat[t.cat] = (byCat[t.cat] || 0) + t.amount
  return { rows, income, spent, left: income - spent, byCat }
}

// 'ok' | 'near' (80%+) | 'over' for a spent / limit pair.
export const budgetState = (spent, limit) => (!limit ? 'none' : spent > limit ? 'over' : spent >= limit * 0.8 ? 'near' : 'ok')

export function lastMonths(n, from = new Date()) {
  return Array.from({ length: n }, (_, i) => addMonths(from, i - (n - 1)))
}

/* ============================ bills & subscriptions ============================ */

export const BILL_PRESETS = [
  ['Electricity', '💡', 'bill'],
  ['Gas', '🔥', 'bill'],
  ['Water', '🚰', 'bill'],
  ['Internet', '🌐', 'bill'],
  ['Mobile package', '📱', 'bill'],
  ['House rent', '🏠', 'bill'],
  ['Netflix', '🎬', 'sub'],
  ['Spotify', '🎧', 'sub'],
  ['YouTube Premium', '▶️', 'sub'],
  ['ChatGPT / Claude', '🤖', 'sub'],
]

export const REMIND_DAYS = [
  [0, 'On the due day'],
  [1, '1 day before'],
  [3, '3 days before'],
  [5, '5 days before'],
  [7, '1 week before'],
]

// This month's due date (day 31 becomes the last day of shorter months).
export function dueInMonth(day, month) {
  const last = endOfMonth(month).getDate()
  return new Date(month.getFullYear(), month.getMonth(), Math.min(Math.max(1, day), last))
}

// Next thing the user has to pay: this month's date if it is not paid yet, otherwise next month's.
export function nextDue(bill, today = new Date()) {
  const thisMonth = dueInMonth(bill.day, today)
  const paid = !!bill.paid?.[monthKey(today)]
  const date = paid ? dueInMonth(bill.day, addMonths(today, 1)) : thisMonth
  const n = differenceInCalendarDays(date, today)
  return { date, n, paid, overdue: !paid && n < 0, monthKey: paid ? monthKey(addMonths(today, 1)) : monthKey(today) }
}

export function billTotals(bills, today = new Date()) {
  const active = bills.filter((b) => !b.paused)
  const mk = monthKey(today)
  const total = active.reduce((a, b) => a + b.amount, 0)
  const paid = active.filter((b) => b.paid?.[mk]).reduce((a, b) => a + b.amount, 0)
  const subs = active.filter((b) => b.kind === 'sub').reduce((a, b) => a + b.amount, 0)
  return { total, paid, left: total - paid, subs, bills: total - subs }
}

/* ============================ birthdays & anniversaries ============================ */

export const OCCASIONS = [
  ['birthday', 'Birthday', '🎂'],
  ['anniversary', 'Anniversary', '💍'],
  ['other', 'Other', '🎉'],
]
export const occInfo = (k) => OCCASIONS.find((o) => o[0] === k) || OCCASIONS[2]

// date is stored as yyyy-MM-dd. If the year is unknown we still keep a placeholder year in the string.
export function nextOccurrence(item, today = new Date()) {
  const d = parseISO(item.date)
  if (!isValid(d)) return null
  const mk = (y) => (d.getMonth() === 1 && d.getDate() === 29 && new Date(y, 1, 29).getMonth() !== 1 ? new Date(y, 1, 28) : new Date(y, d.getMonth(), d.getDate()))
  let next = mk(today.getFullYear())
  if (differenceInCalendarDays(next, today) < 0) next = mk(today.getFullYear() + 1)
  const n = differenceInCalendarDays(next, today)
  const years = item.yearKnown ? next.getFullYear() - d.getFullYear() : null
  return { date: next, n, years }
}

/* ============================ travel ============================ */

export const BOOKING_PRESETS = ['Tickets (bus / train / flight)', 'Hotel / guest house', 'Visa / permit', 'Travel insurance', 'Cab / car rental', 'Tour guide', 'Foreign currency / cash']

export function tripDays(trip) {
  if (!trip.start) return []
  const a = parseISO(trip.start)
  const b = parseISO(trip.end || trip.start)
  if (!isValid(a) || !isValid(b) || b < a) return [trip.start]
  const n = Math.min(60, differenceInCalendarDays(b, a) + 1)
  return Array.from({ length: n }, (_, i) => ymd(addDays(a, i)))
}