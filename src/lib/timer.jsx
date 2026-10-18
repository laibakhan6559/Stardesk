import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { beep, notify } from './sound'
import { todayStr } from './dates'
import { uid, useStore } from './store'

const TimerCtx = createContext(null)

export function TimerProvider({ children }) {
  const { data, set, toast } = useStore()
  const [t, setT] = useState({
    mode: 'focus',
    running: false,
    endAt: 0,
    left: 25 * 60,
    focusMin: 25,
    breakMin: 5,
    subject: '',
  })
  const ref = useRef(t)
  ref.current = t
  const dataRef = useRef(data)
  dataRef.current = data

  const finish = useCallback(() => {
    const c = ref.current
    const s = dataRef.current.settings
    if (c.mode === 'focus') {
      set('sessions', (list) =>
        [...list, { id: uid(), date: todayStr(), min: c.focusMin, subject: c.subject || 'General' }].slice(-500)
      )
      toast(`Focus session complete! +${c.focusMin} min ⭐`, 'ok')
      if (s.notif) notify('Focus session complete ⭐', 'Time for a little break.')
    } else {
      toast('Break is over – ready for another round? 🚀', 'info')
      if (s.notif) notify('Break is over', 'Ready for another focus round?')
    }
    if (s.sound) beep()
    const next = c.mode === 'focus' ? 'break' : 'focus'
    setT({ ...c, mode: next, running: false, endAt: 0, left: (next === 'focus' ? c.focusMin : c.breakMin) * 60 })
  }, [set, toast])

  useEffect(() => {
    if (!t.running) return undefined
    const id = setInterval(() => {
      const left = Math.round((ref.current.endAt - Date.now()) / 1000)
      if (left <= 0) finish()
      else setT((x) => (x.running ? { ...x, left } : x))
    }, 400)
    return () => clearInterval(id)
  }, [t.running, finish])

  const api = useMemo(
    () => ({
      start: () => setT((x) => ({ ...x, running: true, endAt: Date.now() + x.left * 1000 })),
      pause: () =>
        setT((x) => ({ ...x, running: false, left: Math.max(1, Math.round((x.endAt - Date.now()) / 1000)) })),
      reset: () =>
        setT((x) => ({ ...x, running: false, endAt: 0, left: (x.mode === 'focus' ? x.focusMin : x.breakMin) * 60 })),
      setMode: (mode) =>
        setT((x) => ({ ...x, mode, running: false, endAt: 0, left: (mode === 'focus' ? x.focusMin : x.breakMin) * 60 })),
      setMinutes: (min) =>
        setT((x) =>
          x.mode === 'focus'
            ? { ...x, focusMin: min, running: false, endAt: 0, left: min * 60 }
            : { ...x, breakMin: min, running: false, endAt: 0, left: min * 60 }
        ),
      setSubject: (subject) => setT((x) => ({ ...x, subject })),
      skip: finish,
    }),
    [finish]
  )

  const value = useMemo(() => ({ ...t, ...api }), [t, api])
  return <TimerCtx.Provider value={value}>{children}</TimerCtx.Provider>
}

export const useTimer = () => useContext(TimerCtx)

export const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
