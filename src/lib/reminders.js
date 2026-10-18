import { useEffect, useRef } from 'react'
import { addDays, differenceInCalendarDays, parseISO } from 'date-fns'
import { occursOn, ymd, fmtTime } from './dates'
import { nextDue, nextOccurrence, occInfo } from './daily'
import { cycleInfo, medDays, validTime } from './health'
import { prayerTimes, optsFrom } from './prayer'
import { beep, notify } from './sound'
import { useStore } from './store'
import { followInfo, getWeek, invoiceState, routineProgress, weekKey } from './work'

// Checks every 15 seconds while the app is open and fires reminders once.
export function useReminders() {
  const { data, set, toast } = useStore()
  const ref = useRef(data)
  ref.current = data

  useEffect(() => {
    const tick = () => {
      const d = ref.current
      const now = new Date()
      const fresh = {}
      const lines = []

      for (const ds of [ymd(now), ymd(addDays(now, 1))]) {
        for (const ev of d.events) {
          if (ev.remind == null || ev.remind < 0 || !occursOn(ev, ds) || ev.doneOn?.[ds]) continue
          const at = new Date(`${ds}T${ev.time || '09:00'}:00`)
          const fire = new Date(at.getTime() - ev.remind * 60000)
          const key = `${ev.id}|${ds}`
          if (now >= fire && now <= new Date(at.getTime() + 60 * 60000) && !d.fired[key]) {
            fresh[key] = 1
            lines.push([ev.title, ev.time ? `Starts at ${fmtTime(ev.time)}` : 'Today'])
          }
        }
      }

      // Medicine: at the dose time, and once more 30 minutes later if it is still not marked as taken.
      {
        const ds = ymd(now)
        for (const m of d.meds || []) {
          if (m.paused || !medDays(m).includes(now.getDay())) continue
          for (const t of m.times || []) {
            if (!validTime(t) || m.taken?.[ds]?.[t]) continue
            const late = (now - new Date(`${ds}T${t}:00`)) / 60000
            const k0 = `med|${m.id}|${ds}|${t}|0`
            const k1 = `med|${m.id}|${ds}|${t}|1`
            const label = `${m.emoji} ${m.name}${m.dose ? ` (${m.dose})` : ''}`
            if (late >= 0 && late <= 60 && !d.fired[k0]) {
              fresh[k0] = 1
              lines.push([label, `Time for your dose (${fmtTime(t)})`])
            } else if (late >= 30 && late <= 180 && d.fired[k0] && !d.fired[k1]) {
              fresh[k1] = 1
              lines.push([label, 'Not marked as taken yet'])
            }
          }
        }
      }

      // Key dates: heads-up the day before and on the day (after 8:00).
      if (now.getHours() >= 8) {
        for (const k of d.keyDates) {
          const n = differenceInCalendarDays(parseISO(k.date), now)
          if (n === 0 || n === 1) {
            const key = `kd|${k.id}|${n}`
            if (!d.fired[key]) {
              fresh[key] = 1
              lines.push([`${k.title}`, n === 0 ? 'Is today!' : 'Is tomorrow'])
            }
          }
        }
      }

      // Bills & subscriptions: alert N days before the due date, on the day, and once when overdue.
      if (now.getHours() >= 8) {
        for (const b of d.bills || []) {
          if (b.paused) continue
          const due = nextDue(b, now)
          if (due.paid) continue
          const n = due.n
          if (n === b.remind || n === 0 || n === -1) {
            const key = `bill|${b.id}|${ymd(due.date)}|${n}`
            if (!d.fired[key]) {
              fresh[key] = 1
              lines.push([`${b.emoji} ${b.name}`, n === 0 ? 'Bill is due today' : n < 0 ? 'Was due yesterday – not marked paid' : n === 1 ? 'Bill is due tomorrow' : `Bill is due in ${n} days`])
            }
          }
        }

        // Birthdays & anniversaries
        for (const b of d.birthdays || []) {
          const o = nextOccurrence(b, now)
          if (!o) continue
          if (o.n === 0 || (b.remind > 0 && o.n === b.remind)) {
            const key = `bd|${b.id}|${o.date.getFullYear()}|${o.n}`
            if (!d.fired[key]) {
              fresh[key] = 1
              const what = occInfo(b.kind)
              lines.push([`${what[2]} ${b.name}`, o.n === 0 ? `${what[1]} is today!` : o.n === 1 ? `${what[1]} is tomorrow` : `${what[1]} in ${o.n} days`])
            }
          }
        }

        // Personal tracker: deliberately neutral wording, so nothing private shows in toasts or notifications.
        if (d.cycle && d.cycle.remind >= 0) {
          const ci = cycleInfo(d.cycle, now)
          if (ci.next && (ci.n === d.cycle.remind || ci.n === 0)) {
            const key = `cy|${ymd(ci.next)}|${ci.n}`
            if (!d.fired[key]) {
              fresh[key] = 1
              lines.push(['🌸 Personal reminder', 'Open Stardesk for details'])
            }
          }
        }

        // Trips: heads-up the day before and on the first day.
        for (const t of d.trips || []) {
          const n = differenceInCalendarDays(parseISO(t.start), now)
          if (n === 0 || n === 1) {
            const key = `trip|${t.id}|${n}`
            if (!d.fired[key]) {
              fresh[key] = 1
              lines.push([`${t.emoji} ${t.name}`, n === 0 ? 'Trip starts today!' : 'Trip starts tomorrow – check your bookings'])
            }
          }
        }
      }

      // Work (steps 7-8): job follow-ups, invoices, project deadlines, Friday review, routines.
      if (now.getHours() >= 8) {
        for (const j of d.jobs || []) {
          const f = followInfo(j, now)
          if (f && (f.n === 0 || f.n === -1)) {
            const key = `job|${j.id}|${j.follow}|${f.n}`
            if (!d.fired[key]) {
              fresh[key] = 1
              lines.push([`📮 ${j.company}`, f.n === 0 ? 'Follow-up due today' : 'Follow-up was due yesterday'])
            }
          }
        }
        const fl = d.freelance
        for (const i of fl?.invoices || []) {
          const st = invoiceState(i, now)
          if (st.key === 'paid' || st.key === 'draft' || !i.due) continue
          if (st.n === 1 || st.n === 0 || st.n === -1) {
            const key = `inv|${i.id}|${i.due}|${st.n}`
            if (!d.fired[key]) {
              fresh[key] = 1
              lines.push([`🧾 Invoice ${i.number}`, st.n === 1 ? 'Payment is due tomorrow' : st.n === 0 ? 'Payment is due today' : 'Payment is overdue'])
            }
          }
        }
        for (const p of fl?.projects || []) {
          if (p.status === 'done' || !p.deadline) continue
          const n = differenceInCalendarDays(parseISO(p.deadline), now)
          if (n === 0 || n === 1) {
            const key = `pdl|${p.id}|${n}`
            if (!d.fired[key]) {
              fresh[key] = 1
              lines.push([`🧑‍💻 ${p.name}`, n === 0 ? 'Deadline is today!' : 'Deadline is tomorrow'])
            }
          }
        }
      }

      // Friday review: from 5 pm, once per week, if this week has priorities but no review yet.
      if (now.getDay() === 5 && now.getHours() >= 17) {
        const wk = weekKey(now, d.settings.weekStart)
        const w = getWeek(d.priorities, wk)
        const key = `rev|${wk}`
        if (w.items.length && !w.review && !d.fired[key]) {
          fresh[key] = 1
          lines.push(['🎯 Weekly review', `${w.items.filter((i) => i.done).length}/${w.items.length} priorities done – take 2 minutes to review`])
        }
      }

      // Routines: at the chosen time (for up to 90 minutes) if not finished yet.
      for (const r of d.routines || []) {
        if (!r.time || !validTime(r.time)) continue
        const late = (now - new Date(`${ymd(now)}T${r.time}:00`)) / 60000
        const key = `rt|${r.id}|${ymd(now)}`
        if (late >= 0 && late <= 90 && !d.fired[key] && !routineProgress(r, ymd(now), d.habits).complete) {
          fresh[key] = 1
          lines.push([`${r.emoji} ${r.name}`, 'Time for your routine – tick it off in Stardesk'])
        }
      }

      // Time capsules: tell the user once when one is ready to open (after 8:00).
      if (now.getHours() >= 8) {
        for (const c of d.capsule || []) {
          if (c.openedOn || c.opens > ymd(now)) continue
          const key = `cap|${c.id}`
          if (!d.fired[key]) {
            fresh[key] = 1
            lines.push(['⏳ Time capsule', 'Your capsule is ready to open!'])
          }
        }
      }

      // Prayer alerts (optional): fire within 10 minutes after each prayer time.
      if (d.settings.prayerAlert && d.place) {
        try {
          for (const p of prayerTimes(d.place, now, optsFrom(d.settings))) {
            if (!p.prayer) continue
            const key = `pr|${ymd(now)}|${p.id}`
            if (now >= p.time && now <= new Date(p.time.getTime() + 10 * 60000) && !d.fired[key]) {
              fresh[key] = 1
              lines.push([`${p.label} time`, `Prayer time in ${d.place.name}`])
            }
          }
        } catch {
          /* invalid location */
        }
      }

      if (!lines.length) return
      set('fired', (f) => Object.fromEntries(Object.entries({ ...f, ...fresh }).slice(-400)))
      lines.forEach(([title, body]) => {
        toast(`⏰ ${title} – ${body}`, 'bell')
        if (d.settings.notif) notify(title, body)
      })
      if (d.settings.sound) beep()
    }

    tick()
    const id = setInterval(tick, 15000)
    const vis = () => document.visibilityState === 'visible' && tick()
    document.addEventListener('visibilitychange', vis)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', vis)
    }
  }, [set, toast])
}