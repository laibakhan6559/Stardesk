import { format } from 'date-fns'
import { defaultTheme, normalizeTheme } from './themes'

// Data schema for Stardesk. v1 users are migrated automatically; their old
// "stardesk:v1" key is never deleted, so nothing can be lost by upgrading.
export const KEY_V1 = 'stardesk:v1'
export const KEY = 'stardesk:v2'
export const SCHEMA = 2

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)

const prefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches

export function defaults() {
  const today = format(new Date(), 'yyyy-MM-dd')
  return {
    schema: SCHEMA,
    settings: {
      name: '',
      theme: defaultTheme(prefersDark()),
      weekStart: 1,
      notif: false,
      sound: true,
      goal: 120,
      semester: 1,
      hijriAdj: 0, // days to shift the Hijri date (moon sighting differs by country)
      prayerMethod: 'Karachi',
      prayerMadhab: 'hanafi',
      prayerAlert: false,
      currency: 'Rs', // shown in Budget, Bills and Travel
      lastBackup: '', // ISO time of the last exported backup (step 11)
    },
    events: [],
    tasks: [{ id: uid(), title: 'Plan my week in Stardesk ✨', pri: 2, due: today, done: false }],
    habits: [
      { id: uid(), name: 'Drink water', emoji: '💧', log: {} },
      { id: uid(), name: 'Study session', emoji: '📚', log: {} },
      { id: uid(), name: 'Sleep early', emoji: '🌙', log: {} },
    ],
    classes: [],
    keyDates: [],
    notes: [],
    sessions: [],
    mood: {},
    fired: {},
    // --- new in v2 ---
    layout: { home: {} }, // Home widget order / hidden / sizes (see lib/widgets.js)
    pins: [], // apps pinned in the launcher + Home "Apps" widget
    // --- step 2: utilities ---
    place: { name: 'Islamabad', lat: 33.6844, lon: 73.0479, tz: 'Asia/Karachi' }, // used by prayer times + weather
    clocks: [
      { id: 'c-dubai', label: 'Dubai', tz: 'Asia/Dubai' },
      { id: 'c-london', label: 'London', tz: 'Europe/London' },
      { id: 'c-ny', label: 'New York', tz: 'America/New_York' },
    ],
    cd: { islamic: ['ramadan', 'eid-fitr', 'eid-adha'] }, // which Islamic dates show as countdowns
    // --- step 3: daily life A ---
    meals: { plan: {}, grocery: [] }, // plan: { 'yyyy-MM-dd': { b, l, d } }
    lists: [], // reusable shopping / packing lists: { id, name, emoji, items: [{ id, text, done }] }
    chores: { people: [], items: [] }, // items: { id, title, emoji, freq, who: [names], offset, done: { periodKey: name } }
    // --- step 4: daily life B ---
    budget: { tx: [], limits: {}, total: 0 }, // tx: { id, type: 'in' | 'out', amount, cat, date, note }
    bills: [], // { id, name, emoji, kind: 'bill' | 'sub', amount, day, remind, paused, paid: { 'yyyy-MM': true } }
    birthdays: [], // { id, name, kind, date, yearKnown, remind, note, gifts: [{ id, text, done }] }
    trips: [], // { id, name, emoji, place, start, end, budget, itinerary, bookings, expenses }
    // --- steps 5-6: health ---
    water: { goal: 8, glass: 250, log: {} }, // log: { 'yyyy-MM-dd': glasses }
    sleep: { goal: 8, log: {} }, // log keyed by the wake-up date: { bed: 'HH:mm', wake: 'HH:mm' }
    workouts: [], // { id, date, name, type: 'str' | 'cardio', sets: [{ reps, kg }], min, km, note }
    meds: [], // { id, name, emoji, dose, times: ['08:00'], dow: [0-6], paused, taken: { 'yyyy-MM-dd': { 'HH:mm': 1 } } }
    cycle: { periods: [], cycleLen: 28, periodLen: 5, remind: 2 }, // periods: { id, start, end } - private, browser only
    breath: [], // { id, date, sec, pattern }
    moodNotes: {}, // { 'yyyy-MM-dd': 'one line' } - the 1-5 score itself lives in data.mood
    // --- step 7: work A ---
    jobs: [], // { id, company, role, status: 'wish' | 'applied' | 'interview' | 'offer' | 'rejected', applied, follow, link, contact, note }
    freelance: { projects: [], invoices: [], time: [], timer: null }, // projects: { id, client, name, rate, deadline, status: 'active' | 'done', note }
    // invoices: { id, projectId, number, title, amount, issued, due, status: 'draft' | 'sent' | 'paid', paidOn }  time: { id, projectId, date, min, note, billed }  timer: { projectId, start } | null
    // --- step 8: work B ---
    meetings: [], // { id, title, date, time, who, template, agenda: [{ id, text, done }], notes, actions: [{ id, text, done }] }
    priorities: {}, // { 'yyyy-MM-dd' (first day of the week): { items: [{ id, text, done }], review: { won, hard, next, rating } | null } }
    routines: [], // { id, name, emoji, time, steps: [{ id, text, habitId }], done: { 'yyyy-MM-dd': [stepId] } }
    // --- step 9: growth A ---
    goals: [], // { id, title, emoji, year, why, done, milestones: [{ id, text, done }] }
    vision: [], // { id, caption, emoji, color, img } - img is a tiny pixelated data URL made in the browser
    gratitude: {}, // { 'yyyy-MM-dd': [string, string, string] }
    reading: [], // { id, title, author, status: 'to' | 'reading' | 'done', pages, read, rating, finished }
    watch: [], // { id, title, kind: 'movie' | 'show' | 'anime' | 'doc', status: 'to' | 'watching' | 'done', rating, note }
    bucket: [], // { id, text, emoji, done, doneOn, note }
    // --- step 10: growth B ---
    quotes: { shuffle: {}, ch: {}, mine: [], fav: [] }, // shuffle: { date: n }  ch: { date: { i, done } }  mine/fav: [text]
    capsule: [], // { id, title, text, created, opens, openedOn } - private, browser only
    // --- step 12: Pixel Zoo ---
    zoo: { items: [], starters: true }, // items: { id, kind: 'fish' | 'frog' | 'monkey' | 'butterfly' | 'sparrow' | 'rabbit' | 'bee', img: small PNG data URL, made }
    // (Eisenhower has no collection of its own: tasks get an optional q: 'q1' | 'q2' | 'q3' | 'q4' field.)
    // Later steps add their own collections here (work, growth ...).
    // They appear automatically for old data because migrate() merges defaults.
  }
}

const ARRAYS = ['events', 'tasks', 'habits', 'classes', 'keyDates', 'notes', 'sessions', 'pins', 'clocks', 'lists', 'bills', 'birthdays', 'trips', 'workouts', 'meds', 'breath', 'jobs', 'meetings', 'routines', 'goals', 'vision', 'reading', 'watch', 'bucket', 'capsule']
const OBJECTS = ['mood', 'fired', 'layout', 'place', 'cd', 'meals', 'chores', 'budget', 'water', 'sleep', 'cycle', 'moodNotes', 'freelance', 'priorities', 'gratitude', 'quotes', 'zoo']

// Turns any older / partial / imported object into a valid current-schema object.
export function migrate(p) {
  const base = defaults()
  const src = p && typeof p === 'object' && !Array.isArray(p) ? p : {}
  const out = { ...base, ...src, settings: { ...base.settings, ...(src.settings && typeof src.settings === 'object' ? src.settings : {}) } }
  for (const k of ARRAYS) if (!Array.isArray(out[k])) out[k] = base[k]
  for (const k of OBJECTS) if (!out[k] || typeof out[k] !== 'object' || Array.isArray(out[k])) out[k] = base[k]
  out.layout = { ...base.layout, ...out.layout }
  out.place = { ...base.place, ...out.place }
  out.cd = { ...base.cd, ...out.cd }
  if (!Array.isArray(out.cd.islamic)) out.cd.islamic = base.cd.islamic
  if (!Number.isFinite(out.place.lat) || !Number.isFinite(out.place.lon)) out.place = base.place
  // nested collections: keep what the user has, fill in anything missing
  out.meals = { ...base.meals, ...out.meals }
  if (!out.meals.plan || typeof out.meals.plan !== 'object' || Array.isArray(out.meals.plan)) out.meals.plan = {}
  if (!Array.isArray(out.meals.grocery)) out.meals.grocery = []
  out.chores = { ...base.chores, ...out.chores }
  if (!Array.isArray(out.chores.people)) out.chores.people = []
  if (!Array.isArray(out.chores.items)) out.chores.items = []
  out.budget = { ...base.budget, ...out.budget }
  if (!Array.isArray(out.budget.tx)) out.budget.tx = []
  if (!out.budget.limits || typeof out.budget.limits !== 'object' || Array.isArray(out.budget.limits)) out.budget.limits = {}
  if (!Number.isFinite(out.budget.total)) out.budget.total = 0
  out.water = { ...base.water, ...out.water }
  if (!out.water.log || typeof out.water.log !== 'object' || Array.isArray(out.water.log)) out.water.log = {}
  out.sleep = { ...base.sleep, ...out.sleep }
  if (!out.sleep.log || typeof out.sleep.log !== 'object' || Array.isArray(out.sleep.log)) out.sleep.log = {}
  out.cycle = { ...base.cycle, ...out.cycle }
  if (!Array.isArray(out.cycle.periods)) out.cycle.periods = []
  out.freelance = { ...base.freelance, ...out.freelance }
  for (const k of ['projects', 'invoices', 'time']) if (!Array.isArray(out.freelance[k])) out.freelance[k] = []
  if (!out.freelance.timer || typeof out.freelance.timer !== 'object' || !out.freelance.timer.projectId) out.freelance.timer = null
  out.quotes = { ...base.quotes, ...out.quotes }
  for (const k of ['shuffle', 'ch']) if (!out.quotes[k] || typeof out.quotes[k] !== 'object' || Array.isArray(out.quotes[k])) out.quotes[k] = {}
  for (const k of ['mine', 'fav']) if (!Array.isArray(out.quotes[k])) out.quotes[k] = []
  out.zoo = { ...base.zoo, ...out.zoo }
  if (!Array.isArray(out.zoo.items)) out.zoo.items = []
  // keep only well-formed drawings (small PNG data URLs made by the Zoo drawing pad)
  out.zoo.items = out.zoo.items.filter((i) => i && typeof i.id === 'string' && typeof i.kind === 'string' && typeof i.img === 'string' && i.img.startsWith('data:image/png')).slice(-40)
  out.zoo.starters = out.zoo.starters !== false
  out.settings.theme = normalizeTheme(out.settings.theme) // unknown value -> default
  out.schema = SCHEMA
  return out
}

// Reads v2, or upgrades v1 on first run. Never throws.
export function loadData() {
  try {
    const v2 = localStorage.getItem(KEY)
    if (v2) return migrate(JSON.parse(v2))
    const v1 = localStorage.getItem(KEY_V1)
    if (v1) return migrate(JSON.parse(v1))
  } catch {
    /* corrupt or blocked storage - start fresh */
  }
  return defaults()
}