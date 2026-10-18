import { useState } from 'react'
import { addDays, differenceInCalendarDays, format, getDay, parseISO } from 'date-fns'
import { Empty, Progress, Win } from '../components/ui'
import { Folder, Moon, PixelStar, Sky } from '../components/art'
import EventRow from '../components/EventRow'
import EventForm from '../components/EventForm'
import { classesOn, countdown, eventsOn, fmtTime, greeting, todayStr, ymd } from '../lib/dates'
import { go } from '../lib/nav'
import { useStore } from '../lib/store'
import { APPS } from '../lib/apps'
import { SPANS, WIDGETS, emptyLayout, hideWidget, moveBy, reorderTo, resizeWidget, resolveLayout, showWidget } from '../lib/widgets'
import { SOUNDS, ambientNow, playAmbient, setAmbientVolume, stopAmbient } from '../lib/ambient'
import { PAPERS } from './Notes'
import { ClockWidget, CountdownsWidget, PrayerWidget, WeatherWidget } from '../widgets/utility'
import { BillsWidget, BirthdaysWidget, BudgetWidget, ChoresWidget, MealsWidget } from '../widgets/daily'
import { BreatheWidget, CycleWidget, MedicineWidget, WaterWidget } from '../widgets/health'
import { GoalsWidget, GratitudeWidget, QuoteWidget, ReadingWidget, ZooWidget } from '../widgets/growth'
import { FreelanceWidget, JobsWidget, PrioritiesWidget, RoutinesWidget } from '../widgets/work'
import { formatHijri } from '../lib/hijri'

const QUOTES = [
  'Small steps every day add up to big results.',
  'Done is better than perfect – start with five minutes.',
  'Plan the work, then work the plan.',
  'Rest is part of the process, not a break from it.',
  'You do not have to see the whole staircase, just take the first step.',
  'Progress, not perfection.',
  'A tidy plan makes a calm mind.',
  'Future you will thank present you.',
  'Focus on one star at a time.',
  'Consistency beats intensity.',
]

const MOODS = [
  ['😞', 'Rough'],
  ['😕', 'Meh'],
  ['😐', 'Okay'],
  ['🙂', 'Good'],
  ['😄', 'Great'],
]

function overallStreak(data) {
  const active = new Set()
  data.habits.forEach((h) => Object.keys(h.log).forEach((d) => active.add(d)))
  data.sessions.forEach((s) => active.add(s.date))
  let d = new Date()
  if (!active.has(ymd(d))) d = addDays(d, -1)
  let n = 0
  while (active.has(ymd(d))) {
    n++
    d = addDays(d, -1)
  }
  return n
}

// ---------- widgets (each one is a self-contained window) ----------

function HeroWidget({ openForm }) {
  const { data } = useStore()
  const today = todayStr()
  const name = data.settings.name.trim()
  const todays = eventsOn(data.events, today)
  const classes = classesOn(data.classes, today, data.settings.semester)
  const quote = QUOTES[differenceInCalendarDays(new Date(), new Date(new Date().getFullYear(), 0, 0)) % QUOTES.length]
  const n = todays.length + classes.length
  return (
    <Win title="stardesk.exe">
      <h1 className="hero-title">
        {greeting()}
        {name ? `, ${name}` : ''}! <PixelStar size={30} className="inline-star" />
      </h1>
      <p className="hero-sub">
        {format(new Date(), 'EEEE, d MMMM yyyy')} · 🌙 {formatHijri(new Date(), data.settings.hijriAdj)} · {n} thing{n === 1 ? '' : 's'} on today
      </p>
      <p className="quote">“{quote}”</p>
      <div className="row wrap">
        <button className="btn" onClick={() => openForm({ date: today })}>
          + Plan something
        </button>
        <button className="btn ghost" onClick={() => go('study')}>
          ▶ Start focus timer
        </button>
        <button className="btn ghost" onClick={() => go('zoo')}>
          🐸 Play Pixel Zoo
        </button>
      </div>
    </Win>
  )
}

function StudyLinksWidget() {
  const { setUi } = useStore()
  return (
    <Win title="Study time">
      <ul className="launch">
        <li>
          <button
            onClick={() => {
              setUi({ plannerView: 'week', plannerDate: todayStr() })
              go('planner')
            }}
          >
            <span className="lico">📝</span>Study schedule
          </button>
        </li>
        <li>
          <button onClick={() => go('study')}>
            <span className="lico">⏱️</span>Study time tracker
          </button>
        </li>
        <li>
          <button onClick={() => go('habits')}>
            <span className="lico">⭐</span>Study tracker
          </button>
        </li>
      </ul>
    </Win>
  )
}

function ClassesWidget() {
  const { data } = useStore()
  const classes = classesOn(data.classes, todayStr(), data.settings.semester)
  return (
    <Win title="Classes">
      <button className="bigbtn" onClick={() => go('classes')}>
        courses overview
      </button>
      {classes.length === 0 ? (
        <p className="muted tiny">No classes today (Semester {data.settings.semester}).</p>
      ) : (
        classes.map((c) => (
          <p key={c.id} className="classline small" style={{ '--cat': c.color }}>
            <b>{c.name}</b>
            <span>{fmtTime(c.start)}</span>
          </p>
        ))
      )}
    </Win>
  )
}

function TodayWidget({ openForm }) {
  const { data } = useStore()
  const today = todayStr()
  const todays = eventsOn(data.events, today)
  return (
    <Win title="Today">
      {todays.length === 0 && <Empty>Nothing planned – add something? ✨</Empty>}
      <div className="stack">
        {todays.slice(0, 5).map((ev) => (
          <EventRow key={ev.id} ev={ev} ds={today} onEdit={openForm} compact />
        ))}
      </div>
      {todays.length > 5 && <p className="muted tiny">+{todays.length - 5} more in the planner</p>}
    </Win>
  )
}

function VibeWidget() {
  const { data, set } = useStore()
  const today = todayStr()
  const mood = data.mood[today]
  const saved = data.moodNotes?.[today] || ''
  const [note, setNote] = useState(saved)
  return (
    <Win title="vibe.png">
      <Sky id="vibe" pole label="Pastel sky with a power line" />
      <p className="muted tiny center" style={{ marginTop: '.6rem' }}>
        How are you feeling today?
      </p>
      <div className="moods" role="radiogroup" aria-label="Today's mood">
        {MOODS.map(([e, label], i) => (
          <button
            key={e}
            role="radio"
            aria-checked={mood === i + 1}
            aria-label={label}
            title={label}
            className={mood === i + 1 ? 'on' : ''}
            onClick={() => set('mood', (m) => ({ ...m, [today]: i + 1 }))}
          >
            {e}
          </button>
        ))}
      </div>
      <form
        className="row vibe-note"
        onSubmit={(e) => {
          e.preventDefault()
          const t = note.trim()
          set('moodNotes', (m) => {
            const n = { ...m }
            if (t) n[today] = t
            else delete n[today]
            return n
          })
          if (t && !mood) set('mood', (m) => ({ ...m, [today]: 3 }))
        }}
      >
        <input className="grow" maxLength={140} value={note} placeholder="One line about today…" aria-label="One line about today" onChange={(e) => setNote(e.target.value)} />
        <button className="btn small" type="submit" disabled={note.trim() === saved}>
          Save
        </button>
      </form>
      <button className="linkbtn" onClick={() => go('mood')}>
        Mood journal &amp; calendar →
      </button>
    </Win>
  )
}

function ImportantWidget() {
  const { data } = useStore()
  const today = todayStr()
  const next = [...data.keyDates].filter((k) => k.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0]
  return (
    <Win title="Important!!!">
      <div className="row wrap">
        <button className="bigbtn" onClick={() => go('dates')}>
          Key dates!
        </button>
        <button className="bigbtn" onClick={() => go('dates')}>
          Exam timetable
        </button>
      </div>
      {next ? (
        <p className="nextkey">
          ⭐ Next: <b>{next.title}</b> – {format(parseISO(next.date), 'd MMM')} <em className={`pill ${countdown(next.date).tone}`}>{countdown(next.date).text}</em>
        </p>
      ) : (
        <p className="muted tiny">Add exams and deadlines to see a countdown here.</p>
      )}
    </Win>
  )
}

function NumbersWidget() {
  const { data } = useStore()
  const today = todayStr()
  const openTasks = data.tasks.filter((t) => !t.done)
  const habitsDone = data.habits.filter((h) => h.log[today]).length
  const focus = data.sessions.filter((s) => s.date === today).reduce((a, s) => a + s.min, 0)
  return (
    <Win title="My day in numbers">
      <ul className="stats">
        <li>
          <b>{openTasks.length}</b>
          <span>open tasks</span>
        </li>
        <li>
          <b>
            {habitsDone}/{data.habits.length}
          </b>
          <span>habits today</span>
        </li>
        <li>
          <b>{overallStreak(data)}🔥</b>
          <span>day streak</span>
        </li>
      </ul>
      <p className="tiny muted">
        Focus today: {focus}/{data.settings.goal} min
      </p>
      <Progress value={focus} max={data.settings.goal} label="Daily focus goal" />
    </Win>
  )
}

function NotesWidget() {
  const { setUi } = useStore()
  return (
    <Win title="Notes">
      <div className="folders">
        {PAPERS.map(([id, label]) => (
          <button
            key={id}
            className="folder"
            onClick={() => {
              setUi({ paper: id, noteId: null })
              go('notes')
            }}
            aria-label={`Open ${label} notes`}
          >
            <Folder kind={id} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </Win>
  )
}

function TimetableWidget() {
  const { setSetting } = useStore()
  return (
    <Win title="Timetable">
      {[1, 2].map((n) => (
        <button
          key={n}
          className="semlink"
          onClick={() => {
            setSetting('semester', n)
            go('classes')
          }}
        >
          Semester {n}
        </button>
      ))}
      <Moon size={54} className="moon-in" />
    </Win>
  )
}

function AppsWidget() {
  const { data } = useStore()
  const pinned = APPS.filter((a) => a.ready && (data.pins || []).includes(a.id)).slice(0, 6)
  return (
    <Win title="My apps">
      {pinned.length === 0 ? (
        <p className="muted tiny">Pin your favourite apps with ☆ in the launcher and they show up here.</p>
      ) : (
        <ul className="launch">
          {pinned.map((a) => (
            <li key={a.id}>
              <button onClick={() => go(a.id)}>
                <span className="lico">{a.emoji}</span>
                {a.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      <button className="bigbtn" style={{ marginTop: '.6rem', marginBottom: 0 }} onClick={() => go('apps')}>
        All apps →
      </button>
    </Win>
  )
}

// id -> component. New apps in later steps add their widget here + one line in lib/widgets.js.
const WIDGET_VIEWS = {
  hero: HeroWidget,
  zoo: ZooWidget,
  studylinks: StudyLinksWidget,
  classes: ClassesWidget,
  today: TodayWidget,
  vibe: VibeWidget,
  important: ImportantWidget,
  numbers: NumbersWidget,
  notes: NotesWidget,
  player: MoodPlayer,
  timetable: TimetableWidget,
  apps: AppsWidget,
  prayer: PrayerWidget,
  weather: WeatherWidget,
  countdowns: CountdownsWidget,
  clock: ClockWidget,
  meals: MealsWidget,
  bills: BillsWidget,
  birthdays: BirthdaysWidget,
  budget: BudgetWidget,
  chores: ChoresWidget,
  water: WaterWidget,
  medicine: MedicineWidget,
  cycle: CycleWidget,
  breathe: BreatheWidget,
  priorities: PrioritiesWidget,
  routines: RoutinesWidget,
  jobs: JobsWidget,
  freelance: FreelanceWidget,
  quote: QuoteWidget,
  gratitude: GratitudeWidget,
  goals: GoalsWidget,
  reading: ReadingWidget,
}

const titleOf = (id) => WIDGETS.find((w) => w.id === id)

function CustomizeBar({ editing, setEditing, layout, apply }) {
  const r = resolveLayout(layout)
  if (!editing)
    return (
      <div className="home-tools">
        <button className="btn small ghost" onClick={() => setEditing(true)}>
          ✎ Customize Home
        </button>
      </div>
    )
  return (
    <section className="win customize" aria-label="Customize Home">
      <header className="win-bar">
        <h2>Customize Home</h2>
      </header>
      <div className="win-body">
        <p className="hint" style={{ marginTop: 0 }}>
          Drag windows (or use ◀ ▶) to reorder, － ＋ to change width, ✕ to hide.
        </p>
        {r.hiddenList.length > 0 && (
          <div className="stack">
            <p className="tiny muted">Hidden windows – tap to bring back:</p>
            <div className="row wrap">
              {r.hiddenList.map((id) => (
                <button key={id} className="btn small ghost" onClick={() => apply(showWidget(layout, id))}>
                  + {titleOf(id).emoji} {titleOf(id).title}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="row wrap" style={{ marginTop: '.7rem' }}>
          <button className="btn small" onClick={() => setEditing(false)}>
            ✓ Done
          </button>
          <button className="btn small ghost" onClick={() => window.confirm('Reset Home to the original layout?') && apply(emptyLayout())}>
            Reset layout
          </button>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const { data, set } = useStore()
  const [form, setForm] = useState(null)
  const [editing, setEditing] = useState(false)
  const [dragId, setDragId] = useState(null)
  const layout = data.layout?.home
  const r = resolveLayout(layout)
  const apply = (next) => set('layout', (l) => ({ ...l, home: next }))

  return (
    <>
      <CustomizeBar editing={editing} setEditing={setEditing} layout={layout} apply={apply} />
      <div className="grid12">
        {r.visible.map(({ id, span }, i) => {
          const View = WIDGET_VIEWS[id]
          if (!View) return null
          if (!editing) {
            return (
              <div key={id} className={`wslot c${span}`}>
                <View openForm={setForm} />
              </div>
            )
          }
          return (
            <div
              key={id}
              className={`wslot c${span} editing ${dragId === id ? 'dragging' : ''}`}
              draggable
              onDragStart={(e) => {
                setDragId(id)
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('text/plain', id)
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                if (dragId) apply(reorderTo(layout, dragId, id))
                setDragId(null)
              }}
              onDragEnd={() => setDragId(null)}
            >
              <div className="wtools" role="toolbar" aria-label={`${titleOf(id).title} controls`}>
                <span className="wname">
                  {titleOf(id).emoji} {titleOf(id).title}
                </span>
                <button type="button" aria-label="Move earlier" disabled={i === 0} onClick={() => apply(moveBy(layout, id, -1))}>
                  ◀
                </button>
                <button type="button" aria-label="Move later" disabled={i === r.visible.length - 1} onClick={() => apply(moveBy(layout, id, 1))}>
                  ▶
                </button>
                <button type="button" aria-label="Narrower" disabled={span === SPANS[0]} onClick={() => apply(resizeWidget(layout, id, -1))}>
                  －
                </button>
                <button type="button" aria-label="Wider" disabled={span === SPANS[SPANS.length - 1]} onClick={() => apply(resizeWidget(layout, id, 1))}>
                  ＋
                </button>
                <button type="button" aria-label="Hide window" onClick={() => apply(hideWidget(layout, id))}>
                  ✕
                </button>
              </div>
              <div className="wcontent" inert="">
                <View openForm={setForm} />
              </div>
            </div>
          )
        })}
      </div>
      {r.visible.length === 0 && (
        <p className="empty center" style={{ margin: '2rem 0' }}>
          All windows are hidden. Tap “Customize Home” to bring some back.
        </p>
      )}

      <About />
      {form && <EventForm initial={form} onClose={() => setForm(null)} />}
    </>
  )
}

function MoodPlayer() {
  const [kind, setKind] = useState(ambientNow())
  const [vol, setVol] = useState(0.4)
  const idx = Math.max(0, SOUNDS.findIndex((s) => s.id === (kind || SOUNDS[0].id)))
  const play = (id) => {
    if (playAmbient(id)) setKind(id)
  }
  const toggle = () => {
    if (kind) {
      stopAmbient()
      setKind(null)
    } else play(SOUNDS[idx].id)
  }
  const step = (d) => play(SOUNDS[(idx + d + SOUNDS.length) % SOUNDS.length].id)
  return (
    <Win title="mood.mp3">
      <Sky id="mood" clouds label="Pastel sky with clouds" />
      <p className="track" aria-live="polite">
        {SOUNDS[idx].emoji} {SOUNDS[idx].label} {kind ? '· playing' : '· paused'}
      </p>
      <div className="player">
        <button aria-label="Previous sound" onClick={() => step(-1)}>
          ⏮
        </button>
        <button aria-label={kind ? 'Pause ambient sound' : 'Play ambient sound'} onClick={toggle}>
          {kind ? '⏸' : '▶'}
        </button>
        <button aria-label="Next sound" onClick={() => step(1)}>
          ⏭
        </button>
        <input
          type="range"
          min="0.05"
          max="1"
          step="0.05"
          value={vol}
          aria-label="Volume"
          onChange={(e) => {
            setVol(Number(e.target.value))
            setAmbientVolume(Number(e.target.value))
          }}
        />
      </div>
    </Win>
  )
}

const FEATURES = [
  ['🗓️', 'Day, week & month planner', 'Switch between three clear views, add events in seconds and tick them off as you go.'],
  ['🔔', 'Reminders that actually ring', 'Choose a reminder per event – in-app alerts, a friendly chime and optional browser notifications.'],
  ['🔁', 'Repeating events', 'Daily, weekdays, weekly or monthly – set your routine once and forget about it.'],
  ['⏱️', 'Focus timer & study log', 'Pomodoro sessions, a daily goal and a 7-day chart show how much you really study.'],
  ['🎓', 'Classes & timetable', 'Organise two semesters of courses with teachers, rooms and times in a neat weekly timetable.'],
  ['📝', 'Exams & key dates', 'Countdowns to every exam and deadline, with a heads-up the day before and on the day.'],
  ['✅', 'To-do list & habits', 'Priorities, due dates, habit streaks and a daily mood check-in in one place.'],
  ['📒', 'Notes on 4 paper styles', 'Blank, lined, grid or dotted pages that save automatically and show up in search.'],
  ['🏠', 'Daily life apps', 'Meal planner with grocery list, shopping and packing lists, home chores, budget tracker, bills, birthdays and a travel planner.'],
  ['🍀', 'Health & wellness', 'Water and sleep tracker, workout log, medicine reminders, breathing timer, mood journal heatmap and a private cycle tracker.'],
  ['💼', 'Work & career', 'Job application tracker, freelance projects with invoices and a time tracker, meeting notes, Eisenhower matrix and weekly priorities.'],
  ['🌱', 'Goals & personal growth', 'Vision board, gratitude journal, reading list, watchlist, bucket list with confetti, daily quote and a time capsule.'],
  ['🕌', 'Prayer times & world clock', 'Prayer times and Hijri date for your city (works offline), world clock, weather and countdowns to Eid or your next trip.'],
  ['🧩', 'Make Home yours', 'Hide, reorder and resize the Home widgets so your desk shows only what you need.'],
  ['🔒', 'Private & offline-friendly', 'No account, no tracking. Your data stays in your browser, with backup and restore any time.'],
]

const FAQ = [
  ['Is Stardesk free to use?', 'Yes. Stardesk is completely free, has no ads and does not need an account or sign-up.'],
  ['Where is my data stored?', 'Everything is saved locally in your own browser, so nothing is uploaded to a server. Use Settings → Export backup to keep a copy or move to another device.'],
  ['How do reminders work?', 'Pick a reminder when you create an event. While Stardesk is open in a tab you get an alert, a chime and (if allowed) a browser notification. Key dates also alert you the day before and on the day.'],
  ['Can I use it on my phone?', 'Yes. The layout adapts to any screen size and you can add Stardesk to your home screen from your browser menu to use it like an app.'],
  ['Does it show prayer times and the Hijri date?', 'Yes. Prayer times are calculated on your device for your city, method and madhab, so they work offline. You can shift the Hijri date by a day to match moon sighting.'],
  ['Is my cycle tracker or time capsule private?', 'Yes. They are saved only in this browser, are left out of search, and you can choose to exclude them when you export a backup.'],
  ['Does anything leave my device?', 'Only the live weather widget: the coordinates of your chosen city go to the free Open-Meteo service to get the forecast. Your planner data is never sent anywhere.'],
  ['How do I change the colours?', 'Tap the 🎨 button in the top bar (or go to Settings) and pick one of 11 themes. Pink Pixel is the default; Ocean Blue, Fresh Green, Sunset Orange, Warm Sand and Silver Gray are the other light looks, and Galaxy Night, Midnight Blue, Emerald Night, Ember Dark and Graphite Black are the dark ones. Your choice is saved in this browser.'],
]

function About() {
  return (
    <section className="about" aria-labelledby="why">
      <h2 id="why">Why Stardesk? One cute planner for your whole day</h2>
      <p className="lead">
        Stardesk is a free online planner built for students and busy people who want their daily planner, weekly planner, monthly calendar, to-do list,
        habit tracker, study timer, budget, meal planner, health logs and goals in one friendly place – with a pixel-art look that makes planning fun.
      </p>
      <div className="feat">
        {FEATURES.map(([e, t, d]) => (
          <article key={t} className="win">
            <div className="win-body">
              <h3>
                <span>{e}</span> {t}
              </h3>
              <p>{d}</p>
            </div>
          </article>
        ))}
      </div>

      <h2>How it works</h2>
      <ol className="steps">
        <li>
          <b>Add</b> your classes, exams and plans.
        </li>
        <li>
          <b>Get reminded</b> so nothing slips through the cracks.
        </li>
        <li>
          <b>Focus & track</b> habits and study time to build your streak.
        </li>
      </ol>

      <h2>Frequently asked questions</h2>
      <div className="faq">
        {FAQ.map(([q, a]) => (
          <details key={q} className="win">
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}