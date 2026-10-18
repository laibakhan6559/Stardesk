// Generated ambient sounds (rain, wind, starry pad) – no mp3 files, works offline.
let ctx
let master
let nodes = []
let current = null
let volume = 0.4

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return false
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = volume
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return true
}

function noise() {
  const len = ctx.sampleRate * 2
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.loop = true
  return src
}

export const SOUNDS = [
  { id: 'rain', label: 'Soft rain', emoji: '🌧️' },
  { id: 'wind', label: 'Night wind', emoji: '🌬️' },
  { id: 'stars', label: 'Starry pad', emoji: '✨' },
]

export function stopAmbient() {
  nodes.forEach((n) => {
    try {
      n.stop && n.stop()
    } catch {
      /* already stopped */
    }
    try {
      n.disconnect()
    } catch {
      /* already disconnected */
    }
  })
  nodes = []
  current = null
}

export function playAmbient(kind) {
  if (!ensure()) return false
  stopAmbient()
  if (kind === 'rain') {
    const src = noise()
    const f = ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = 2200
    f.Q.value = 0.35
    const g = ctx.createGain()
    g.gain.value = 0.55
    src.connect(f)
    f.connect(g)
    g.connect(master)
    src.start()
    nodes.push(src, f, g)
  } else if (kind === 'wind') {
    const src = noise()
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = 420
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.11
    const lg = ctx.createGain()
    lg.gain.value = 260
    lfo.connect(lg)
    lg.connect(f.frequency)
    const g = ctx.createGain()
    g.gain.value = 0.9
    src.connect(f)
    f.connect(g)
    g.connect(master)
    src.start()
    lfo.start()
    nodes.push(src, f, lfo, lg, g)
  } else {
    ;[220, 277.18, 329.63, 415.3].forEach((fr, i) => {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = fr
      const g = ctx.createGain()
      g.gain.value = 0.07
      const lfo = ctx.createOscillator()
      lfo.frequency.value = 0.08 + i * 0.03
      const lg = ctx.createGain()
      lg.gain.value = 0.05
      lfo.connect(lg)
      lg.connect(g.gain)
      o.connect(g)
      g.connect(master)
      o.start()
      lfo.start()
      nodes.push(o, g, lfo, lg)
    })
  }
  current = kind
  return true
}

export const ambientNow = () => current

export function setAmbientVolume(v) {
  volume = v
  if (master) master.gain.value = v
}
