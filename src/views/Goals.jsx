import { useRef, useState } from 'react'
import { TickList, confettiFrom, fireConfetti } from '../components/shared'
import { Empty, Field, PageTitle, Progress, Win } from '../components/ui'
import { GOAL_EMOJIS, goalProgress } from '../lib/growth'
import { uid, useStore } from '../lib/store'

const COLORS = ['#ff9bc8', '#b58cf5', '#7f9bf0', '#3fc7e0', '#59c98d', '#f5b84b', '#ff8a7a']
const VISION_EMOJIS = ['🌴', '🏡', '🚗', '💍', '🎓', '💻', '✈️', '🌟', '📚', '🎨', '💪', '🕋']
const SIZE = 40 // vision images are shrunk to 40x40 pixels, which keeps storage tiny and looks pixel-style

// Reads a picture file and returns a small pixelated PNG data URL (centre-cropped square).
function pixelate(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const cv = document.createElement('canvas')
      cv.width = cv.height = SIZE
      const ctx = cv.getContext('2d')
      const s = Math.min(img.width, img.height)
      ctx.imageSmoothingEnabled = true
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, SIZE, SIZE)
      URL.revokeObjectURL(url)
      resolve(cv.toDataURL('image/png'))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('bad image'))
    }
    img.src = url
  })
}

function Goals({ year, setYear }) {
  const { data, set } = useStore()
  const [f, setF] = useState({ title: '', emoji: GOAL_EMOJIS[0], why: '' })
  const thisYear = new Date().getFullYear()
  const years = [...new Set([thisYear, thisYear + 1, ...data.goals.map((g) => g.year)])].sort()
  const list = data.goals.filter((g) => g.year === year)

  const add = (e) => {
    e.preventDefault()
    if (!f.title.trim()) return
    set('goals', (l) => [...l, { id: uid(), title: f.title.trim(), emoji: f.emoji, year, why: f.why.trim(), done: false, milestones: [] }].slice(0, 100))
    setF({ ...f, title: '', why: '' })
  }
  const up = (id, fn) => set('goals', (l) => l.map((g) => (g.id === id ? fn(g) : g)))
  const toggleDone = (g, e) => {
    up(g.id, (x) => ({ ...x, done: !x.done }))
    if (!g.done) confettiFrom(e, 'confetti')
  }
  const del = (g) => window.confirm(`Delete goal “${g.title}”?`) && set('goals', (l) => l.filter((x) => x.id !== g.id))

  return (
    <div className="grid12">
      <div className="c8 stack-lg">
        <div className="seg small wrapseg" role="tablist" aria-label="Year">
          {years.map((y) => (
            <button key={y} role="tab" aria-selected={year === y} className={year === y ? 'on' : ''} onClick={() => setYear(y)}>
              {y}
            </button>
          ))}
        </div>
        {list.length === 0 && (
          <Win title={`Goals ${year}`}>
            <Empty>No goals for {year} yet. Add one from the right ➜</Empty>
          </Win>
        )}
        <div className="goalgrid">
          {list.map((g) => {
            const p = goalProgress(g)
            return (
              <Win key={g.id} title={`${g.emoji} ${g.title}`} className={g.done ? 'goal-done' : ''}>
                {g.why && <p className="tiny muted">💭 {g.why}</p>}
                <div className="rt-top">
                  <span className="tiny muted">{g.done ? 'Achieved 🎉' : p.total ? `${p.done}/${p.total} milestones` : 'Add milestones'}</span>
                  <b>{p.pct}%</b>
                </div>
                <Progress value={p.pct} max={100} label={`${g.title} progress`} />
                <TickList
                  items={g.milestones}
                  placeholder="Add a milestone…"
                  empty="Break a big goal into small steps."
                  showCount={false}
                  onAdd={(text) => up(g.id, (x) => ({ ...x, milestones: [...x.milestones, { id: uid(), text, done: false }].slice(0, 30) }))}
                  onToggle={(id, done, e) => {
                    up(g.id, (x) => ({ ...x, milestones: x.milestones.map((m) => (m.id === id ? { ...m, done } : m)) }))
                    if (done) confettiFrom(e, 'stars')
                  }}
                  onRemove={(id) => up(g.id, (x) => ({ ...x, milestones: x.milestones.filter((m) => m.id !== id) }))}
                />
                <div className="row wrap" style={{ marginTop: '.6rem' }}>
                  <button className="btn small" onClick={(e) => toggleDone(g, e)}>
                    {g.done ? 'Reopen' : '🏆 Mark achieved'}
                  </button>
                  <button className="btn small ghost" onClick={() => del(g)}>
                    Delete
                  </button>
                </div>
              </Win>
            )
          })}
        </div>
      </div>
      <div className="c4">
        <Win title="New goal">
          <form className="form" onSubmit={add}>
            <Field label={`Goal for ${year}`}>
              <input required maxLength={80} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Save Rs 200,000" />
            </Field>
            <Field label="Why does it matter? (optional)">
              <input maxLength={120} value={f.why} onChange={(e) => setF({ ...f, why: e.target.value })} />
            </Field>
            <div className="emojis" role="radiogroup" aria-label="Pick an icon">
              {GOAL_EMOJIS.map((e) => (
                <button type="button" key={e} role="radio" aria-checked={f.emoji === e} className={f.emoji === e ? 'on' : ''} onClick={() => setF({ ...f, emoji: e })}>
                  {e}
                </button>
              ))}
            </div>
            <button className="btn" type="submit">
              Add goal
            </button>
          </form>
        </Win>
      </div>
    </div>
  )
}

function Vision() {
  const { data, set, toast } = useStore()
  const [cap, setCap] = useState('')
  const [emoji, setEmoji] = useState(VISION_EMOJIS[0])
  const [color, setColor] = useState(COLORS[0])
  const [img, setImg] = useState(null)
  const file = useRef(null)

  const pick = async (e) => {
    const fl = e.target.files?.[0]
    e.target.value = ''
    if (!fl) return
    try {
      setImg(await pixelate(fl))
    } catch {
      toast('This image could not be opened.', 'info')
    }
  }
  const add = (e) => {
    e.preventDefault()
    if (!cap.trim() && !img) return
    set('vision', (l) => [...l, { id: uid(), caption: cap.trim(), emoji, color, img }].slice(0, 60))
    setCap('')
    setImg(null)
    fireConfetti({ kind: 'stars', count: 25 })
  }
  const del = (v) => set('vision', (l) => l.filter((x) => x.id !== v.id))

  return (
    <div className="grid12">
      <div className="c8">
        <Win title="My vision board">
          {data.vision.length === 0 ? (
            <Empty>The board is empty. Add a picture or emoji of your dream and a short caption ➜</Empty>
          ) : (
            <ul className="vboard">
              {data.vision.map((v) => (
                <li key={v.id} style={{ '--vc': v.color }}>
                  {v.img ? <img src={v.img} alt={v.caption || 'Vision picture'} width={SIZE} height={SIZE} /> : <span className="v-emoji">{v.emoji}</span>}
                  {v.caption && <p>{v.caption}</p>}
                  <button className="x" aria-label={`Remove ${v.caption || 'tile'}`} onClick={() => del(v)}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Win>
      </div>
      <div className="c4">
        <Win title="Add to board">
          <form className="form" onSubmit={add}>
            <Field label="Caption">
              <input maxLength={50} value={cap} onChange={(e) => setCap(e.target.value)} placeholder="e.g. My own home" />
            </Field>
            <div className="emojis" role="radiogroup" aria-label="Pick an icon">
              {VISION_EMOJIS.map((e) => (
                <button type="button" key={e} role="radio" aria-checked={emoji === e} className={emoji === e ? 'on' : ''} onClick={() => setEmoji(e)}>
                  {e}
                </button>
              ))}
            </div>
            <div className="swatches" role="radiogroup" aria-label="Tile colour">
              {COLORS.map((c) => (
                <button type="button" key={c} role="radio" aria-checked={color === c} aria-label={c} className={color === c ? 'on' : ''} style={{ background: c }} onClick={() => setColor(c)} />
              ))}
            </div>
            <div className="row wrap">
              <input ref={file} type="file" accept="image/*" hidden onChange={pick} />
              <button type="button" className="btn small ghost" onClick={() => file.current?.click()}>
                🖼️ Add picture
              </button>
              {img && <img className="vprev" src={img} alt="Preview" width={SIZE} height={SIZE} />}
            </div>
            <p className="tiny muted">The picture is converted to {SIZE}×{SIZE} pixels and stays only in this browser.</p>
            <button className="btn" type="submit">
              Add tile
            </button>
          </form>
        </Win>
      </div>
    </div>
  )
}

export default function GoalsPage() {
  const [tab, setTab] = useState('goals')
  const [year, setYear] = useState(new Date().getFullYear())
  return (
    <>
      <PageTitle sub="Yearly goals, milestones and a pixel-style vision board.">Goals &amp; vision board</PageTitle>
      <div className="seg small" role="tablist">
        {[
          ['goals', '🏔️ Goals'],
          ['vision', '🖼️ Vision board'],
        ].map(([id, l]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            {l}
          </button>
        ))}
      </div>
      {tab === 'goals' ? <Goals year={year} setYear={setYear} /> : <Vision />}
    </>
  )
}