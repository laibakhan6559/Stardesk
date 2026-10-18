let actx

function ctx() {
  if (!actx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    actx = new AC()
  }
  if (actx.state === 'suspended') actx.resume()
  return actx
}

// Short, friendly 3-note chime (no audio files needed).
export function beep() {
  try {
    const c = ctx()
    if (!c) return
    const notes = [784, 988, 1175]
    notes.forEach((f, i) => {
      const o = c.createOscillator()
      const g = c.createGain()
      o.type = 'square'
      o.frequency.value = f
      const t = c.currentTime + i * 0.14
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18)
      o.connect(g)
      g.connect(c.destination)
      o.start(t)
      o.stop(t + 0.2)
    })
  } catch {
    /* audio blocked */
  }
}

export function canNotify() {
  return typeof Notification !== 'undefined'
}

export function notify(title, body) {
  try {
    if (canNotify() && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon-192.png', tag: title + body })
    }
  } catch {
    /* some mobile browsers only allow notifications via service worker */
  }
}

export async function askNotifyPermission() {
  if (!canNotify()) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}
