// Pixel Zoo engine: a little animated meadow (trees, pond, flowers) drawn on one <canvas>.
// Drawings made by the user become living animals:
//   fish swim in the pond · frogs jump between lily pads · monkeys jump from tree to tree
//   butterflies & bees flutter between flowers · sparrows fly, perch and hop · rabbits hop in the meadow
// Nothing here touches React or storage - Zoo.jsx feeds it the saved drawings through sync().

export const W = 960
export const H = 540

// anchor: 'bottom' = feet at the point, 'center' = middle at the point. aspect = height / width of the built-in art.
export const KINDS = [
  { id: 'fish', emoji: '🐟', label: 'Fish', does: 'swims and floats in the pond', size: 76, aspect: 0.5, anchor: 'center' },
  { id: 'frog', emoji: '🐸', label: 'Frog', does: 'jumps from lily pad to lily pad', size: 58, aspect: 0.66, anchor: 'bottom' },
  { id: 'monkey', emoji: '🐵', label: 'Monkey', does: 'jumps from tree to tree', size: 88, aspect: 0.95, anchor: 'bottom' },
  { id: 'butterfly', emoji: '🦋', label: 'Butterfly', does: 'flutters from flower to flower', size: 58, aspect: 0.8, anchor: 'center' },
  { id: 'sparrow', emoji: '🐦', label: 'Sparrow', does: 'flies, perches and hops', size: 54, aspect: 0.66, anchor: 'bottom' },
  { id: 'rabbit', emoji: '🐰', label: 'Rabbit', does: 'hops around the meadow', size: 68, aspect: 0.92, anchor: 'bottom' },
  { id: 'bee', emoji: '🐝', label: 'Bee', does: 'buzzes between the flowers', size: 42, aspect: 0.75, anchor: 'center' },
]
export const kindById = (id) => KINDS.find((k) => k.id === id)

const rand = (a, b) => a + Math.random() * (b - a)
const randInt = (a, b) => Math.floor(rand(a, b + 1))
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const lerp = (a, b, t) => a + (b - a) * t
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
const easeOutBack = (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2)
const OL = '#33243d' // outline ink for the built-in art

// seeded random so the meadow looks the same every visit
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ------------------------------------------------------------------ geometry */
export const POND = { x: 735, y: 432, rx: 205, ry: 82 }
const inPond = (x, y, m = 0) => ((x - POND.x) / (POND.rx + m)) ** 2 + ((y - POND.y) / (POND.ry + m)) ** 2 < 1

const TREES = [
  { x: 105, y: 338, s: 1.0 },
  { x: 300, y: 352, s: 1.08 },
  { x: 462, y: 340, s: 0.96 },
]
// places the monkey and sparrows can stand on
const TREE_SPOTS = []
TREES.forEach((t, i) => {
  const add = (dx, dy, kind) => TREE_SPOTS.push({ x: t.x + dx * t.s, y: t.y + dy * t.s, tree: i, kind })
  add(-80, -100, 'branch')
  add(82, -124, 'branch')
  add(4, -212, 'top')
  add(46, 8, 'ground')
})
const PERCHES = TREE_SPOTS.filter((s) => s.kind !== 'ground')

const PADS = [
  { x: 600, y: 432, r: 27, ph: 0.2 },
  { x: 670, y: 472, r: 25, ph: 1.4 },
  { x: 740, y: 392, r: 28, ph: 2.1 },
  { x: 790, y: 452, r: 26, ph: 3.3 },
  { x: 862, y: 420, r: 25, ph: 4.2 },
]
const BANKS = [
  { x: 514, y: 440 },
  { x: 800, y: 350 },
  { x: 905, y: 505 },
  { x: 735, y: 526 },
]
const FROG_SPOTS = [...PADS.map((p) => ({ x: p.x, y: p.y - 2 })), ...BANKS]

const FLOWER_COLORS = ['#ff6fb0', '#ffd23f', '#ff8a3d', '#b48cff', '#ffffff', '#ff5a5a']
const FLOWERS = (() => {
  const r = rng(77)
  const out = []
  let guard = 0
  while (out.length < 20 && guard++ < 400) {
    const x = 24 + r() * 490
    const y = 378 + r() * 140
    if (inPond(x, y, 12)) continue
    if (out.some((f) => Math.hypot(f.x - x, f.y - y) < 40)) continue
    out.push({ x, y, h: 22 + r() * 20, col: FLOWER_COLORS[Math.floor(r() * FLOWER_COLORS.length)], ph: r() * 6, sw: 0 })
  }
  return out
})()

function groundSpot() {
  for (let i = 0; i < 30; i++) {
    const x = rand(30, 930)
    const y = rand(388, 520)
    if (!inPond(x, y, 14)) return { x, y, kind: 'ground' }
  }
  return { x: 200, y: 440, kind: 'ground' }
}

/* ------------------------------------------------------------ static scenery */
function drawSky(x, night) {
  const g = x.createLinearGradient(0, 0, 0, 280)
  if (night) {
    g.addColorStop(0, '#0b1240')
    g.addColorStop(1, '#3a3f93')
  } else {
    g.addColorStop(0, '#74c4ff')
    g.addColorStop(1, '#dff4ff')
  }
  x.fillStyle = g
  x.fillRect(0, 0, W, H)
  if (night) {
    const r = rng(5)
    for (let i = 0; i < 80; i++) {
      x.fillStyle = `rgba(255,255,255,${0.35 + r() * 0.6})`
      const s = r() < 0.15 ? 3 : 2
      x.fillRect(Math.floor(r() * W), Math.floor(r() * 230), s, s)
    }
    x.fillStyle = '#fff6d0'
    x.beginPath()
    x.arc(850, 74, 30, 0, Math.PI * 2)
    x.fill()
    x.fillStyle = '#3a3f93'
    x.beginPath()
    x.arc(862, 66, 26, 0, Math.PI * 2)
    x.fill()
  } else {
    const glow = x.createRadialGradient(850, 74, 10, 850, 74, 90)
    glow.addColorStop(0, 'rgba(255,240,150,0.9)')
    glow.addColorStop(1, 'rgba(255,240,150,0)')
    x.fillStyle = glow
    x.fillRect(740, 0, 220, 190)
    x.fillStyle = '#ffd95e'
    x.beginPath()
    x.arc(850, 74, 32, 0, Math.PI * 2)
    x.fill()
    x.strokeStyle = '#f0b429'
    x.lineWidth = 3
    x.stroke()
  }
}

function drawTree(x, t) {
  const { x: tx, y: ty, s } = t
  const P = (dx, dy) => [tx + dx * s, ty + dy * s]
  // shadow
  x.fillStyle = 'rgba(20,60,30,0.22)'
  x.beginPath()
  x.ellipse(tx + 10 * s, ty + 6 * s, 70 * s, 14 * s, 0, 0, Math.PI * 2)
  x.fill()
  // trunk
  x.fillStyle = '#8b5a3a'
  x.beginPath()
  x.moveTo(...P(-26, 4))
  x.quadraticCurveTo(...P(-10, -20), ...P(-12, -60))
  x.lineTo(...P(-9, -170))
  x.lineTo(...P(10, -170))
  x.lineTo(...P(13, -60))
  x.quadraticCurveTo(...P(14, -20), ...P(30, 4))
  x.closePath()
  x.fill()
  x.fillStyle = '#6e4529'
  x.beginPath()
  x.moveTo(...P(-26, 4))
  x.quadraticCurveTo(...P(-10, -20), ...P(-12, -60))
  x.lineTo(...P(-9, -170))
  x.lineTo(...P(-2, -170))
  x.lineTo(...P(-5, -60))
  x.quadraticCurveTo(...P(-6, -20), ...P(-10, 4))
  x.closePath()
  x.fill()
  // canopy: dark underlayer, main, highlights
  const blobs = [
    [0, 0, 80],
    [-56, 22, 58],
    [56, 20, 60],
    [-30, -44, 52],
    [34, -42, 54],
    [4, -64, 44],
  ]
  const cy = -170
  x.fillStyle = '#2f8a4a'
  blobs.forEach(([dx, dy, r]) => {
    x.beginPath()
    x.arc(tx + dx * s, ty + (cy + dy + 10) * s, r * s, 0, Math.PI * 2)
    x.fill()
  })
  x.fillStyle = '#3fa65a'
  blobs.forEach(([dx, dy, r]) => {
    x.beginPath()
    x.arc(tx + dx * s, ty + (cy + dy) * s, r * s * 0.96, 0, Math.PI * 2)
    x.fill()
  })
  x.fillStyle = '#5fc678'
  blobs.forEach(([dx, dy, r]) => {
    x.beginPath()
    x.arc(tx + (dx - 12) * s, ty + (cy + dy - 14) * s, r * s * 0.5, 0, Math.PI * 2)
    x.fill()
  })
  // branches on top so the animals' perches are visible
  x.strokeStyle = '#7a4d30'
  x.lineCap = 'round'
  x.lineWidth = 11 * s
  x.beginPath()
  x.moveTo(...P(-4, -92))
  x.lineTo(...P(-80, -100))
  x.moveTo(...P(4, -116))
  x.lineTo(...P(82, -124))
  x.stroke()
  x.fillStyle = '#3fa65a'
  ;[
    [-80, -104],
    [82, -128],
  ].forEach(([dx, dy]) => {
    x.beginPath()
    x.arc(tx + dx * s, ty + dy * s, 10 * s, 0, Math.PI * 2)
    x.arc(tx + (dx + (dx < 0 ? -9 : 9)) * s, ty + (dy + 6) * s, 8 * s, 0, Math.PI * 2)
    x.fill()
  })
}

function drawLand(x) {
  // far hills
  x.fillStyle = '#a5dca1'
  x.beginPath()
  x.moveTo(0, H)
  for (let px = 0; px <= W; px += 8) x.lineTo(px, 232 + Math.sin(px * 0.011) * 14 + Math.sin(px * 0.027) * 6)
  x.lineTo(W, H)
  x.closePath()
  x.fill()
  // meadow
  const g = x.createLinearGradient(0, 240, 0, H)
  g.addColorStop(0, '#86d484')
  g.addColorStop(1, '#4cb35a')
  x.fillStyle = g
  x.beginPath()
  x.moveTo(0, H)
  for (let px = 0; px <= W; px += 8) x.lineTo(px, 256 + Math.sin(px * 0.016 + 1) * 10 + Math.sin(px * 0.05) * 3)
  x.lineTo(W, H)
  x.closePath()
  x.fill()
  // tufts
  const r = rng(21)
  x.strokeStyle = 'rgba(30,110,60,0.45)'
  x.lineWidth = 2
  x.lineCap = 'round'
  for (let i = 0; i < 170; i++) {
    const px = r() * W
    const py = 290 + r() * 245
    if (inPond(px, py, 14)) continue
    x.beginPath()
    x.moveTo(px - 4, py)
    x.lineTo(px - 2, py - 7)
    x.moveTo(px, py)
    x.lineTo(px, py - 9)
    x.moveTo(px + 4, py)
    x.lineTo(px + 2, py - 7)
    x.stroke()
  }
  // pond: sandy shore, deep water, soft highlight
  x.fillStyle = '#e3d29c'
  x.beginPath()
  x.ellipse(POND.x, POND.y + 4, POND.rx + 12, POND.ry + 10, 0, 0, Math.PI * 2)
  x.fill()
  const pg = x.createRadialGradient(POND.x - 40, POND.y - 20, 20, POND.x, POND.y, POND.rx)
  pg.addColorStop(0, '#8fe3f7')
  pg.addColorStop(1, '#2f8fd8')
  x.fillStyle = pg
  x.beginPath()
  x.ellipse(POND.x, POND.y, POND.rx, POND.ry, 0, 0, Math.PI * 2)
  x.fill()
  x.strokeStyle = 'rgba(20,70,130,0.5)'
  x.lineWidth = 3
  x.stroke()
  // trees, back to front
  ;[...TREES].sort((a, b) => a.y - b.y).forEach((t) => drawTree(x, t))
}

function drawCloud(x, cx, cy, s, night) {
  x.fillStyle = night ? 'rgba(150,158,230,0.55)' : 'rgba(255,255,255,0.93)'
  x.beginPath()
  x.arc(cx, cy, 22 * s, 0, Math.PI * 2)
  x.arc(cx + 26 * s, cy - 10 * s, 28 * s, 0, Math.PI * 2)
  x.arc(cx + 56 * s, cy, 22 * s, 0, Math.PI * 2)
  x.arc(cx + 28 * s, cy + 8 * s, 24 * s, 0, Math.PI * 2)
  x.fill()
}

/* ------------------------------------------------------ built-in (starter) art */
// All drawn facing right. Ground animals have their feet at y = 0, fish / butterfly / bee are centred.
const blob = (x, px, py, rx, ry, fill, rot = 0, stroke = true) => {
  x.beginPath()
  x.ellipse(px, py, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2)
  x.fillStyle = fill
  x.fill()
  if (stroke) {
    x.lineWidth = 2
    x.strokeStyle = OL
    x.stroke()
  }
}
const eye = (x, px, py, r) => {
  blob(x, px, py, r, r, '#fff')
  blob(x, px + r * 0.3, py, r * 0.52, r * 0.52, OL, 0, false)
}

const FISH_PAL = [
  ['#ff8a3d', '#ffc08a', '#e8601c'],
  ['#4db3ff', '#a6dbff', '#2f7fd6'],
  ['#ff6fb0', '#ffb0d4', '#d24a88'],
  ['#ffd23f', '#fff0a0', '#e0a800'],
]
const BUTTERFLY_PAL = [
  ['#ff6fb0', '#ffb0d4'],
  ['#8a5cf6', '#c4a8ff'],
  ['#ff8a3d', '#ffd23f'],
  ['#3ec7ff', '#b3ecff'],
]
const RABBIT_PAL = ['#f6f0f8', '#e0c9a6', '#c4c8d4']

const STARTER = {
  fish(x, c, s) {
    const [body, belly, fin] = FISH_PAL[c.pal % FISH_PAL.length]
    const wig = Math.sin(c.t * 9) * 0.45
    x.save()
    x.translate(-s * 0.3, 0)
    x.rotate(wig * 0.6)
    x.beginPath()
    x.moveTo(s * 0.06, 0)
    x.lineTo(-s * 0.22, -s * 0.2)
    x.quadraticCurveTo(-s * 0.12, 0, -s * 0.22, s * 0.2)
    x.closePath()
    x.fillStyle = fin
    x.fill()
    x.lineWidth = 2
    x.strokeStyle = OL
    x.stroke()
    x.restore()
    x.beginPath()
    x.moveTo(-s * 0.1, -s * 0.15)
    x.lineTo(s * 0.02, -s * 0.3)
    x.lineTo(s * 0.12, -s * 0.14)
    x.closePath()
    x.fillStyle = fin
    x.fill()
    x.stroke()
    blob(x, 0, 0, s * 0.38, s * 0.22, body)
    blob(x, s * 0.03, s * 0.08, s * 0.29, s * 0.1, belly, 0, false)
    x.beginPath()
    x.arc(s * 0.1, 0, s * 0.12, -1.1, 1.1)
    x.lineWidth = 1.5
    x.strokeStyle = 'rgba(51,36,61,0.55)'
    x.stroke()
    eye(x, s * 0.25, -s * 0.05, s * 0.05)
  },
  frog(x, c, s) {
    const air = c.air || 0
    const pulse = 1 + 0.04 * Math.sin(c.t * 4)
    // hind leg stretches back in the air
    blob(x, -s * (0.2 + air * 0.2), -s * (0.1 - air * 0.03), s * (0.2 + air * 0.1), s * 0.1, '#43b956', -0.25 * (1 - air))
    blob(x, -s * (0.34 + air * 0.3), -s * (0.04 - air * 0.05), s * 0.1, s * 0.045, '#43b956')
    blob(x, 0, -s * 0.27, s * 0.36, s * 0.25 * pulse, '#5bd66a')
    blob(x, s * 0.04, -s * 0.18, s * 0.24, s * 0.12, '#c9f5b8', 0, false)
    blob(x, s * (0.24 + air * 0.06), -s * (0.08 + air * 0.08), s * 0.07, s * 0.1, '#43b956', 0.2)
    // eyes
    ;[0.1, 0.27].forEach((dx) => {
      blob(x, s * dx, -s * 0.5, s * 0.1, s * 0.1, '#5bd66a')
      eye(x, s * dx + 1, -s * 0.51, s * 0.065)
    })
    x.beginPath()
    x.moveTo(s * 0.18, -s * 0.28)
    x.quadraticCurveTo(s * 0.3, -s * 0.22, s * 0.38, -s * 0.3)
    x.lineWidth = 2
    x.strokeStyle = OL
    x.stroke()
    blob(x, s * 0.13, -s * 0.3, s * 0.04, s * 0.025, '#ff9fb5', 0, false)
  },
  monkey(x, c, s) {
    const air = c.air || 0
    // tail
    x.lineCap = 'round'
    x.beginPath()
    x.moveTo(-s * 0.18, -s * 0.2)
    x.bezierCurveTo(-s * 0.55, -s * 0.15, -s * 0.5, -s * 0.55, -s * 0.34, -s * 0.62 - air * s * 0.1)
    x.lineWidth = 9
    x.strokeStyle = OL
    x.stroke()
    x.lineWidth = 5
    x.strokeStyle = '#8a5230'
    x.stroke()
    blob(x, -s * 0.1, -s * 0.08, s * 0.11, s * 0.08, '#8a5230')
    blob(x, s * 0.14, -s * 0.08, s * 0.11, s * 0.08, '#8a5230')
    blob(x, 0, -s * 0.34, s * 0.22, s * 0.26, '#a8683a')
    blob(x, s * 0.04, -s * 0.3, s * 0.13, s * 0.17, '#ecc896', 0, false)
    // arms (up while jumping)
    const ay = -s * (0.33 + air * 0.2)
    blob(x, -s * 0.2, ay, s * 0.07, s * 0.15, '#8a5230', 0.3 - air * 0.6)
    blob(x, s * 0.23, ay, s * 0.07, s * 0.15, '#8a5230', -0.3 + air * 0.6)
    // head
    blob(x, -s * 0.07, -s * 0.74, s * 0.075, s * 0.075, '#a8683a')
    blob(x, s * 0.25, -s * 0.74, s * 0.075, s * 0.075, '#a8683a')
    blob(x, -s * 0.07, -s * 0.74, s * 0.04, s * 0.04, '#ecc896', 0, false)
    blob(x, s * 0.25, -s * 0.74, s * 0.04, s * 0.04, '#ecc896', 0, false)
    blob(x, s * 0.09, -s * 0.7, s * 0.19, s * 0.18, '#a8683a')
    blob(x, s * 0.14, -s * 0.66, s * 0.14, s * 0.11, '#ecc896', 0, false)
    eye(x, s * 0.08, -s * 0.73, s * 0.032)
    eye(x, s * 0.19, -s * 0.73, s * 0.032)
    blob(x, s * 0.16, -s * 0.67, s * 0.012, s * 0.01, OL, 0, false)
    x.beginPath()
    x.arc(s * 0.15, -s * 0.64, s * 0.05, 0.2, Math.PI - 0.2)
    x.lineWidth = 1.5
    x.strokeStyle = OL
    x.stroke()
  },
  butterfly(x, c, s) {
    const [a, b] = BUTTERFLY_PAL[c.pal % BUTTERFLY_PAL.length]
    const f = 0.22 + 0.78 * Math.abs(Math.sin(c.t * (c.state === 'rest' ? 3 : 13)))
    blob(x, -s * 0.03, -s * 0.2 * f, s * 0.2, s * 0.24 * f, a)
    blob(x, -s * 0.1, -s * 0.12 * f, s * 0.13, s * 0.14 * f, b, 0, false)
    blob(x, -s * 0.09, s * 0.17 * f, s * 0.14, s * 0.17 * f, a)
    blob(x, -s * 0.1, s * 0.15 * f, s * 0.07, s * 0.08 * f, b, 0, false)
    blob(x, -s * 0.02, 0, s * 0.2, s * 0.04, OL)
    blob(x, s * 0.2, 0, s * 0.05, s * 0.05, OL)
    x.beginPath()
    x.moveTo(s * 0.23, -s * 0.02)
    x.lineTo(s * 0.33, -s * 0.12)
    x.moveTo(s * 0.23, s * 0.02)
    x.lineTo(s * 0.33, s * 0.1)
    x.lineWidth = 1.5
    x.strokeStyle = OL
    x.stroke()
  },
  sparrow(x, c, s) {
    const fly = c.flying
    if (!fly) {
      x.lineWidth = 2
      x.strokeStyle = '#d98b3c'
      x.beginPath()
      x.moveTo(s * 0.02, -s * 0.12)
      x.lineTo(s * 0.02, 0)
      x.moveTo(s * 0.12, -s * 0.12)
      x.lineTo(s * 0.12, 0)
      x.stroke()
    }
    // tail
    x.beginPath()
    x.moveTo(-s * 0.2, -s * 0.34)
    x.lineTo(-s * 0.5, -s * 0.28)
    x.lineTo(-s * 0.46, -s * 0.4)
    x.lineTo(-s * 0.2, -s * 0.4)
    x.closePath()
    x.fillStyle = '#7a4d30'
    x.fill()
    x.lineWidth = 2
    x.strokeStyle = OL
    x.stroke()
    blob(x, 0, -s * 0.28, s * 0.3, s * 0.2, '#a9743f')
    blob(x, s * 0.06, -s * 0.22, s * 0.2, s * 0.1, '#eadbbd', 0, false)
    // wing
    x.save()
    x.translate(-s * 0.02, -s * 0.36)
    x.rotate(fly ? -0.5 + Math.sin(c.t * 32) * 0.9 : 0.12)
    blob(x, -s * 0.1, 0, s * 0.2, s * 0.08, '#6e4529')
    x.restore()
    blob(x, s * 0.24, -s * 0.46, s * 0.15, s * 0.14, '#b98250')
    blob(x, s * 0.24, -s * 0.54, s * 0.12, s * 0.06, '#8a5230', 0, false)
    x.beginPath()
    x.moveTo(s * 0.36, -s * 0.5)
    x.lineTo(s * 0.5, -s * 0.45)
    x.lineTo(s * 0.36, -s * 0.41)
    x.closePath()
    x.fillStyle = '#ffa63d'
    x.fill()
    x.lineWidth = 1.5
    x.strokeStyle = OL
    x.stroke()
    eye(x, s * 0.29, -s * 0.5, s * 0.03)
  },
  rabbit(x, c, s) {
    const air = c.air || 0
    const body = RABBIT_PAL[c.pal % RABBIT_PAL.length]
    blob(x, -s * 0.3, -s * 0.2, s * 0.075, s * 0.075, '#fff')
    // ears
    blob(x, s * 0.16, -s * 0.74, s * 0.055, s * 0.2, body, -0.2 - air * 0.3)
    blob(x, s * 0.3, -s * 0.74, s * 0.055, s * 0.2, body, 0.15 - air * 0.3)
    blob(x, s * 0.16, -s * 0.73, s * 0.025, s * 0.14, '#ffb3c8', -0.2 - air * 0.3, false)
    blob(x, s * 0.3, -s * 0.73, s * 0.025, s * 0.14, '#ffb3c8', 0.15 - air * 0.3, false)
    blob(x, -s * (0.17 + air * 0.14), -s * (0.1 - air * 0.03), s * (0.14 + air * 0.06), s * 0.1, body)
    blob(x, -s * 0.02, -s * 0.24, s * 0.3, s * 0.2, body)
    blob(x, s * (0.17 + air * 0.08), -s * 0.07, s * 0.075, s * 0.07, body)
    blob(x, s * 0.24, -s * 0.42, s * 0.17, s * 0.15, body)
    eye(x, s * 0.3, -s * 0.45, s * 0.03)
    blob(x, s * 0.4, -s * 0.4, s * 0.025, s * 0.02, '#ff7fa0', 0, false)
    x.beginPath()
    x.moveTo(s * 0.38, -s * 0.38)
    x.lineTo(s * 0.5, -s * 0.4)
    x.moveTo(s * 0.38, -s * 0.36)
    x.lineTo(s * 0.5, -s * 0.34)
    x.lineWidth = 1
    x.strokeStyle = 'rgba(51,36,61,0.55)'
    x.stroke()
  },
  bee(x, c, s) {
    const fl = 0.45 + 0.55 * Math.abs(Math.sin(c.t * 46))
    x.globalAlpha = 0.78
    blob(x, -s * 0.04, -s * 0.2, s * 0.13, s * 0.17 * fl, '#d6eeff', -0.4, true)
    blob(x, s * 0.08, -s * 0.2, s * 0.11, s * 0.14 * fl, '#d6eeff', 0.2, true)
    x.globalAlpha = 1
    blob(x, 0, 0, s * 0.27, s * 0.19, '#ffd23f')
    blob(x, -s * 0.07, 0, s * 0.045, s * 0.175, OL, 0, false)
    blob(x, s * 0.07, 0, s * 0.04, s * 0.165, OL, 0, false)
    x.beginPath()
    x.moveTo(-s * 0.26, -s * 0.02)
    x.lineTo(-s * 0.36, s * 0.01)
    x.lineTo(-s * 0.26, s * 0.04)
    x.closePath()
    x.fillStyle = OL
    x.fill()
    blob(x, s * 0.25, -s * 0.01, s * 0.11, s * 0.1, '#5a3a22')
    eye(x, s * 0.29, -s * 0.03, s * 0.03)
  },
}

/* ------------------------------------------------------------------- movement */
function startJump(c, tx, ty, h, speed, minDur = 0.28) {
  const d = Math.hypot(tx - c.x, ty - c.y)
  c.j = { x0: c.x, y0: c.y, x1: tx, y1: ty, h, t: 0, dur: clamp(d / speed, minDur, 2.8) }
  if (Math.abs(tx - c.x) > 4) c.want = tx > c.x ? 1 : -1
}
// returns true on the frame the animal lands
function stepJump(c, dt) {
  const j = c.j
  j.t += dt
  const u = Math.min(1, j.t / j.dur)
  c.x = lerp(j.x0, j.x1, u)
  c.gy = lerp(j.y0, j.y1, u)
  c.y = c.gy - 4 * j.h * u * (1 - u)
  c.air = Math.sin(Math.PI * u)
  if (u >= 1) {
    c.x = j.x1
    c.y = c.gy = j.y1
    c.air = 0
    c.squash = 1
    return true
  }
  return false
}

const SAY = { frog: 'ribbit!', monkey: 'ooh ooh!', sparrow: 'tweet!', bee: 'bzzz', butterfly: 'flutter~', rabbit: 'hop hop!', fish: 'blub' }

/* ---------------------------------------------------------------------- world */
export function createWorld(canvas) {
  const dpr = Math.min(window.innerWidth < 700 ? 1.5 : 2, window.devicePixelRatio || 1)
  canvas.width = Math.round(W * dpr)
  canvas.height = Math.round(H * dpr)
  const ctx = canvas.getContext('2d')

  let night = false
  let paused = false
  let alive = true
  let first = true // the very first sync is "the world loading", later ones are "a new animal arrives"
  let time = 0
  let last = performance.now()
  let raf = 0
  let sky = null
  let land = null
  const critters = new Map()
  const loading = new Set()
  let wanted = new Set()
  const parts = []
  const food = []
  const clouds = [
    { x: 120, y: 60, s: 1.0, v: 7 },
    { x: 520, y: 112, s: 0.75, v: 5 },
    { x: 800, y: 40, s: 0.9, v: 9 },
  ]
  const fireflies = Array.from({ length: 14 }, (_, i) => ({ x: rand(40, 920), y: rand(300, 500), ph: i * 1.7 }))

  const layer = (fn) => {
    const c = document.createElement('canvas')
    c.width = canvas.width
    c.height = canvas.height
    const x = c.getContext('2d')
    x.scale(dpr, dpr)
    fn(x)
    return c
  }
  const buildSky = () => (sky = layer((x) => drawSky(x, night)))
  buildSky()
  land = layer((x) => drawLand(x))

  /* ---- particles */
  const addPart = (p) => parts.push({ life: 1, max: 1, vx: 0, vy: 0, g: 0, ...p, max: p.life ?? 1 })
  const say = (c, text) => addPart({ type: 'say', c, text, life: 1.7 })
  const hearts = (c) => {
    const top = c.y - (kindById(c.kind).anchor === 'bottom' ? c.dh : c.dh / 2) - 6
    for (let i = 0; i < 3; i++) addPart({ type: 'heart', x: c.x + rand(-16, 16), y: top + rand(-4, 6), vx: rand(-14, 14), vy: rand(-46, -30), life: 1.2 })
  }
  const sparkle = (x, y, n = 10) => {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2)
      addPart({ type: 'spark', x, y, vx: Math.cos(a) * rand(30, 90), vy: Math.sin(a) * rand(30, 90) - 20, life: rand(0.5, 0.9), col: pick(['#ffd95e', '#fff', '#ff9bc8', '#9be0ff']) })
    }
  }
  const ripple = (x, y, big = 1) => addPart({ type: 'ring', x, y, r0: 3, r1: 26 * big, life: 1.0 })

  /* ---- critters */
  function spawnPoint(c, fresh) {
    switch (c.kind) {
      case 'fish': {
        const a = rand(0, Math.PI * 2)
        const r = Math.sqrt(Math.random()) * 0.7
        c.x = POND.x + Math.cos(a) * r * POND.rx
        c.y = POND.y + Math.sin(a) * r * POND.ry
        c.tx = c.x
        c.ty = c.y
        c.speed = rand(34, 52)
        if (fresh) ripple(c.x, c.y - 4, 1.3)
        break
      }
      case 'frog': {
        const p = pick(PADS)
        c.x = p.x
        c.y = c.gy = p.y - 2
        break
      }
      case 'monkey': {
        const s = pick(PERCHES)
        c.x = s.x
        c.y = c.gy = s.y
        c.spot = s
        break
      }
      case 'rabbit': {
        for (let i = 0; i < 30; i++) {
          c.x = rand(50, 490)
          c.y = c.gy = rand(392, 512)
          if (!inPond(c.x, c.y, 24)) break
        }
        c.ang = rand(0, Math.PI * 2)
        break
      }
      case 'sparrow': {
        const s = pick(PERCHES)
        if (fresh) {
          c.x = -50
          c.y = c.gy = rand(80, 200)
          c.state = 'fly'
          c.flying = true
          startJump(c, s.x, s.y, 40, 170)
          c.dest = s
        } else {
          c.x = s.x
          c.y = c.gy = s.y
          c.dest = s
          c.state = 'perch'
          c.wait = rand(1, 4)
        }
        break
      }
      default: {
        // butterfly + bee
        const f = pick(FLOWERS)
        if (fresh) {
          c.x = -40
          c.y = rand(120, 300)
        } else {
          c.x = f.x
          c.y = f.y - f.h
        }
        newFlyTarget(c)
      }
    }
  }

  function makeCritter(item, img, fresh) {
    const k = kindById(item.kind)
    if (!k) return
    let dw = k.size
    let dh = k.size * k.aspect
    if (img) {
      const r = img.width / img.height
      if (r >= 1) dh = k.size / r
      else {
        dh = k.size
        dw = k.size * r
      }
    }
    const c = {
      id: item.id,
      kind: item.kind,
      img: img || null,
      pal: item.pal ?? 0,
      dw,
      dh,
      x: 0,
      y: 0,
      gy: 0,
      vx: 0,
      vy: 0,
      t: rand(0, 10),
      ph: rand(0, 6),
      face: 1,
      want: Math.random() < 0.5 ? 1 : -1,
      rot: 0,
      oy: 0,
      air: 0,
      squash: 0,
      peck: 0,
      pop: 0,
      delay: fresh ? 0 : rand(0, 0.7),
      state: 'sit',
      wait: rand(0.3, 2),
      hops: 2,
      dash: 0,
      flying: false,
      shadow: item.kind === 'frog' || item.kind === 'rabbit',
      speed: 60,
      depth: 1,
      retarget: rand(1, 4),
    }
    c.face = c.want
    spawnPoint(c, fresh)
    critters.set(c.id, c)
    if (fresh) {
      const top = c.y - (k.anchor === 'bottom' ? c.dh / 2 : 0)
      sparkle(c.x, top, 14)
    }
    return c
  }

  function loadImage(src) {
    return new Promise((res) => {
      const im = new Image()
      im.onload = () => res(im)
      im.onerror = () => res(null)
      im.src = src
    })
  }

  const STARTERS = [
    ['fish', 0],
    ['fish', 1],
    ['fish', 2],
    ['frog', 0],
    ['monkey', 0],
    ['butterfly', 0],
    ['butterfly', 1],
    ['butterfly', 3],
    ['sparrow', 0],
    ['sparrow', 1],
    ['rabbit', 0],
    ['bee', 0],
    ['bee', 1],
  ].map(([kind, pal], i) => ({ id: `st-${kind}-${i}`, kind, pal, starter: true }))

  function sync(items, starters) {
    const want = new Map()
    for (const it of items || []) if (it && it.id && it.img && kindById(it.kind)) want.set(it.id, it)
    if (starters) for (const s of STARTERS) want.set(s.id, s)
    wanted = new Set(want.keys())
    for (const id of [...critters.keys()]) if (!want.has(id)) critters.delete(id)
    const fresh = !first
    first = false
    for (const [id, it] of want) {
      if (critters.has(id) || loading.has(id)) continue
      if (it.starter) {
        makeCritter(it, null, false)
      } else {
        loading.add(id)
        loadImage(it.img).then((im) => {
          loading.delete(id)
          if (!alive || critters.has(id) || !wanted.has(id)) return
          if (im && im.width > 0) makeCritter(it, im, fresh)
        })
      }
    }
  }

  /* ---- behaviours */
  function newFlyTarget(c) {
    const bee = c.kind === 'bee'
    if (Math.random() < 0.7) {
      const f = pick(FLOWERS)
      c.flower = f
      c.tx = f.x
      c.ty = f.y - f.h - 3
    } else {
      c.flower = null
      c.tx = rand(30, 930)
      c.ty = rand(70, 430)
    }
    c.speed = bee ? rand(110, 160) : rand(52, 78)
    c.state = 'fly'
  }

  const AI = {
    frog(c, dt) {
      if (c.state === 'jump') {
        if (stepJump(c, dt)) {
          c.state = 'sit'
          c.wait = rand(0.9, 2.6)
          if (Math.random() < 0.3) say(c, SAY.frog)
          if (inPond(c.x, c.y, -6) && Math.random() < 0.5) ripple(c.x, c.y, 0.8)
        }
        return
      }
      c.wait -= dt
      if (c.wait <= 0) {
        const near = FROG_SPOTS.filter((s) => {
          const d = dist(s, c)
          return d > 30 && d < 200
        })
        const s = pick(near.length ? near : FROG_SPOTS)
        startJump(c, s.x, s.y, rand(38, 70), 330)
        c.state = 'jump'
      }
    },
    monkey(c, dt) {
      if (c.state === 'jump') {
        if (stepJump(c, dt)) {
          c.state = 'sit'
          c.wait = rand(1, 3)
          if (Math.random() < 0.3) say(c, SAY.monkey)
        }
        return
      }
      c.rot = Math.sin(c.t * 1.6) * 0.04
      c.wait -= dt
      if (c.wait <= 0) {
        const near = TREE_SPOTS.filter((s) => s !== c.spot && dist(s, c) > 20 && dist(s, c) < 340)
        const s = pick(near.length ? near : TREE_SPOTS)
        c.spot = s
        c.shadow = s.kind === 'ground'
        // keep the arc inside the picture (the top branches are close to the sky edge)
        const room = Math.min(s.y, c.y) - c.dh - 6
        startJump(c, s.x, s.y, clamp(30 + dist(s, c) * 0.22, 10, Math.max(10, room)), 360, 0.35)
        c.state = 'jump'
        c.rot = 0
      }
    },
    rabbit(c, dt) {
      if (c.state === 'jump') {
        if (stepJump(c, dt)) {
          c.state = 'sit'
          c.hops--
          if (c.hops > 0) c.wait = rand(0.12, 0.3)
          else {
            c.wait = rand(1.4, 3.4)
            c.hops = randInt(1, 3)
          }
        }
        return
      }
      c.wait -= dt
      if (c.wait <= 0) {
        let tx = c.x
        let ty = c.y
        for (let i = 0; i < 8; i++) {
          const a = c.ang + rand(-0.9, 0.9)
          const d = rand(50, 120)
          tx = clamp(c.x + Math.cos(a) * d, 36, 505)
          ty = clamp(c.y + Math.sin(a) * d * 0.55, 384, 520)
          if (!inPond(tx, ty, 18)) {
            c.ang = a
            break
          }
          c.ang = rand(0, Math.PI * 2)
        }
        startJump(c, tx, ty, rand(18, 30), 230)
        c.state = 'jump'
      }
    },
    sparrow(c, dt) {
      c.shadow = !c.flying && c.state !== 'perch'
      if (c.state === 'fly' || c.state === 'hop') {
        c.oy = c.flying ? Math.sin(c.t * 22) * 2.5 : 0
        if (stepJump(c, dt)) {
          c.oy = 0
          if (c.state === 'fly') {
            c.flying = false
            c.state = c.dest && c.dest.kind === 'ground' ? 'ground' : 'perch'
            c.hops = c.state === 'ground' ? randInt(2, 4) : 0
            c.wait = c.state === 'ground' ? rand(0.3, 0.8) : rand(2, 5)
            if (Math.random() < 0.4) say(c, SAY.sparrow)
          } else {
            c.state = 'ground'
            c.wait = rand(0.35, 0.9)
            c.peck = 0.0001
          }
        }
        return
      }
      if (c.peck > 0) {
        c.peck += dt * 7
        if (c.peck > Math.PI * 2) c.peck = 0
      }
      if (c.state === 'perch') c.rot = Math.sin(c.t * 2) * 0.05
      c.wait -= dt
      if (c.wait > 0) return
      c.rot = 0
      if (c.state === 'ground' && c.hops > 0) {
        c.hops--
        const tx = clamp(c.x + rand(-38, 38), 24, 936)
        const ty = clamp(c.y + rand(-12, 12), 386, 522)
        if (!inPond(tx, ty, 8)) {
          startJump(c, tx, ty, rand(8, 14), 120)
          c.state = 'hop'
          return
        }
      }
      const r = Math.random()
      const dest = r < 0.55 ? pick(PERCHES.filter((s) => s !== c.dest)) : groundSpot()
      c.dest = dest
      c.flying = true
      c.state = 'fly'
      const lift = Math.min(70, dist(dest, c) * 0.22) + 10
      startJump(c, dest.x, dest.y, clamp(lift, 6, Math.max(6, Math.min(dest.y, c.y) - c.dh - 6)), 190, 0.6)
    },
    fish(c, dt) {
      c.dash = Math.max(0, c.dash - dt)
      let chase = null
      let best = 420
      for (const p of food) {
        const d = Math.hypot(p.x - c.x, p.y - c.y)
        if (d < best) {
          best = d
          chase = p
        }
      }
      let speed = c.speed
      if (chase) {
        c.tx = chase.x
        c.ty = chase.y
        speed = 96
      } else if (Math.hypot(c.tx - c.x, c.ty - c.y) < 14 || (c.retarget -= dt) <= 0) {
        const a = rand(0, Math.PI * 2)
        const r = Math.sqrt(Math.random()) * 0.85
        c.tx = POND.x + Math.cos(a) * r * (POND.rx - 26)
        c.ty = POND.y + Math.sin(a) * r * (POND.ry - 22)
        c.retarget = rand(3, 7)
        c.speed = rand(30, 56)
      }
      if (c.dash > 0) speed *= 2.4
      const dx = c.tx - c.x
      const dy = c.ty - c.y
      const d = Math.hypot(dx, dy) || 1
      const k = Math.min(1, dt * 2.6)
      c.vx += ((dx / d) * speed - c.vx) * k
      c.vy += ((dy / d) * speed - c.vy) * k
      c.x += c.vx * dt
      c.y += c.vy * dt
      // keep inside the pond
      const nx = (c.x - POND.x) / (POND.rx - 18)
      const ny = (c.y - POND.y) / (POND.ry - 14)
      const q = nx * nx + ny * ny
      if (q > 1) {
        const f = 1 / Math.sqrt(q)
        c.x = POND.x + nx * f * (POND.rx - 18)
        c.y = POND.y + ny * f * (POND.ry - 14)
      }
      if (Math.abs(c.vx) > 7) c.want = c.vx > 0 ? 1 : -1
      c.rot = clamp(c.vy * 0.012, -0.35, 0.35) * Math.sign(c.face || 1)
      c.oy = Math.sin(c.t * 1.8 + c.ph) * 2.5 // gentle floating
      c.depth = 0.82 + 0.3 * clamp((c.y - (POND.y - POND.ry)) / (2 * POND.ry), 0, 1)
      if (chase && Math.hypot(chase.x - c.x, chase.y - c.y) < 16) {
        food.splice(food.indexOf(chase), 1)
        addPart({ type: 'ring', x: chase.x, y: chase.y, r0: 2, r1: 14, life: 0.6 })
        if (Math.random() < 0.5) say(c, 'nom!')
      }
      if (Math.random() < dt * 0.35) addPart({ type: 'bubble', x: c.x + c.face * c.dw * 0.35, y: c.y - 4, vx: rand(-4, 4), vy: rand(-26, -16), life: rand(1.2, 2) })
    },
    butterfly(c, dt) {
      flyer(c, dt, { wf: 2.2, wa: 38, bf: 5, ba: 6 })
    },
    bee(c, dt) {
      flyer(c, dt, { wf: 9, wa: 70, bf: 21, ba: 1.6 })
    },
  }

  function flyer(c, dt, cfg) {
    if (c.state === 'rest') {
      const f = c.flower
      if (f) {
        c.x = f.x + f.sw
        c.y = f.y - f.h - 3
      }
      c.oy = c.kind === 'bee' ? Math.sin(c.t * 25) * 1.2 : 0
      c.rot = 0
      c.wait -= dt
      if (c.wait <= 0) newFlyTarget(c)
      return
    }
    const dx = c.tx - c.x
    const dy = c.ty - c.y
    const d = Math.hypot(dx, dy) || 1
    const k = Math.min(1, dt * 2.4)
    c.vx += ((dx / d) * c.speed - c.vx) * k
    c.vy += ((dy / d) * c.speed - c.vy) * k
    const lat = Math.sin(c.t * cfg.wf + c.ph) * cfg.wa * Math.min(1, d / 70)
    c.x += (c.vx - (dy / d) * lat) * dt
    c.y += (c.vy + (dx / d) * lat) * dt
    if (d < (c.flower ? 7 : 18)) {
      if (c.flower) {
        c.state = 'rest'
        c.wait = rand(1.5, 3.6)
      } else newFlyTarget(c)
    }
    if (Math.abs(c.vx) > 8) c.want = c.vx > 0 ? 1 : -1
    c.rot = clamp(c.vy * 0.004, -0.4, 0.4) * Math.sign(c.face || 1)
    c.oy = Math.sin(c.t * cfg.bf + c.ph) * cfg.ba
  }

  function update(dt) {
    time += dt
    for (const f of FLOWERS) f.sw = Math.sin(time * 1.3 + f.ph) * 2.5
    for (const cl of clouds) {
      cl.x += cl.v * dt
      if (cl.x > W + 40) cl.x = -140
    }
    for (const c of critters.values()) {
      c.t += dt
      if (c.delay > 0) {
        c.delay -= dt
        continue
      }
      if (c.pop < 1) c.pop = Math.min(1, c.pop + dt * 2.2)
      c.squash = Math.max(0, c.squash - dt * 5)
      AI[c.kind](c, dt)
      c.face += clamp(c.want - c.face, -dt * 9, dt * 9)
      if (c.kind !== 'fish') c.depth = 1
    }
    for (let i = food.length - 1; i >= 0; i--) {
      const p = food[i]
      p.life -= dt
      if (p.y < POND.y + POND.ry - 20) p.y += 16 * dt
      if (p.life <= 0) food.splice(i, 1)
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]
      p.life -= dt
      if (p.life <= 0 || (p.c && !critters.has(p.c.id))) {
        parts.splice(i, 1)
        continue
      }
      p.x = (p.x ?? 0) + p.vx * dt
      p.y = (p.y ?? 0) + p.vy * dt
      p.vy += p.g * dt
    }
  }

  /* ---- drawing */
  function drawCritter(c) {
    const k = kindById(c.kind)
    const pop = c.pop >= 1 ? 1 : easeOutBack(c.pop)
    if (c.pop <= 0 || pop <= 0) return
    // soft shadow on the ground
    if (c.shadow && c.kind !== 'fish') {
      ctx.fillStyle = 'rgba(20,70,40,0.25)'
      ctx.beginPath()
      ctx.ellipse(c.x, c.gy + 1, c.dw * 0.32 * (1 - c.air * 0.35), 5 * (1 - c.air * 0.3), 0, 0, Math.PI * 2)
      ctx.fill()
    }
    const air = c.flying ? 0 : c.air
    const breathe = c.state === 'sit' || c.state === 'perch' ? 1 + 0.018 * Math.sin(c.t * 3) : 1
    const sx = (1 + 0.22 * c.squash - 0.07 * air) * pop * c.depth
    const sy = (1 - 0.2 * c.squash + 0.13 * air) * breathe * pop * c.depth
    ctx.save()
    ctx.translate(c.x, c.y + c.oy)
    ctx.rotate(c.rot + (c.peck ? Math.sin(c.peck) * 0.35 : 0))
    ctx.scale(c.face * sx, sy)
    if (c.img) {
      const top = k.anchor === 'bottom' ? -c.dh : -c.dh / 2
      if (c.kind === 'fish') {
        // wiggle the drawing like a swimming tail
        const n = 18
        const sw = c.img.width / n
        for (let i = 0; i < n; i++) {
          const u = (i + 0.5) / n
          const amp = c.dh * 0.14 * Math.pow(1 - u, 1.6)
          const oy = Math.sin(c.t * 9 - u * 4.5) * amp
          ctx.drawImage(c.img, i * sw, 0, sw, c.img.height, -c.dw / 2 + (i * c.dw) / n, top + oy, c.dw / n + 0.8, c.dh)
        }
      } else if (c.kind === 'butterfly') {
        ctx.scale(0.5 + 0.5 * Math.abs(Math.sin(c.t * (c.state === 'rest' ? 3 : 12))), 1)
        ctx.drawImage(c.img, -c.dw / 2, top, c.dw, c.dh)
      } else if (c.kind === 'bee') {
        ctx.scale(1, 0.92 + 0.08 * Math.sin(c.t * 40))
        ctx.drawImage(c.img, -c.dw / 2, top, c.dw, c.dh)
      } else if (c.kind === 'sparrow' && c.flying) {
        ctx.scale(1, 1 + 0.1 * Math.sin(c.t * 30))
        ctx.drawImage(c.img, -c.dw / 2, top, c.dw, c.dh)
      } else {
        ctx.drawImage(c.img, -c.dw / 2, top, c.dw, c.dh)
      }
    } else {
      STARTER[c.kind](ctx, c, k.size)
    }
    ctx.restore()
  }

  function drawPart(p) {
    const u = 1 - p.life / p.max
    switch (p.type) {
      case 'ring':
        ctx.globalAlpha = (1 - u) * 0.8
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.beginPath()
        {
          const r = lerp(p.r0, p.r1, u)
          ctx.ellipse(p.x, p.y, r, r * 0.42, 0, 0, Math.PI * 2)
        }
        ctx.stroke()
        break
      case 'bubble':
        ctx.globalAlpha = Math.min(1, p.life * 1.5) * 0.85
        ctx.strokeStyle = '#fff'
        ctx.fillStyle = 'rgba(255,255,255,0.25)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(p.x + Math.sin(u * 9) * 2, p.y, 3 + u * 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        break
      case 'heart':
        ctx.globalAlpha = Math.min(1, p.life * 1.6)
        ctx.fillStyle = '#ff4f86'
        ctx.font = `${16 + u * 6}px sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText('♥', p.x, p.y)
        break
      case 'spark':
        ctx.globalAlpha = 1 - u
        ctx.fillStyle = p.col
        ctx.fillRect(Math.round(p.x) - 2, Math.round(p.y) - 2, 4, 4)
        break
      case 'say': {
        const c = p.c
        const k = kindById(c.kind)
        ctx.font = "bold 14px 'Pixelify Sans', 'Courier New', monospace"
        const tw = ctx.measureText(p.text).width
        const bw = tw + 16
        const top = (k.anchor === 'bottom' ? c.dh : c.dh / 2) * c.depth
        const bx = clamp(c.x - bw / 2, 4, W - bw - 4)
        const by = c.y + c.oy - top - 34 - u * 8
        ctx.globalAlpha = Math.min(1, p.life * 3, (1 - u) * 4)
        ctx.fillStyle = '#fff'
        ctx.strokeStyle = OL
        ctx.lineWidth = 2
        ctx.beginPath()
        if (ctx.roundRect) ctx.roundRect(bx, by, bw, 24, 8)
        else ctx.rect(bx, by, bw, 24)
        ctx.fill()
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(c.x - 5, by + 24)
        ctx.lineTo(c.x, by + 31)
        ctx.lineTo(c.x + 5, by + 24)
        ctx.fillStyle = '#fff'
        ctx.fill()
        ctx.fillStyle = OL
        ctx.textAlign = 'center'
        ctx.fillText(p.text, bx + bw / 2, by + 17)
        break
      }
      default:
    }
    ctx.globalAlpha = 1
  }

  function drawFlower(f) {
    const tx = f.x + f.sw
    const ty = f.y - f.h
    ctx.strokeStyle = '#2f8a4a'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(f.x, f.y)
    ctx.quadraticCurveTo(f.x + f.sw * 0.2, f.y - f.h * 0.5, tx, ty)
    ctx.stroke()
    ctx.fillStyle = '#3fa65a'
    ctx.beginPath()
    ctx.ellipse(f.x + 6, f.y - f.h * 0.35, 7, 3, -0.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = f.col
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + f.ph
      ctx.beginPath()
      ctx.arc(tx + Math.cos(a) * 5.5, ty + Math.sin(a) * 5.5, 4.2, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = f.col === '#ffd23f' ? '#ff8a3d' : '#ffd23f'
    ctx.beginPath()
    ctx.arc(tx, ty, 3.2, 0, Math.PI * 2)
    ctx.fill()
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(sky, 0, 0)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    for (const cl of clouds) drawCloud(ctx, cl.x, cl.y, cl.s, night)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.drawImage(land, 0, 0)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const all = [...critters.values()]
    // underwater: fish, food, bubbles
    ctx.save()
    ctx.beginPath()
    ctx.ellipse(POND.x, POND.y, POND.rx - 2, POND.ry - 2, 0, 0, Math.PI * 2)
    ctx.clip()
    all.filter((c) => c.kind === 'fish').sort((a, b) => a.y - b.y).forEach(drawCritter)
    for (const p of food) {
      ctx.fillStyle = '#b5773e'
      ctx.beginPath()
      ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = OL
      ctx.lineWidth = 1
      ctx.stroke()
    }
    parts.filter((p) => p.type === 'bubble').forEach(drawPart)
    // water tint over the fish so they look submerged
    const wg = ctx.createLinearGradient(0, POND.y - POND.ry, 0, POND.y + POND.ry)
    wg.addColorStop(0, 'rgba(120,210,255,0.30)')
    wg.addColorStop(1, 'rgba(30,110,190,0.22)')
    ctx.fillStyle = wg
    ctx.fillRect(POND.x - POND.rx, POND.y - POND.ry, POND.rx * 2, POND.ry * 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'
    ctx.lineWidth = 2
    for (let i = 0; i < 9; i++) {
      const sx = POND.x - 170 + i * 42 + Math.sin(time * 0.8 + i) * 8
      const sy = POND.y - 52 + ((i * 37) % 100) + Math.cos(time * 0.9 + i * 2) * 3
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.lineTo(sx + 18 + Math.sin(time + i) * 4, sy)
      ctx.stroke()
    }
    ctx.restore()
    parts.filter((p) => p.type === 'ring').forEach(drawPart)

    // lily pads
    for (const p of PADS) {
      const bob = Math.sin(time * 1.2 + p.ph) * 1.2
      ctx.fillStyle = '#2f9a52'
      ctx.beginPath()
      ctx.ellipse(p.x, p.y + 3 + bob, p.r, p.r * 0.46, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#4ccc78'
      ctx.beginPath()
      ctx.ellipse(p.x, p.y + bob, p.r, p.r * 0.46, 0, 0.25, Math.PI * 2 - 0.25)
      ctx.lineTo(p.x, p.y + bob)
      ctx.fill()
      ctx.strokeStyle = 'rgba(20,90,50,0.6)'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
    // flowers + animals standing on the ground, back to front
    const stand = [
      ...FLOWERS.map((f) => ({ y: f.y, draw: () => drawFlower(f) })),
      ...all
        .filter((c) => c.kind !== 'fish' && !(c.kind === 'butterfly' || c.kind === 'bee' || (c.kind === 'sparrow' && c.flying)))
        .map((c) => ({ y: c.gy || c.y, draw: () => drawCritter(c) })),
    ].sort((a, b) => a.y - b.y)
    stand.forEach((s) => s.draw())
    // flyers on top
    all.filter((c) => c.kind === 'butterfly' || c.kind === 'bee' || (c.kind === 'sparrow' && c.flying)).forEach(drawCritter)
    parts.filter((p) => p.type !== 'bubble' && p.type !== 'ring').forEach(drawPart)

    if (night) {
      ctx.fillStyle = 'rgba(12,20,80,0.36)'
      ctx.fillRect(0, 0, W, H)
      for (const f of fireflies) {
        const fx = f.x + Math.sin(time * 0.7 + f.ph) * 34
        const fy = f.y + Math.cos(time * 0.5 + f.ph * 2) * 22
        const a = 0.35 + 0.65 * Math.pow(Math.sin(time * 2.4 + f.ph), 2)
        const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, 12)
        g.addColorStop(0, `rgba(255,248,150,${a})`)
        g.addColorStop(1, 'rgba(255,248,150,0)')
        ctx.fillStyle = g
        ctx.fillRect(fx - 12, fy - 12, 24, 24)
      }
    }
  }

  function frame(now) {
    if (!alive) return
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    if (!paused) update(dt)
    render()
    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)

  /* ---- interaction */
  function hit(c, px, py) {
    if (c.pop < 0.6) return false
    const k = kindById(c.kind)
    const w = Math.max(c.dw, 34) * c.depth
    const h = Math.max(c.dh, 34) * c.depth
    const top = k.anchor === 'bottom' ? c.y - h : c.y - h / 2
    return px >= c.x - w / 2 && px <= c.x + w / 2 && py >= top + c.oy && py <= top + h + c.oy
  }

  function poke(c) {
    hearts(c)
    say(c, SAY[c.kind])
    if (c.kind === 'fish') {
      c.dash = 0.9
      const a = rand(0, Math.PI * 2)
      c.tx = POND.x + Math.cos(a) * (POND.rx - 40)
      c.ty = POND.y + Math.sin(a) * (POND.ry - 30)
    } else if (c.state === 'sit' || c.state === 'perch' || c.state === 'rest' || c.state === 'ground') {
      c.wait = 0
      if (c.state === 'rest') c.wait = 0
    }
  }

  // x, y are 0..W / 0..H scene coordinates
  function pointer(px, py) {
    const all = [...critters.values()]
    const order = [
      ...all.filter((c) => c.kind === 'butterfly' || c.kind === 'bee' || (c.kind === 'sparrow' && c.flying)),
      ...all.filter((c) => c.kind !== 'fish' && !(c.kind === 'butterfly' || c.kind === 'bee' || (c.kind === 'sparrow' && c.flying))).sort((a, b) => (b.gy || b.y) - (a.gy || a.y)),
      ...all.filter((c) => c.kind === 'fish'),
    ]
    const c = order.find((o) => hit(o, px, py))
    if (c) {
      poke(c)
      return 'poke'
    }
    if (inPond(px, py, -4)) {
      ripple(px, py, 1.2)
      for (let i = 0; i < 3; i++) {
        food.push({ x: clamp(px + rand(-16, 16), POND.x - POND.rx + 30, POND.x + POND.rx - 30), y: clamp(py + rand(-8, 8), POND.y - POND.ry + 16, POND.y + POND.ry - 16), life: 14 })
      }
      if (food.length > 24) food.splice(0, food.length - 24)
      return 'feed'
    }
    return null
  }

  return {
    sync,
    pointer,
    setNight(v) {
      night = !!v
      buildSky()
    },
    setPaused(v) {
      paused = !!v
    },
    destroy() {
      alive = false
      cancelAnimationFrame(raf)
      critters.clear()
    },
  }
}