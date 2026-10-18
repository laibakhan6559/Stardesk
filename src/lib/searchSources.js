import { APPS } from './apps'
import { MOODS } from './health'

// Everything Ctrl+K can find. To make a new app searchable, push one object:
//   { id, run: ({ data, has, go, setUi }) => [{ k, icon, text, tag, run }] }
// `has(x)` is a case-insensitive "contains the query" test.
export const searchSources = [
  {
    id: 'apps',
    run: ({ has, go }) =>
      APPS.filter((a) => a.ready && (has(a.label) || has(a.desc))).map((a) => ({ k: 'a' + a.id, icon: a.emoji, text: a.label, tag: 'App', run: () => go(a.id) })),
  },
  {
    id: 'tasks',
    run: ({ data, has, go }) => data.tasks.filter((t) => has(t.title)).map((t) => ({ k: 't' + t.id, icon: '✅', text: t.title, tag: 'Task', run: () => go('tasks') })),
  },
  {
    id: 'events',
    run: ({ data, has, go, setUi }) =>
      data.events
        .filter((e) => has(e.title) || has(e.notes))
        .map((e) => ({
          k: 'e' + e.id,
          icon: '🗓️',
          text: e.title,
          tag: e.date,
          run: () => {
            setUi({ plannerDate: e.date, plannerView: 'day' })
            go('planner')
          },
        })),
  },
  {
    id: 'keyDates',
    run: ({ data, has, go }) => data.keyDates.filter((k) => has(k.title)).map((k) => ({ k: 'k' + k.id, icon: '⭐', text: k.title, tag: k.date, run: () => go('dates') })),
  },
  {
    id: 'classes',
    run: ({ data, has, go }) => data.classes.filter((c) => has(c.name) || has(c.teacher)).map((c) => ({ k: 'c' + c.id, icon: '🎓', text: c.name, tag: 'Class', run: () => go('classes') })),
  },
  {
    id: 'notes',
    run: ({ data, has, go, setUi }) =>
      data.notes
        .filter((n) => has(n.title) || has(n.body))
        .map((n) => ({
          k: 'n' + n.id,
          icon: '📒',
          text: n.title || 'Untitled note',
          tag: 'Note',
          run: () => {
            setUi({ noteId: n.id, paper: 'all' })
            go('notes')
          },
        })),
  },
  {
    id: 'habits',
    run: ({ data, has, go }) => data.habits.filter((h) => has(h.name)).map((h) => ({ k: 'h' + h.id, icon: h.emoji, text: h.name, tag: 'Habit', run: () => go('habits') })),
  },
  {
    id: 'meals',
    run: ({ data, has, go }) => {
      const out = []
      for (const [ds, day] of Object.entries(data.meals?.plan || {})) {
        for (const slot of ['b', 'l', 'd']) if (has(day[slot])) out.push({ k: `m${ds}${slot}`, icon: '🍲', text: day[slot], tag: ds, run: () => go('meals') })
      }
      for (const g of data.meals?.grocery || []) if (has(g.text)) out.push({ k: 'g' + g.id, icon: '🛒', text: g.text, tag: 'Grocery', run: () => go('meals') })
      return out
    },
  },
  {
    id: 'lists',
    run: ({ data, has, go }) =>
      data.lists.flatMap((l) => [
        ...(has(l.name) ? [{ k: 'l' + l.id, icon: l.emoji, text: l.name, tag: 'List', run: () => go('lists') }] : []),
        ...l.items.filter((i) => has(i.text)).map((i) => ({ k: 'li' + i.id, icon: '🛒', text: i.text, tag: l.name, run: () => go('lists') })),
      ]),
  },
  {
    id: 'chores',
    run: ({ data, has, go }) => data.chores.items.filter((c) => has(c.title)).map((c) => ({ k: 'ch' + c.id, icon: c.emoji, text: c.title, tag: 'Chore', run: () => go('chores') })),
  },
  {
    id: 'budget',
    run: ({ data, has, go }) => data.budget.tx.filter((t) => has(t.note)).map((t) => ({ k: 'bt' + t.id, icon: t.type === 'in' ? '💵' : '💰', text: t.note, tag: t.date, run: () => go('budget') })),
  },
  {
    id: 'bills',
    run: ({ data, has, go }) => data.bills.filter((b) => has(b.name)).map((b) => ({ k: 'b' + b.id, icon: b.emoji, text: b.name, tag: b.kind === 'sub' ? 'Subscription' : 'Bill', run: () => go('bills') })),
  },
  {
    id: 'birthdays',
    run: ({ data, has, go }) =>
      data.birthdays.filter((b) => has(b.name) || has(b.note) || (b.gifts || []).some((g) => has(g.text))).map((b) => ({ k: 'bd' + b.id, icon: '🎂', text: b.name, tag: 'Date', run: () => go('birthdays') })),
  },
  {
    id: 'trips',
    run: ({ data, has, go }) =>
      data.trips
        .filter((t) => has(t.name) || has(t.place) || t.itinerary.some((i) => has(i.text)) || t.bookings.some((b) => has(b.text)))
        .map((t) => ({ k: 'tr' + t.id, icon: t.emoji, text: t.name, tag: 'Trip', run: () => go('travel') })),
  },
  {
    id: 'clocks',
    run: ({ data, has, go }) => (data.clocks || []).filter((c) => has(c.label) || has(c.tz)).map((c) => ({ k: 'ck' + c.id, icon: '🌍', text: c.label, tag: 'World clock', run: () => go('clock') })),
  },
  // Steps 5-6. The cycle tracker is deliberately not searchable (private).
  {
    id: 'workouts',
    run: ({ data, has, go }) => {
      const seen = new Set()
      return data.workouts
        .filter((w) => (has(w.name) || has(w.note)) && !seen.has(w.name.toLowerCase()) && seen.add(w.name.toLowerCase()))
        .map((w) => ({ k: 'wo' + w.id, icon: '🏋️', text: w.name, tag: 'Workout', run: () => go('workout') }))
    },
  },
  {
    id: 'meds',
    run: ({ data, has, go }) => data.meds.filter((m) => has(m.name) || has(m.dose)).map((m) => ({ k: 'md' + m.id, icon: m.emoji, text: m.name, tag: 'Medicine', run: () => go('medicine') })),
  },
  {
    id: 'moodNotes',
    run: ({ data, has, go }) =>
      Object.entries(data.moodNotes || {})
        .filter(([, t]) => has(t))
        .map(([ds, t]) => ({ k: 'mn' + ds, icon: MOODS[(data.mood[ds] || 3) - 1]?.[0] || '🙂', text: t, tag: ds, run: () => go('mood') })),
  },
  // Steps 7-8
  {
    id: 'jobs',
    run: ({ data, has, go }) => data.jobs.filter((j) => has(j.company) || has(j.role) || has(j.note) || has(j.contact)).map((j) => ({ k: 'jb' + j.id, icon: '📮', text: j.role ? `${j.company} – ${j.role}` : j.company, tag: 'Job', run: () => go('jobs') })),
  },
  {
    id: 'freelance',
    run: ({ data, has, go }) => [
      ...data.freelance.projects.filter((p) => has(p.name) || has(p.client) || has(p.note)).map((p) => ({ k: 'fp' + p.id, icon: '🧑‍💻', text: `${p.client} · ${p.name}`, tag: 'Project', run: () => go('freelance') })),
      ...data.freelance.invoices.filter((i) => has(i.number) || has(i.title)).map((i) => ({ k: 'fi' + i.id, icon: '🧾', text: `${i.number} ${i.title}`, tag: 'Invoice', run: () => go('freelance') })),
    ],
  },
  {
    id: 'meetings',
    run: ({ data, has, go }) =>
      data.meetings
        .filter((m) => has(m.title) || has(m.who) || has(m.notes) || m.agenda.some((a) => has(a.text)) || m.actions.some((a) => has(a.text)))
        .map((m) => ({ k: 'mt' + m.id, icon: '📋', text: m.title || 'Untitled meeting', tag: m.date, run: () => go('meetings') })),
  },
  {
    id: 'priorities',
    run: ({ data, has, go }) =>
      Object.entries(data.priorities || {}).flatMap(([wk, w]) => (w.items || []).filter((i) => has(i.text)).map((i) => ({ k: 'pr' + i.id, icon: '🎯', text: i.text, tag: 'Week of ' + wk, run: () => go('priorities') }))),
  },
  {
    id: 'routines',
    run: ({ data, has, go }) =>
      data.routines.flatMap((r) => [
        ...(has(r.name) ? [{ k: 'rt' + r.id, icon: r.emoji, text: r.name, tag: 'Routine', run: () => go('routines') }] : []),
        ...r.steps.filter((s) => has(s.text)).map((s) => ({ k: 'rs' + s.id, icon: '🔗', text: s.text, tag: r.name, run: () => go('routines') })),
      ]),
  },
  // Steps 9-10. Time capsules are deliberately not searchable (private).
  {
    id: 'goals',
    run: ({ data, has, go }) =>
      data.goals.flatMap((g) => [
        ...(has(g.title) || has(g.why) ? [{ k: 'go' + g.id, icon: g.emoji, text: g.title, tag: 'Goal ' + g.year, run: () => go('goals') }] : []),
        ...g.milestones.filter((m) => has(m.text)).map((m) => ({ k: 'gm' + m.id, icon: '🏁', text: m.text, tag: g.title, run: () => go('goals') })),
      ]),
  },
  {
    id: 'vision',
    run: ({ data, has, go }) => data.vision.filter((v) => has(v.caption)).map((v) => ({ k: 'vi' + v.id, icon: v.emoji, text: v.caption, tag: 'Vision board', run: () => go('goals') })),
  },
  {
    id: 'gratitude',
    run: ({ data, has, go }) =>
      Object.entries(data.gratitude || {}).flatMap(([ds, a]) => (a || []).filter((t) => has(t)).map((t, i) => ({ k: `gr${ds}${i}`, icon: '🙏', text: t, tag: ds, run: () => go('gratitude') }))),
  },
  {
    id: 'reading',
    run: ({ data, has, go }) => data.reading.filter((b) => has(b.title) || has(b.author)).map((b) => ({ k: 'rd' + b.id, icon: '📚', text: b.title, tag: 'Book', run: () => go('reading') })),
  },
  {
    id: 'watch',
    run: ({ data, has, go }) => data.watch.filter((w) => has(w.title) || has(w.note)).map((w) => ({ k: 'wt' + w.id, icon: '🎬', text: w.title, tag: 'Watchlist', run: () => go('watchlist') })),
  },
  {
    id: 'bucket',
    run: ({ data, has, go }) => data.bucket.filter((b) => has(b.text)).map((b) => ({ k: 'bk' + b.id, icon: b.emoji, text: b.text, tag: 'Bucket list', run: () => go('bucket') })),
  },
  {
    id: 'quotes',
    run: ({ data, has, go }) => (data.quotes?.mine || []).filter((t) => has(t)).map((t, i) => ({ k: 'qm' + i, icon: '💌', text: t, tag: 'Affirmation', run: () => go('quotes') })),
  },
]