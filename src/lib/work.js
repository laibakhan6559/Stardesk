import { addDays, differenceInCalendarDays, format, parseISO, startOfWeek } from 'date-fns'
import { ymd } from './dates'

/* =================== Step 7: job applications =================== */

// [id, label, emoji]
export const JOB_STATUS = [
  ['wish', 'Wishlist', '⭐'],
  ['applied', 'Applied', '📨'],
  ['interview', 'Interview', '🎤'],
  ['offer', 'Offer', '🎉'],
  ['rejected', 'Rejected', '🥀'],
]
export const jobStatus = (id) => JOB_STATUS.find((s) => s[0] === id) || JOB_STATUS[1]

// Follow-up only matters while the application is still alive.
export const followOpen = (j) => Boolean(j.follow) && (j.status === 'applied' || j.status === 'interview')

export function followInfo(j, today = new Date()) {
  if (!followOpen(j)) return null
  const n = differenceInCalendarDays(parseISO(j.follow), today)
  return { n, overdue: n < 0 }
}

export function jobCounts(jobs) {
  const c = Object.fromEntries(JOB_STATUS.map(([id]) => [id, 0]))
  for (const j of jobs) if (c[j.status] != null) c[j.status]++
  return c
}

/* =================== Step 7: freelance =================== */

export const INVOICE_STATUS = [
  ['draft', 'Draft'],
  ['sent', 'Sent'],
  ['paid', 'Paid'],
]

export function fmtHm(min) {
  const m = Math.max(0, Math.round(min || 0))
  const h = Math.floor(m / 60)
  return h ? `${h}h ${String(m % 60).padStart(2, '0')}m` : `${m}m`
}

export const hms = (sec) => {
  const s = Math.max(0, Math.floor(sec))
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':')
}

export const timerSeconds = (timer, now = Date.now()) => (timer ? Math.max(0, (now - timer.start) / 1000) : 0)

// Sent invoice that is past its due date counts as overdue.
export function invoiceState(inv, today = new Date()) {
  if (inv.status === 'paid') return { key: 'paid', n: 0 }
  if (inv.status === 'draft') return { key: 'draft', n: 0 }
  const n = inv.due ? differenceInCalendarDays(parseISO(inv.due), today) : 999
  return { key: n < 0 ? 'overdue' : 'sent', n }
}

export const unbilledMin = (projectId, time) => time.filter((t) => t.projectId === projectId && !t.billed).reduce((a, t) => a + t.min, 0)

export function projectStats(p, fl, today = new Date()) {
  const mine = fl.invoices.filter((i) => i.projectId === p.id)
  const trackedMin = fl.time.filter((t) => t.projectId === p.id).reduce((a, t) => a + t.min, 0)
  const unbilled = unbilledMin(p.id, fl.time)
  const invoiced = mine.filter((i) => i.status !== 'draft').reduce((a, i) => a + i.amount, 0)
  const paid = mine.filter((i) => i.status === 'paid').reduce((a, i) => a + i.amount, 0)
  const overdue = mine.some((i) => invoiceState(i, today).key === 'overdue')
  const pay = !mine.length ? 'none' : invoiced > 0 && paid >= invoiced ? 'paid' : overdue ? 'overdue' : paid > 0 ? 'partial' : 'pending'
  return { trackedMin, unbilled, unbilledValue: (unbilled / 60) * (p.rate || 0), invoiced, paid, due: invoiced - paid, pay }
}

export const PAY_LABEL = { none: 'no invoice', paid: 'paid ✓', overdue: 'overdue', partial: 'part-paid', pending: 'awaiting payment' }

export function nextInvoiceNumber(invoices, now = new Date()) {
  const y = now.getFullYear()
  const n = invoices.filter((i) => (i.number || '').startsWith(`INV-${y}-`)).length + 1
  return `INV-${y}-${String(n).padStart(3, '0')}`
}

export function freelanceTotals(fl, today = new Date()) {
  const month = format(today, 'yyyy-MM')
  const outstanding = fl.invoices.filter((i) => i.status === 'sent').reduce((a, i) => a + i.amount, 0)
  const overdue = fl.invoices.filter((i) => invoiceState(i, today).key === 'overdue').reduce((a, i) => a + i.amount, 0)
  const earned = fl.invoices.filter((i) => i.status === 'paid' && (i.paidOn || '').startsWith(month)).reduce((a, i) => a + i.amount, 0)
  const monthMin = fl.time.filter((t) => (t.date || '').startsWith(month)).reduce((a, t) => a + t.min, 0)
  return { outstanding, overdue, earned, monthMin }
}

/* =================== Step 8: meeting notes =================== */

// Each template pre-fills the agenda and a notes skeleton.
export const MEETING_TEMPLATES = [
  { id: 'blank', label: 'Blank', emoji: '📄', agenda: [], notes: '' },
  {
    id: 'standup',
    label: 'Team stand-up',
    emoji: '🧍',
    agenda: ['Yesterday: what got done', 'Today: what is planned', 'Blockers'],
    notes: 'Yesterday:\n- \n\nToday:\n- \n\nBlockers:\n- ',
  },
  {
    id: 'one',
    label: '1 : 1',
    emoji: '🤝',
    agenda: ['How are things going?', 'Wins since last time', 'Challenges / support needed', 'Goals and growth', 'Feedback both ways'],
    notes: 'Wins:\n- \n\nChallenges:\n- \n\nFeedback:\n- ',
  },
  {
    id: 'client',
    label: 'Client call',
    emoji: '📞',
    agenda: ['Introductions', 'Progress update', 'Questions / feedback from client', 'Next deliverables and dates', 'Payment / scope changes'],
    notes: 'Client said:\n- \n\nWe agreed:\n- \n\nOpen questions:\n- ',
  },
  {
    id: 'kickoff',
    label: 'Project kick-off',
    emoji: '🚀',
    agenda: ['Goal and why it matters', 'Scope (in / out)', 'Roles and who decides', 'Timeline and milestones', 'Risks', 'Communication plan'],
    notes: 'Goal:\n\nScope:\n- \n\nMilestones:\n- \n\nRisks:\n- ',
  },
  {
    id: 'brainstorm',
    label: 'Brainstorm',
    emoji: '💡',
    agenda: ['Problem statement', 'Ideas (no judging)', 'Group and vote', 'Pick next experiments'],
    notes: 'Ideas:\n- \n\nTop picks:\n- ',
  },
  {
    id: 'retro',
    label: 'Retrospective',
    emoji: '🔁',
    agenda: ['What went well', 'What did not go well', 'What to try next time'],
    notes: 'Went well:\n- \n\nDid not go well:\n- \n\nTry next:\n- ',
  },
]
export const meetingTemplate = (id) => MEETING_TEMPLATES.find((t) => t.id === id) || MEETING_TEMPLATES[0]

/* =================== Step 8: Eisenhower matrix =================== */

// [id, title, hint, emoji, tone]
export const QUADS = [
  ['q1', 'Do first', 'Urgent + important', '🔥', 'q-do'],
  ['q2', 'Schedule', 'Important, not urgent', '📅', 'q-plan'],
  ['q3', 'Delegate', 'Urgent, not important', '🤝', 'q-del'],
  ['q4', 'Drop / later', 'Neither', '🗑️', 'q-drop'],
]
export const quadOf = (id) => QUADS.find((q) => q[0] === id)

/* =================== Step 8: weekly priorities =================== */

export const weekKey = (d, weekStart = 1) => ymd(startOfWeek(d, { weekStartsOn: weekStart }))
export const shiftWeek = (key, n) => ymd(addDays(parseISO(key), n * 7))
export const emptyWeek = () => ({ items: [], review: null })
export const getWeek = (priorities, key) => ({ ...emptyWeek(), ...(priorities?.[key] || {}) })

// Friday review: it is open from Friday through Sunday of the current week (Mon-Sun style weeks).
export const isReviewTime = (d = new Date()) => {
  const g = d.getDay()
  return g === 5 || g === 6 || g === 0
}

export const RATINGS = [
  [1, '😞', 'Rough'],
  [2, '😕', 'So-so'],
  [3, '😐', 'Okay'],
  [4, '🙂', 'Good'],
  [5, '🤩', 'Great'],
]

/* =================== Step 8: routines & habit stacking =================== */

export const ROUTINE_STARTERS = [
  { name: 'Morning routine', emoji: '🌅', time: '07:00', steps: ['Wake up and drink water', 'Make bed', 'Stretch for 5 minutes', 'Plan the top 3 for today'] },
  { name: 'Night routine', emoji: '🌙', time: '22:00', steps: ['Tidy up for tomorrow', 'Skincare / brush teeth', 'Write 3 good things', 'Phone away, lights out'] },
]

// A step is done if it was ticked in this routine OR its linked habit was logged that day.
export function stepDone(r, step, ds, habits) {
  if ((r.done?.[ds] || []).includes(step.id)) return true
  if (step.habitId) return Boolean(habits.find((h) => h.id === step.habitId)?.log?.[ds])
  return false
}

export function routineProgress(r, ds, habits) {
  const total = r.steps.length
  const done = r.steps.filter((s) => stepDone(r, s, ds, habits)).length
  return { done, total, complete: total > 0 && done === total }
}

export function routineStreak(r, habits, today = new Date()) {
  if (!r.steps.length) return 0
  let d = today
  if (!routineProgress(r, ymd(d), habits).complete) d = addDays(d, -1)
  let n = 0
  while (n < 400 && routineProgress(r, ymd(d), habits).complete) {
    n++
    d = addDays(d, -1)
  }
  return n
}