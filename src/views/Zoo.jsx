import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { confettiFrom } from '../components/shared'
import { Empty, PageTitle, Win } from '../components/ui'
import { KINDS, H, W, createWorld, kindById } from '../lib/zooWorld'
import { uid, useStore } from '../lib/store'
import './zoo.css'

const MAX_DRAWINGS = 40
const PAD_W = 600 // drawing canvas resolution (shown smaller on screen, so lines stay smooth)
const PAD_H = 400
const COLORS = ['#33243d', '#e5484d', '#ff8a3d', '#ffd23f', '#3ecf7b', '#2f7fd6', '#8a5cf6', '#ff6fb0', '#8a5a3c', '#ffffff']

// Paint-bucket: fills the closed area under (px, py). On an empty (transparent) spot it fills every connected
// empty pixel, so draw an outline first and tap inside it. On a coloured spot it recolours that coloured area.
function floodFill(ctx, px, py, hex) {
  const img = ctx.getImageData(0, 0, PAD_W, PAD_H)
  const d = img.data
  const x0 = Math.floor(px)
  const y0 = Math.floor(py)
  if (x0 < 0 || y0 < 0 || x0 >= PAD_W || y0 >= PAD_H) return false
  const at = (x, y) => (y * PAD_W + x) * 4
  const i0 = at(x0, y0)
  const tr = d[i0]
  const tg = d[i0 + 1]
  const tb = d[i0 + 2]
  const ta = d[i0 + 3]
  const empty = ta < 50
  const fr = parseInt(hex.slice(1, 3), 16)
  const fg = parseInt(hex.slice(3, 5), 16)
  const fb = parseInt(hex.slice(5, 7), 16)
  if (!empty && ta > 200 && Math.abs(tr - fr) + Math.abs(tg - fg) + Math.abs(tb - fb) < 6) return false
  const match = (i) => (empty ? d[i + 3] < 50 : d[i + 3] >= 50 && Math.abs(d[i] - tr) + Math.abs(d[i + 1] - tg) + Math.abs(d[i + 2] - tb) < 60)
  const seen = new Uint8Array(PAD_W * PAD_H)
  const stack = [x0, y0]
  let leak = false // the empty area reaches the edge = the outline is open (or the tap was outside the shape)
  while (stack.length) {
    const y = stack.pop()
    let x = stack.pop()
    while (x >= 0 && !seen[y * PAD_W + x] && match(at(x, y))) x--
    x++
    let up = false
    let down = false
    while (x < PAD_W && !seen[y * PAD_W + x] && match(at(x, y))) {
      const i = at(x, y)
      seen[y * PAD_W + x] = 1
      if (x === 0 || y === 0 || x === PAD_W - 1 || y === PAD_H - 1) leak = true
      d[i] = fr
      d[i + 1] = fg
      d[i + 2] = fb
      d[i + 3] = 255
      if (y > 0) {
        const m = !seen[(y - 1) * PAD_W + x] && match(at(x, y - 1))
        if (m && !up) stack.push(x, y - 1)
        up = m
      }
      if (y < PAD_H - 1) {
        const m = !seen[(y + 1) * PAD_W + x] && match(at(x, y + 1))
        if (m && !down) stack.push(x, y + 1)
        down = m
      }
      x++
    }
  }
  if (empty && leak) return 'leak'
  ctx.putImageData(img, 0, 0)
  return true
}

/* ------------------------------------------------------------- drawing pad */
const DrawPad = forwardRef(function DrawPad({ kind }, ref) {
  const cv = useRef(null)
  const st = useRef({ down: false, last: null, mid: null, undo: [] })
  const [color, setColor] = useState(COLORS[0])
  const [size, setSize] = useState(6)
  const [tool, setTool] = useState('pen')
  const k = kindById(kind)
  const { toast } = useStore()

  const c2d = () => cv.current.getContext('2d', { willReadFrequently: true })
  const pos = (e) => {
    const r = cv.current.getBoundingClientRect()
    return { x: ((e.clientX - r.left) * PAD_W) / r.width, y: ((e.clientY - r.top) * PAD_H) / r.height }
  }
  const style = (x) => {
    x.lineCap = 'round'
    x.lineJoin = 'round'
    x.lineWidth = size * 2
    x.strokeStyle = color
    x.fillStyle = color
    x.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'
  }
  const snapshot = () => {
    const u = st.current.undo
    u.push(c2d().getImageData(0, 0, PAD_W, PAD_H))
    if (u.length > 12) u.shift()
  }

  const down = (e) => {
    e.preventDefault()
    cv.current.setPointerCapture?.(e.pointerId)
    snapshot()
    const p = pos(e)
    if (tool === 'fill') {
      const res = floodFill(c2d(), p.x, p.y, color)
      if (res !== true) {
        st.current.undo.pop()
        if (res === 'leak') toast('Fill works inside a closed outline. Close the shape and tap inside it 🙂', 'info')
      }
      return
    }
    const s = st.current
    s.down = true
    s.last = p
    s.mid = p
    const x = c2d()
    style(x)
    x.beginPath()
    x.arc(p.x, p.y, size, 0, Math.PI * 2)
    x.fill()
  }
  const move = (e) => {
    const s = st.current
    if (!s.down) return
    const p = pos(e)
    const mid = { x: (s.last.x + p.x) / 2, y: (s.last.y + p.y) / 2 }
    const x = c2d()
    style(x)
    x.beginPath()
    x.moveTo(s.mid.x, s.mid.y)
    x.quadraticCurveTo(s.last.x, s.last.y, mid.x, mid.y)
    x.stroke()
    s.mid = mid
    s.last = p
  }
  const up = () => {
    st.current.down = false
  }

  const undo = () => {
    const prev = st.current.undo.pop()
    if (prev) c2d().putImageData(prev, 0, 0)
  }
  const clear = () => {
    snapshot()
    c2d().clearRect(0, 0, PAD_W, PAD_H)
  }

  useImperativeHandle(ref, () => ({
    clear: () => {
      st.current.undo = []
      c2d().clearRect(0, 0, PAD_W, PAD_H)
    },
    // Crops to the drawing and shrinks it, returns a small PNG data URL (or null if the pad is empty / too tiny).
    exportImage: () => {
      const x = c2d()
      const d = x.getImageData(0, 0, PAD_W, PAD_H).data
      let x0 = PAD_W
      let y0 = PAD_H
      let x1 = -1
      let y1 = -1
      for (let y = 0; y < PAD_H; y++) {
        for (let xx = 0; xx < PAD_W; xx++) {
          if (d[(y * PAD_W + xx) * 4 + 3] > 16) {
            if (xx < x0) x0 = xx
            if (xx > x1) x1 = xx
            if (y < y0) y0 = y
            if (y > y1) y1 = y
          }
        }
      }
      if (x1 < 0) return null
      const pad = 4
      x0 = Math.max(0, x0 - pad)
      y0 = Math.max(0, y0 - pad)
      x1 = Math.min(PAD_W - 1, x1 + pad)
      y1 = Math.min(PAD_H - 1, y1 + pad)
      const bw = x1 - x0 + 1
      const bh = y1 - y0 + 1
      if (bw < 24 && bh < 24) return 'tiny'
      const scale = Math.min(1, 160 / Math.max(bw, bh))
      const out = document.createElement('canvas')
      out.width = Math.max(1, Math.round(bw * scale))
      out.height = Math.max(1, Math.round(bh * scale))
      const ox = out.getContext('2d')
      ox.imageSmoothingQuality = 'high'
      ox.drawImage(cv.current, x0, y0, bw, bh, 0, 0, out.width, out.height)
      return out.toDataURL('image/png')
    },
  }))

  return (
    <div className="zoo-padbox">
      <div className="zoo-pad-wrap" data-emoji={k.emoji}>
        <canvas
          ref={cv}
          className="zoo-pad"
          width={PAD_W}
          height={PAD_H}
          aria-label={`Drawing area. Draw a ${k.label.toLowerCase()} facing right.`}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onPointerLeave={up}
        />
        <span className="zoo-face" aria-hidden="true">
          facing right ➜
        </span>
      </div>
      <div className="zoo-tools">
        <div className="zoo-swatches" role="group" aria-label="Colours">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`zoo-sw ${tool !== 'eraser' && color === c ? 'on' : ''}`}
              style={{ background: c }}
              aria-label={`Colour ${c}`}
              aria-pressed={tool !== 'eraser' && color === c}
              onClick={() => {
                setColor(c)
                setTool((t) => (t === 'fill' ? 'fill' : 'pen'))
              }}
            />
          ))}
        </div>
        <div className="row wrap">
          <button type="button" className={`btn small ${tool === 'fill' ? '' : 'ghost'}`} aria-pressed={tool === 'fill'} title="Draw a closed outline, then tap inside it to colour it" onClick={() => setTool((t) => (t === 'fill' ? 'pen' : 'fill'))}>
            🪣 Fill
          </button>
          <button type="button" className={`btn small ${tool === 'eraser' ? '' : 'ghost'}`} aria-pressed={tool === 'eraser'} onClick={() => setTool((t) => (t === 'eraser' ? 'pen' : 'eraser'))}>
            🧽 Eraser
          </button>
          <label className="zoo-size">
            <span>Brush</span>
            <input type="range" min="2" max="16" value={size} onChange={(e) => setSize(Number(e.target.value))} aria-label="Brush size" />
          </label>
          <button type="button" className="btn small ghost" onClick={undo}>
            ↶ Undo
          </button>
          <button type="button" className="btn small ghost" onClick={clear}>
            Clear
          </button>
        </div>
      </div>
    </div>
  )
})

/* -------------------------------------------------------------------- page */
export default function Zoo() {
  const { data, set, toast } = useStore()
  const zoo = data.zoo
  const canvasRef = useRef(null)
  const worldRef = useRef(null)
  const padRef = useRef(null)
  const [kind, setKind] = useState('frog')
  const [night, setNight] = useState(() => {
    const h = new Date().getHours()
    return h >= 19 || h < 6
  })
  const [paused, setPaused] = useState(false)
  const k = kindById(kind)

  useEffect(() => {
    const w = createWorld(canvasRef.current)
    worldRef.current = w
    return () => {
      w.destroy()
      worldRef.current = null
    }
  }, [])
  useEffect(() => {
    worldRef.current?.sync(zoo.items, zoo.starters)
  }, [zoo.items, zoo.starters])
  useEffect(() => {
    worldRef.current?.setNight(night)
  }, [night])
  useEffect(() => {
    worldRef.current?.setPaused(paused)
  }, [paused])

  const onWorldClick = (e) => {
    const r = canvasRef.current.getBoundingClientRect()
    worldRef.current?.pointer(((e.clientX - r.left) * W) / r.width, ((e.clientY - r.top) * H) / r.height)
  }

  const bring = (e) => {
    const img = padRef.current?.exportImage()
    if (!img) return toast('Draw something first ✏️', 'info')
    if (img === 'tiny') return toast('That is a tiny dot, draw it a bit bigger 🙂', 'info')
    set('zoo', (z) => ({ ...z, items: [...z.items, { id: uid(), kind, img, made: Date.now() }].slice(-MAX_DRAWINGS) }))
    padRef.current.clear()
    confettiFrom(e, 'stars')
    toast(`${k.emoji} Your ${k.label.toLowerCase()} is alive! Watch the meadow.`, 'ok')
  }
  const remove = (id) => set('zoo', (z) => ({ ...z, items: z.items.filter((i) => i.id !== id) }))
  const removeAll = () => {
    if (window.confirm('Remove all your drawn animals from the meadow?')) set('zoo', (z) => ({ ...z, items: [] }))
  }

  return (
    <>
      <PageTitle sub="Draw an animal, press the button and it comes alive in the meadow. Everything is saved in this browser.">Pixel Zoo</PageTitle>
      <div className="zoo-layout">
          <Win title="The meadow" className="zoo-area-world">
            <canvas
              ref={canvasRef}
              className="zoo-world"
              role="img"
              aria-label="An animated meadow with trees, a pond and animals. Tap an animal to say hi, or tap the pond to feed the fish."
              onClick={onWorldClick}
            />
            <div className="zoo-bar">
              <button type="button" className="btn small ghost" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
                {paused ? '▶ Play' : '⏸ Pause'}
              </button>
              <button type="button" className="btn small ghost" aria-pressed={night} onClick={() => setNight((n) => !n)}>
                {night ? '☀️ Day' : '🌙 Night'}
              </button>
              <p className="zoo-tip">Tap an animal to say hi · tap the pond to feed the fish 🐟</p>
            </div>
          </Win>
          <Win title={`Your drawings (${zoo.items.length})`} className="zoo-area-gal">
            {zoo.items.length === 0 ? (
              <Empty>Nothing drawn yet. Pick an animal, draw it and press “Bring it to life!”</Empty>
            ) : (
              <ul className="zoo-gal">
                {[...zoo.items].reverse().map((it) => (
                  <li key={it.id} title={kindById(it.kind)?.label}>
                    <img src={it.img} alt={`Your drawn ${kindById(it.kind)?.label || 'animal'}`} />
                    <span className="zoo-badge" aria-hidden="true">
                      {kindById(it.kind)?.emoji}
                    </span>
                    <button type="button" className="zoo-x" aria-label={`Delete drawn ${kindById(it.kind)?.label || 'animal'}`} onClick={() => remove(it.id)}>
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="row between wrap">
              <label className="row" style={{ gap: '0.4rem' }}>
                <input type="checkbox" checked={zoo.starters} onChange={() => set('zoo', (z) => ({ ...z, starters: !z.starters }))} />
                <span>Show the starter animals</span>
              </label>
              {zoo.items.length > 0 && (
                <button type="button" className="btn small ghost danger" onClick={removeAll}>
                  Remove all drawings
                </button>
              )}
            </div>
          </Win>
          <Win title="Draw an animal" className="zoo-area-draw">
            <div className="chips presets" role="group" aria-label="Which animal?">
              {KINDS.map((o) => (
                <button key={o.id} type="button" className={`chip ${kind === o.id ? 'on' : ''}`} aria-pressed={kind === o.id} onClick={() => setKind(o.id)}>
                  {o.emoji} {o.label}
                </button>
              ))}
            </div>
            <p className="zoo-hint">
              {k.emoji} A {k.label.toLowerCase()} <b>{k.does}</b>. Draw it side-on, facing right.
            </p>
            <DrawPad ref={padRef} kind={kind} />
            <div className="row center">
              <button type="button" className="btn" onClick={bring}>
                ✨ Bring it to life!
              </button>
            </div>
          </Win>
      </div>
    </>
  )
}