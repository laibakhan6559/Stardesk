// Home widget registry + pure layout helpers.
// Add a widget: push a line to WIDGETS here, and add its component to
// WIDGET_VIEWS in views/Home.jsx. Everything else (hide / move / resize /
// restore / reset) works automatically.
//
// meta: id, title (shown in Customize), emoji, span (default width in 12 cols),
//       hiddenByDefault (optional - new widgets that start hidden for existing users)

export const WIDGETS = [
  { id: 'hero', title: 'Welcome', emoji: '👋', span: 8 },
  { id: 'zoo', title: 'Pixel Zoo (game)', emoji: '🐸', span: 4 },
  { id: 'studylinks', title: 'Study time', emoji: '📝', span: 4 },
  { id: 'prayer', title: 'Prayer times & Hijri', emoji: '🕌', span: 4 },
  { id: 'weather', title: 'Weather', emoji: '⛅', span: 4 },
  { id: 'countdowns', title: 'Countdowns', emoji: '⏳', span: 4 },
  { id: 'classes', title: 'Classes', emoji: '🎓', span: 4 },
  { id: 'today', title: 'Today', emoji: '🗓️', span: 4 },
  { id: 'vibe', title: 'Mood check-in', emoji: '🌤️', span: 4 },
  { id: 'important', title: 'Key dates', emoji: '⭐', span: 7 },
  { id: 'numbers', title: 'My day in numbers', emoji: '📊', span: 5 },
  { id: 'notes', title: 'Notes', emoji: '📒', span: 5 },
  { id: 'player', title: 'Ambient sounds', emoji: '🎧', span: 4 },
  { id: 'timetable', title: 'Timetable', emoji: '🌙', span: 3 },
  { id: 'apps', title: 'My apps', emoji: '🧩', span: 4 },
  { id: 'clock', title: 'World clock', emoji: '🌍', span: 4, hiddenByDefault: true },
  { id: 'meals', title: 'What to cook today', emoji: '🍲', span: 4 },
  { id: 'bills', title: 'Bills due', emoji: '🧾', span: 4 },
  { id: 'birthdays', title: 'Birthdays', emoji: '🎂', span: 4 },
  { id: 'budget', title: 'Budget', emoji: '💰', span: 4, hiddenByDefault: true },
  { id: 'chores', title: 'Home chores', emoji: '🧹', span: 4, hiddenByDefault: true },
  { id: 'water', title: 'Water', emoji: '💧', span: 4 },
  { id: 'medicine', title: 'Medicine today', emoji: '💊', span: 4 },
  { id: 'cycle', title: 'Personal tracker (private)', emoji: '🌸', span: 4, hiddenByDefault: true },
  { id: 'breathe', title: 'Take a breath', emoji: '🫧', span: 4, hiddenByDefault: true },
  { id: 'priorities', title: 'Top 3 this week', emoji: '🎯', span: 4 },
  { id: 'routines', title: 'Routines today', emoji: '🔗', span: 4 },
  { id: 'quote', title: 'Today’s affirmation', emoji: '💌', span: 4 },
  { id: 'gratitude', title: 'Gratitude', emoji: '🙏', span: 4 },
  { id: 'goals', title: 'Goals this year', emoji: '🏔️', span: 4, hiddenByDefault: true },
  { id: 'reading', title: 'Reading now', emoji: '📚', span: 4, hiddenByDefault: true },
  { id: 'jobs', title: 'Job follow-ups', emoji: '📮', span: 4, hiddenByDefault: true },
  { id: 'freelance', title: 'Freelance', emoji: '🧑‍💻', span: 4, hiddenByDefault: true },
]

export const SPANS = [3, 4, 5, 6, 7, 8, 12]
const ids = () => WIDGETS.map((w) => w.id)
const meta = (id) => WIDGETS.find((w) => w.id === id)

export const emptyLayout = () => ({ order: [], hidden: [], size: {}, seen: ids() })

// Combines saved layout with the registry: unknown ids are dropped, new
// widgets are appended, hiddenByDefault widgets stay hidden until first shown.
export function resolveLayout(saved) {
  const l = { order: [], hidden: [], size: {}, seen: [], ...(saved || {}) }
  const known = new Set(ids())
  const order = l.order.filter((id, i) => known.has(id) && l.order.indexOf(id) === i)
  for (const w of WIDGETS) if (!order.includes(w.id)) order.push(w.id)
  const hidden = new Set(l.hidden.filter((id) => known.has(id)))
  for (const w of WIDGETS) if (w.hiddenByDefault && !l.seen.includes(w.id)) hidden.add(w.id)
  const span = (id) => (SPANS.includes(l.size?.[id]) ? l.size[id] : meta(id).span)
  return {
    order,
    hidden: [...hidden],
    size: l.size || {},
    visible: order.filter((id) => !hidden.has(id)).map((id) => ({ id, span: span(id) })),
    hiddenList: order.filter((id) => hidden.has(id)),
  }
}

const commit = (r, patch) => ({ order: r.order, hidden: r.hidden, size: r.size, ...patch, seen: ids() })

export function moveBy(saved, id, dir) {
  const r = resolveLayout(saved)
  const vis = r.order.filter((x) => !r.hidden.includes(x))
  const i = vis.indexOf(id)
  const j = i + dir
  if (i < 0 || j < 0 || j >= vis.length) return commit(r, {})
  const order = [...r.order]
  const a = order.indexOf(vis[i])
  const b = order.indexOf(vis[j])
  ;[order[a], order[b]] = [order[b], order[a]]
  return commit(r, { order })
}

// Drag & drop: put `from` where `to` is.
export function reorderTo(saved, from, to) {
  const r = resolveLayout(saved)
  if (from === to || !r.order.includes(from) || !r.order.includes(to)) return commit(r, {})
  const fromIdx = r.order.indexOf(from)
  const toIdx = r.order.indexOf(to)
  const order = r.order.filter((x) => x !== from)
  order.splice(fromIdx < toIdx ? order.indexOf(to) + 1 : order.indexOf(to), 0, from)
  return commit(r, { order })
}

export function hideWidget(saved, id) {
  const r = resolveLayout(saved)
  return commit(r, { hidden: [...new Set([...r.hidden, id])] })
}

export function showWidget(saved, id) {
  const r = resolveLayout(saved)
  return commit(r, { hidden: r.hidden.filter((x) => x !== id) })
}

// dir: -1 narrower, +1 wider
export function resizeWidget(saved, id, dir) {
  const r = resolveLayout(saved)
  const cur = r.visible.find((v) => v.id === id)?.span ?? meta(id)?.span
  const i = Math.max(0, Math.min(SPANS.length - 1, SPANS.indexOf(cur) + dir))
  return commit(r, { size: { ...r.size, [id]: SPANS[i] } })
}