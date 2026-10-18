import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { KEY, loadData, migrate } from './schema'
import { getTheme, normalizeTheme } from './themes'

export { uid, migrate, KEY, KEY_V1 } from './schema'

const Ctx = createContext(null)

export function StoreProvider({ children }) {
  const [data, setData] = useState(loadData)
  const [toasts, setToasts] = useState([])
  const [ui, setUiState] = useState({
    plannerDate: format(new Date(), 'yyyy-MM-dd'),
    plannerView: 'day',
    paper: 'all',
    noteId: null,
  })

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data))
    } catch {
      /* storage full or blocked - app keeps working in memory */
    }
  }, [data])

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === KEY && e.newValue) {
        try {
          setData(migrate(JSON.parse(e.newValue)))
        } catch {
          /* ignore */
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    const t = getTheme(normalizeTheme(data.settings.theme))
    document.documentElement.dataset.theme = t.id
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', t.meta)
  }, [data.settings.theme])

  const set = useCallback(
    (key, next) => setData((d) => ({ ...d, [key]: typeof next === 'function' ? next(d[key]) : next })),
    []
  )
  const setSetting = useCallback(
    (k, v) => setData((d) => ({ ...d, settings: { ...d.settings, [k]: v } })),
    []
  )
  const replaceAll = useCallback((next) => setData(migrate(next)), [])
  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const toast = useCallback((msg, kind = 'info') => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts((t) => [...t, { id, msg, kind }].slice(-4))
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 8000)
  }, [])
  const setUi = useCallback((patch) => setUiState((u) => ({ ...u, ...patch })), [])

  const value = useMemo(
    () => ({ data, set, setSetting, replaceAll, toast, toasts, dismissToast, ui, setUi }),
    [data, set, setSetting, replaceAll, toast, toasts, dismissToast, ui, setUi]
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)