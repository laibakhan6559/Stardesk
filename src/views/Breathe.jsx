import { useEffect, useMemo, useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { BarChart, fireConfetti } from '../components/shared'
import { Empty, PageTitle, Win } from '../components/ui'
import { todayStr, ymd } from '../lib/dates'
import { DURATIONS, PATTERNS, PHASE_TEXT, breathState, lastDays, patternById } from '../lib/health'
import { beep } from '../lib/sound'
import { uid, useStore } from '../lib/store'

// A pixel-art circle drawn as square blocks. It grows and shrinks in 1/10 steps so the animation feels like a game sprite.
const GRID = 17
function useOrb() {
  return useMemo(() => {
    const c = (GRID - 1) / 2
    const out = []
    for (let y = 0; y < GRID; y++)
      for (let x = 0; x < GRID; x++) {
        const d = Math.hypot(x - c, y - c)
        if (d <= c + 0.35) out.push({ x, y, edge: d > c - 1.1, shine: x + y < GRID - 2 && d < c - 2.5 && x + y > 5 && x < c && y < c - 1 })
      }
    return out
  }, [])
}

const fmtClock = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`

export default function Breathe() {
  const { data, set, toast } = useStore()
  const [patternId, setPatternId] = useState('box')
  const [mins, setMins] = useState(3)
  const [run, setRun] = useState(false)
  const [ms, setMs] = useState(0)
  const [done, setDone] = useState(false)
  const last = useRef(0)
  const orb = useOrb()
  const pattern = patternById(patternId)
  const total = mins * 60
  const sec = ms / 1000
  const started = run || ms > 0
  const st = started ? breathState(pattern, sec) : { phase: 'in', left: 0, size: 0 }
  const size = Math.round(st.size * 10) / 10
  const scale = 0.4 + size * 0.6

  useEffect(() => {
    if (!run) return
    last.current = performance.now()
    const id = setInterval(() => {
      const n = performance.now()
      setMs((m) => m + (n - last.current))
      last.current = n
    }, 100)
    return () => clearInterval(id)
  }, [run])

  const log = (seconds) => {
    const s = Math.round(seconds)
    if (s < 30) return
    set('breath', (l) => [...l, { id: uid(), date: todayStr(), sec: s, pattern: patternId }].slice(-400))
  }

  useEffect(() => {
    if (run && ms >= total * 1000) {
      setRun(false)
      setMs(0)
      setDone(true)
      log(total)
      fireConfetti({ kind: 'stars', count: 45 })
      toast(`🫧 ${mins} minute${mins === 1 ? '' : 's'} of breathing done. Well done!`, 'ok')
      if (data.settings.sound) beep()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms, run])

  const start = () => {
    setDone(false)
    setRun(true)
  }
  const stop = () => {
    if (ms >= 30000) {
      log(ms / 1000)
      toast('Session saved. Nice one 🫧', 'ok')
    }
    setRun(false)
    setMs(0)
  }

  // stats
  const sessions = data.breath
  const week = lastDays(7)
  const chart = week.map((d) => ({ label: format(d, 'EEE'), value: Math.round(sessions.filter((s) => s.date === ymd(d)).reduce((a, s) => a + s.sec, 0) / 60) }))
  const weekMin = chart.reduce((a, d) => a + d.value, 0)
  const recent = [...sessions].reverse().slice(0, 6)

  return (
    <>
      <PageTitle sub="Guided pixel breathing. Breathe in and out along with the orb.">Breathing timer</PageTitle>
      <div className="grid12">
        <div className="c7 stack-lg">
          <Win title="🫧 Breathe">
            <div className={`orbstage ${run ? 'live' : ''}`}>
              <svg className="orb" viewBox={`0 0 ${GRID} ${GRID}`} shapeRendering="crispEdges" style={{ transform: `scale(${scale})` }} role="img" aria-label={started ? PHASE_TEXT[st.phase] : 'Breathing orb'}>
                {orb.map((p) => (
                  <rect key={`${p.x}-${p.y}`} x={p.x} y={p.y} width="1.02" height="1.02" className={p.shine ? 'o-shine' : p.edge ? 'o-edge' : 'o-fill'} />
                ))}
              </svg>
            </div>
            <p className="breath-text" aria-live="polite">
              {done ? 'Well done ✨' : started ? `${PHASE_TEXT[st.phase]}` : 'Ready when you are'}
            </p>
            <p className="breath-sub">{started ? `${st.left}s · ${fmtClock(Math.max(0, total - sec))} left` : done ? 'Your session was saved.' : `${mins} min · ${pattern.label}`}</p>

            <div className="row wrap center-row">
              {!run ? (
                <button className="btn" onClick={start}>
                  {ms > 0 ? '▶ Resume' : '▶ Start'}
                </button>
              ) : (
                <button className="btn" onClick={() => setRun(false)}>
                  ⏸ Pause
                </button>
              )}
              {started && (
                <button className="btn ghost" onClick={stop}>
                  ■ Stop
                </button>
              )}
            </div>

            <div className={started ? 'locked' : ''}>
              <p className="tiny muted center">Length</p>
              <div className="seg center" role="tablist" aria-label="Session length">
                {DURATIONS.map((d) => (
                  <button key={d} type="button" role="tab" aria-selected={mins === d} disabled={started} className={mins === d ? 'on' : ''} onClick={() => setMins(d)}>
                    {d} min
                  </button>
                ))}
              </div>
              <p className="tiny muted center">Pattern</p>
              <div className="patterns" role="radiogroup" aria-label="Breathing pattern">
                {PATTERNS.map((p) => (
                  <button key={p.id} type="button" role="radio" aria-checked={patternId === p.id} disabled={started} className={patternId === p.id ? 'on' : ''} onClick={() => setPatternId(p.id)}>
                    <b>{p.label}</b>
                    <small>{p.hint}</small>
                  </button>
                ))}
              </div>
            </div>
          </Win>
        </div>

        <div className="c5 stack-lg">
          <Win title="This week">
            <p className="big" style={{ marginBottom: '.2rem' }}>
              {weekMin}
              <small> min</small>
            </p>
            <BarChart data={chart} format={(v) => `${v}m`} label="Minutes of breathing in the last 7 days" />
          </Win>
          <Win title="Recent sessions">
            {recent.length === 0 ? (
              <Empty>Start your first session 🫧 (sessions under 30 seconds are not saved).</Empty>
            ) : (
              <ul className="wclist">
                {recent.map((s) => (
                  <li key={s.id}>
                    <span>{format(parseISO(s.date), 'EEE d MMM')}</span>
                    <b>
                      {fmtClock(s.sec)} · {patternById(s.pattern).label.split(' ')[0]}
                    </b>
                  </li>
                ))}
              </ul>
            )}
          </Win>
        </div>
      </div>
    </>
  )
}