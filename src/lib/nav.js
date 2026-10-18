import { useEffect, useState } from 'react'
import { APPS } from './apps'

// Tabs shown in the top bar. Everything else lives behind "Apps".
export const ROUTES = [
  ['home', 'Home'],
  ['planner', 'Planner'],
  ['tasks', 'Tasks'],
  ['habits', 'Habits'],
  ['study', 'Study'],
  ['classes', 'Classes'],
  ['dates', 'Key dates'],
  ['notes', 'Notes'],
  ['zoo', 'Pixel Zoo'],
  ['apps', 'Apps'],
  ['settings', 'Settings'],
]

const isTab = (r) => ROUTES.some(([id]) => id === r)
const isReadyApp = (r) => APPS.some((a) => a.id === r && a.ready)
const isKnownApp = (r) => APPS.some((a) => a.id === r)

// An app page that is not a top-bar tab (so the Apps tab should light up).
export const isAppRoute = (r) => !isTab(r) && isReadyApp(r)

export const routeLabel = (r) => ROUTES.find(([id]) => id === r)?.[1] || APPS.find((a) => a.id === r)?.label || ''

const read = () => {
  const r = window.location.hash.replace(/^#\/?/, '')
  if (isTab(r) || isReadyApp(r)) return r
  return isKnownApp(r) ? 'apps' : 'home' // apps that are not built yet open the launcher
}

export function go(route) {
  window.location.hash = `#${route}`
  window.scrollTo({ top: 0 })
}

export function useRoute() {
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const on = () => setRoute(read())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}