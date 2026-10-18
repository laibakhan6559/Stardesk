import { useEffect, useState } from 'react'

// Re-renders every `ms` milliseconds (and when the tab becomes visible again).
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const tick = () => setNow(new Date())
    const id = setInterval(tick, ms)
    const vis = () => document.visibilityState === 'visible' && tick()
    document.addEventListener('visibilitychange', vis)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', vis)
    }
  }, [ms])
  return now
}