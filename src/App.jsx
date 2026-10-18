import { useEffect, useRef, useState } from 'react'
import { ThemeDecor } from './components/decor'
import ErrorBoundary from './components/ErrorBoundary'
import Search from './components/Search'
import Toasts from './components/Toasts'
import { ConfettiLayer } from './components/shared'
import { THEMES, getTheme, normalizeTheme } from './lib/themes'
import { ROUTES, go, isAppRoute, routeLabel, useRoute } from './lib/nav'
import { useReminders } from './lib/reminders'
import { useStore } from './lib/store'
import { mmss, useTimer } from './lib/timer'
import Apps from './views/Apps'
import Birthdays from './views/Birthdays'
import Bills from './views/Bills'
import Bucket from './views/Bucket'
import Breathe from './views/Breathe'
import Budget from './views/Budget'
import Capsule from './views/Capsule'
import Chores from './views/Chores'
import Classes from './views/Classes'
import Clock from './views/Clock'
import Countdowns from './views/Countdowns'
import Cycle from './views/Cycle'
import Dates from './views/Dates'
import Eisenhower from './views/Eisenhower'
import Freelance from './views/Freelance'
import Goals from './views/Goals'
import Gratitude from './views/Gratitude'
import Habits from './views/Habits'
import Home from './views/Home'
import Jobs from './views/Jobs'
import Lists from './views/Lists'
import Meals from './views/Meals'
import Meetings from './views/Meetings'
import Medicine from './views/Medicine'
import Mood from './views/Mood'
import Notes from './views/Notes'
import Planner from './views/Planner'
import Prayer from './views/Prayer'
import Quotes from './views/Quotes'
import Reading from './views/Reading'
import Priorities from './views/Priorities'
import Routines from './views/Routines'
import Settings from './views/Settings'
import Study from './views/Study'
import Tasks from './views/Tasks'
import Travel from './views/Travel'
import Water from './views/Water'
import Watchlist from './views/Watchlist'
import Weather from './views/Weather'
import Workout from './views/Workout'
import Zoo from './views/Zoo'

// Route id -> page. When a new app ships (steps 2-10), add it here and set ready: true in lib/apps.js.
const VIEWS = {
  home: Home,
  apps: Apps,
  clock: Clock,
  prayer: Prayer,
  weather: Weather,
  countdowns: Countdowns,
  meals: Meals,
  lists: Lists,
  chores: Chores,
  budget: Budget,
  bills: Bills,
  birthdays: Birthdays,
  travel: Travel,
  water: Water,
  workout: Workout,
  medicine: Medicine,
  cycle: Cycle,
  breathe: Breathe,
  mood: Mood,
  jobs: Jobs,
  freelance: Freelance,
  meetings: Meetings,
  eisenhower: Eisenhower,
  priorities: Priorities,
  routines: Routines,
  goals: Goals,
  gratitude: Gratitude,
  reading: Reading,
  watchlist: Watchlist,
  bucket: Bucket,
  quotes: Quotes,
  capsule: Capsule,
  planner: Planner,
  tasks: Tasks,
  habits: Habits,
  study: Study,
  classes: Classes,
  dates: Dates,
  notes: Notes,
  zoo: Zoo,
  settings: Settings,
}

const HOME_TITLE = 'Stardesk – Free Pixel Life Planner: Daily Planner, Habits, Budget, Prayer Times & 30+ Mini Apps'

export default function App() {
  const route = useRoute()
  const { data, setSetting } = useStore()
  const timer = useTimer()
  const [searching, setSearching] = useState(false)
  useReminders()

  useEffect(() => {
    const label = routeLabel(route)
    const base = route === 'home' ? HOME_TITLE : `${label} · Stardesk`
    document.title = timer.running ? `${mmss(timer.left)} ${timer.mode === 'focus' ? '🎯' : '☕'} ${base}` : base
  }, [route, timer.running, timer.left, timer.mode])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearching(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // keep the active top-bar tab visible when the tab strip scrolls (phones)
  useEffect(() => {
    const nav = document.querySelector('.tabnav')
    const on = nav?.querySelector('.tab.on')
    if (nav && on) nav.scrollTo({ left: on.offsetLeft - (nav.clientWidth - on.offsetWidth) / 2, behavior: 'smooth' })
  }, [route])

  const View = VIEWS[route] || Apps
  const onAppPage = isAppRoute(route)
  const theme = getTheme(normalizeTheme(data.settings.theme))
  const [themeOpen, setThemeOpen] = useState(false)
  const themeRef = useRef(null)
  useEffect(() => {
    if (!themeOpen) return
    const close = (e) => {
      if (e.type === 'keydown' ? e.key === 'Escape' : !themeRef.current?.contains(e.target)) setThemeOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [themeOpen])
  const tabOn = (id) => route === id || (id === 'apps' && onAppPage)

  return (
    <>
      <div className="bg" aria-hidden="true">
        <div className="bg-grid" />
        <div className="bg-nebula" />
        <div className="stars s1" />
        <div className="stars s2" />
        <div className="stars s3" />
      </div>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <div className="tabs">
          <button className="tab search" aria-label="Search (Ctrl+K)" onClick={() => setSearching(true)}>
            🔍
          </button>
          <nav className="tabnav" aria-label="Main">
            {ROUTES.map(([id, label]) => (
              <a key={id} href={`#${id}`} className={`tab ${tabOn(id) ? 'on' : ''}`} aria-current={route === id ? 'page' : undefined} onClick={() => window.scrollTo({ top: 0 })}>
                {label}
                {id === 'zoo' && <span className="newpill">NEW</span>}
              </a>
            ))}
          </nav>
          <div className="themewrap" ref={themeRef}>
            <button
              className="tab theme"
              aria-label={`Change theme (current: ${theme.name})`}
              aria-haspopup="true"
              aria-expanded={themeOpen}
              title={`Theme: ${theme.name}`}
              onClick={() => setThemeOpen((o) => !o)}
            >
              🎨
            </button>
            {themeOpen && (
              <div className="thememenu" role="menu" aria-label="Choose a theme">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    role="menuitemradio"
                    aria-checked={theme.id === t.id}
                    className={theme.id === t.id ? 'on' : ''}
                    onClick={() => {
                      setSetting('theme', t.id)
                      setThemeOpen(false)
                    }}
                  >
                    <span className="sw" aria-hidden="true">
                      {t.swatch.map((c) => (
                        <i key={c} style={{ background: c }} />
                      ))}
                    </span>
                    <span>{t.name}</span>
                    {theme.id === t.id && <span className="tick">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <ThemeDecor theme={theme.id} />
      <main id="main" className="page" key={route}>
        {onAppPage && (
          <a className="backlink" href="#apps">
            ← All apps
          </a>
        )}
        <ErrorBoundary key={route}>
          <View />
        </ErrorBoundary>
      </main>

      <footer className="foot">
        <p>
          <b>Stardesk</b> · free pixel life planner · your data stays in your browser ✦{' '}
          <a href="#settings" onClick={() => go('settings')}>
            backup &amp; settings
          </a>
        </p>
        <p className="foot-credit">
          © {new Date().getFullYear()} Stardesk. All rights reserved. · Built by <b>LAKhan</b>
        </p>
      </footer>
      {searching && <Search onClose={() => setSearching(false)} />}
      <Toasts />
      <ConfettiLayer />
    </>
  )
}