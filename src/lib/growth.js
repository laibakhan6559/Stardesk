import { addMonths, differenceInCalendarDays, parseISO } from 'date-fns'
import { ymd } from './dates'

/* =================== Step 9: goals, reading, watchlist, bucket =================== */

export const GOAL_EMOJIS = ['🏔️', '🎓', '💼', '💪', '💰', '🏠', '✈️', '📚', '🎨', '🌱', '❤️', '🧘']

export function goalProgress(g) {
  const total = g.milestones.length
  const done = g.milestones.filter((m) => m.done).length
  return { total, done, pct: total ? Math.round((done / total) * 100) : g.done ? 100 : 0 }
}

// [id, label, emoji]
export const READ_STATUS = [
  ['to', 'To read', '📚'],
  ['reading', 'Reading', '📖'],
  ['done', 'Done', '✅'],
]
export const WATCH_STATUS = [
  ['to', 'To watch', '🍿'],
  ['watching', 'Watching', '📺'],
  ['done', 'Watched', '✅'],
]
export const WATCH_KINDS = [
  ['movie', 'Movie', '🎬'],
  ['show', 'Show', '📺'],
  ['anime', 'Anime', '🌸'],
  ['doc', 'Documentary', '🎞️'],
]
export const kindEmoji = (k) => WATCH_KINDS.find((x) => x[0] === k)?.[2] || '🎬'

export const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n)

export const BUCKET_IDEAS = [
  ['Watch a sunrise from a mountain', '🌄'],
  ['Visit Hunza / Skardu', '🏔️'],
  ['Perform Umrah / Hajj', '🕋'],
  ['Learn to swim properly', '🏊'],
  ['Read 50 books in a year', '📚'],
  ['Write a book', '✍️'],
  ['Learn a new language', '🗣️'],
  ['Cook a feast for the whole family', '🍛'],
  ['Go on a solo trip', '🎒'],
  ['Plant a tree', '🌳'],
  ['Run a 10K', '🏃'],
  ['Start my own business', '🚀'],
]

/* =================== Step 10: quotes, challenges, time capsule =================== */

// Short original affirmations (written for Stardesk).
export const AFFIRMATIONS = [
  'Today I am moving at my own pace, and that is enough.',
  'Even a small step moves me forward.',
  'I can learn from my mistakes; they do not define me.',
  'Hard days pass, and I am stronger than they are.',
  'I do not have to do everything today, just one good thing.',
  'Rest is part of working hard.',
  'I can do what I have managed to do before.',
  'My worth is bigger than my productivity.',
  'Today is a fresh page.',
  'I have the right to make time for myself.',
  'Patience and effort go hand in hand.',
  'I do not need to be perfect; I just need to begin.',
  'I am grateful for the good things in my life.',
  'One thing at a time, and I will manage.',
  'My dreams are worth my effort.',
  'I can go further than where I am right now.',
  'Even with fear, I will take one small step today.',
  'I have everything I need for today.',
  'Feeling tired is not weakness; it is a sign to rest.',
  'I will be kind to myself.',
  'Small daily habits create big change.',
  'I can ask for help, and that is okay.',
  'Today I will do what matters most.',
  'My efforts bloom even when no one is watching.',
  'Finding something good in every day is my habit.',
  'Hard questions are opportunities for me.',
  'I respect my limits and still keep growing.',
  'A new day brings new hope.',
  'I can be my own best friend.',
  'What is meant to happen will happen with effort.',
]

// Small, doable-today challenges.
export const CHALLENGES = [
  ['Drink one extra glass of water', '💧'],
  ['Take a 10-minute walk', '🚶'],
  ['Message a friend or relative', '💌'],
  ['Tidy your desk or room in 5 minutes', '🧹'],
  ['Spend 30 minutes without your phone', '📵'],
  ['Learn a new word or phrase', '🗣️'],
  ['Give someone a sincere compliment', '🌟'],
  ['Stretch for 5 minutes this morning', '🧘'],
  ['Read one page', '📖'],
  ['Eat something healthy today', '🥗'],
  ['Take 3 deep breaths, 3 times today', '🫧'],
  ['Spend 10 minutes on a task you have been putting off', '⏱️'],
  ['Say “thank you” to someone', '🙏'],
  ['Go to bed 15 minutes earlier tonight', '🌙'],
  ['Look at a beautiful picture or view for 1 minute', '🌅'],
  ['Set aside something old to donate or sort out', '📦'],
  ['Write down today’s spending', '💰'],
  ['Give someone a small gift or a sweet treat', '🎁'],
  ['Take the stairs instead of the lift', '🪜'],
  ['Write down tomorrow’s 3 tasks now', '📝'],
  ['Learn or do a new household task', '🔧'],
  ['Chat with an elder for 5 minutes', '👵'],
  ['Choose water instead of a sugary drink', '🥤'],
  ['Write down one thing you achieved', '🏆'],
  ['Switch off screens before bed', '📴'],
  ['Look in the mirror and smile', '😊'],
  ['Send that pending email or message', '📧'],
  ['Try a new colour or a new route', '🎨'],
  ['Sit in silence for 5 minutes and pray or reflect', '🕊️'],
]

export const dayIndex = (ds) => Math.floor(parseISO(ds).getTime() / 86400000)
export const pickFor = (list, ds, shuffle = 0) => list[Math.abs(dayIndex(ds) + shuffle * 7) % list.length]

export function challengeStreak(ch, today = new Date()) {
  let d = today
  let n = 0
  if (!ch?.[ymd(d)]?.done) d = new Date(d.getTime() - 86400000)
  while (ch?.[ymd(d)]?.done && n < 400) {
    n++
    d = new Date(d.getTime() - 86400000)
  }
  return n
}

export const CAPSULE_PRESETS = [
  [1, '1 month'],
  [3, '3 months'],
  [6, '6 months'],
  [12, '1 year'],
]
export const capsuleDate = (months, from = new Date()) => ymd(addMonths(from, months))

// A capsule is "ready" once its date has come and "sealed" before.
export function capsuleState(c, today = new Date()) {
  const n = differenceInCalendarDays(parseISO(c.opens), today)
  if (c.openedOn) return { key: 'opened', n }
  return { key: n <= 0 ? 'ready' : 'sealed', n }
}

export const allQuotes = (q) => [...AFFIRMATIONS, ...(q?.mine || [])]
export const affirmationOf = (q, ds) => pickFor(allQuotes(q), ds, q?.shuffle?.[ds] || 0)
export function challengeOf(q, ds) {
  const e = q?.ch?.[ds]
  const i = e?.i ?? Math.abs(dayIndex(ds)) % CHALLENGES.length
  return { i, c: CHALLENGES[i % CHALLENGES.length], done: Boolean(e?.done) }
}