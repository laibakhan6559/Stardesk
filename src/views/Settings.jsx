import { useRef, useState } from 'react'
import { format, formatDistanceToNowStrict } from 'date-fns'
import { Field, PageTitle, Win } from '../components/ui'
import { KEY_V1, migrate, useStore } from '../lib/store'
import { THEMES } from '../lib/themes'
import { askNotifyPermission, beep, canNotify, notify } from '../lib/sound'

const UNDO_KEY = 'stardesk:undo'
const readUndo = () => {
  try {
    return JSON.parse(localStorage.getItem(UNDO_KEY) || 'null')
  } catch {
    return null
  }
}
// Everything the user has added, counted across all apps (for the "saved items" line).
const countItems = (d) => {
  const n = (x) => (Array.isArray(x) ? x.length : 0)
  const objN = (o) => (o && typeof o === 'object' ? Object.keys(o).length : 0)
  return (
    ['events', 'tasks', 'habits', 'classes', 'keyDates', 'notes', 'sessions', 'lists', 'bills', 'birthdays', 'trips', 'workouts', 'meds', 'breath', 'jobs', 'meetings', 'routines', 'goals', 'vision', 'reading', 'watch', 'bucket', 'capsule'].reduce((a, k) => a + n(d[k]), 0) +
    n(d.meals?.grocery) + objN(d.meals?.plan) + n(d.chores?.items) + n(d.budget?.tx) + n(d.cycle?.periods) +
    n(d.freelance?.projects) + n(d.freelance?.invoices) + n(d.freelance?.time) +
    objN(d.moodNotes) + objN(d.gratitude) + objN(d.priorities)
  )
}

export default function Settings() {
  const { data, setSetting, replaceAll, toast } = useStore()
  const s = data.settings
  const file = useRef(null)
  const [undo, setUndo] = useState(readUndo)
  const [withPrivate, setWithPrivate] = useState(true)

  // Keeps a copy of the current data so a restore / reset can be undone.
  const snapshot = () => {
    try {
      localStorage.setItem(UNDO_KEY, JSON.stringify({ at: new Date().toISOString(), data }))
      setUndo(readUndo())
    } catch {
      /* storage full - the action still goes ahead after the confirm */
    }
  }
  const undoLast = () => {
    const u = readUndo()
    if (!u?.data) return
    replaceAll(migrate(u.data))
    try {
      localStorage.removeItem(UNDO_KEY)
    } catch {
      /* ignore */
    }
    setUndo(null)
    toast('Your previous data is back ↩️', 'ok')
  }

  const turnOnNotif = async () => {
    const p = await askNotifyPermission()
    if (p === 'granted') {
      setSetting('notif', true)
      notify('Stardesk', 'Notifications are on 🔔')
      toast('Browser notifications enabled 🔔', 'ok')
    } else {
      setSetting('notif', false)
      toast(p === 'unsupported' ? 'This browser does not support notifications.' : 'Notifications are blocked – allow them in your browser site settings.', 'info')
    }
  }

  const exportData = () => {
    const out = { ...data, app: 'stardesk', exportedAt: new Date().toISOString() }
    if (!withPrivate) {
      // private apps stay out of the file (handy when you share a backup)
      out.cycle = { ...out.cycle, periods: [] }
      out.capsule = []
    }
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `stardesk-backup-${format(new Date(), 'yyyy-MM-dd')}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    setSetting('lastBackup', new Date().toISOString())
    toast('Backup downloaded ⬇', 'ok')
  }

  const importData = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const r = new FileReader()
    r.onload = () => {
      try {
        const raw = JSON.parse(String(r.result))
        // Old (v1) and new (v2) backups both work: migrate() upgrades them.
        if (!raw || typeof raw !== 'object' || !Array.isArray(raw.events) || !Array.isArray(raw.tasks)) throw new Error('bad')
        const incoming = migrate(raw)
        if (!window.confirm(`This replaces everything currently in Stardesk with the backup (${countItems(incoming)} items). You can undo it right after. Continue?`)) return
        snapshot()
        replaceAll(incoming)
        toast(`Backup restored ✨ ${countItems(incoming)} items`, 'ok')
      } catch {
        toast('That file is not a valid Stardesk backup.', 'info')
      }
    }
    r.readAsText(f)
  }

  const reset = () => {
    if (!window.confirm('Delete ALL your planner data from this browser? This cannot be undone.')) return
    snapshot() // keeps a copy so "Undo" can bring everything back
    replaceAll({})
    try {
      localStorage.removeItem(KEY_V1) // also remove the old v1 copy kept for safety
    } catch {
      /* ignore */
    }
    toast('Fresh start! 🌱 (Undo is available below)', 'ok')
  }

  const count = countItems(data)
  const last = s.lastBackup ? new Date(s.lastBackup) : null
  const lastOk = last && !Number.isNaN(last.getTime())

  return (
    <>
      <PageTitle sub="Make Stardesk yours. Everything is stored privately in this browser.">Settings</PageTitle>
      <div className="grid12">
        <div className="c6 stack-lg">
          <Win title="Profile & look">
            <div className="form">
              <Field label="Your name (for the greeting)">
                <input maxLength={30} value={s.name} onChange={(e) => setSetting('name', e.target.value)} placeholder="Star" />
              </Field>
              <div className="field">
                <span>Theme</span>
                <div className="themes">
                  {THEMES.map((t) => (
                    <button key={t.id} className={`themebtn ${s.theme === t.id ? 'on' : ''}`} aria-pressed={s.theme === t.id} onClick={() => setSetting('theme', t.id)}>
                      <span className="sw" aria-hidden="true">
                        {t.swatch.map((c) => (
                          <i key={c} style={{ background: c }} />
                        ))}
                      </span>
                      <span>
                        {t.emoji} {t.name}
                      </span>
                      <small>{t.dark ? 'Dark' : 'Light'}</small>
                    </button>
                  ))}
                </div>
              </div>
              <Field label="Week starts on">
                <select value={s.weekStart} onChange={(e) => setSetting('weekStart', Number(e.target.value))}>
                  <option value={1}>Monday</option>
                  <option value={0}>Sunday</option>
                </select>
              </Field>
            </div>
          </Win>

          <Win title="Reminders">
            <div className="form">
              <label className="switch">
                <input type="checkbox" checked={s.sound} onChange={(e) => setSetting('sound', e.target.checked)} />
                <span>Play a chime when a reminder rings</span>
              </label>
              <div className="row wrap">
                <button className="btn small" onClick={turnOnNotif} disabled={!canNotify()}>
                  {s.notif ? '🔔 Notifications on' : '🔕 Enable browser notifications'}
                </button>
                <button className="btn small ghost" onClick={beep}>
                  Test sound
                </button>
              </div>
              <p className="hint">
                Reminders ring while Stardesk is open in a tab (it can stay in the background). Install it to your home screen for the best
                experience on phones.
              </p>
            </div>
          </Win>
        </div>

        <div className="c6 stack-lg">
          <Win title="Your data">
            <div className="form">
              <p>
                You have <b>{count}</b> saved items. They live only in this browser – no account, no server. Export a backup now and then, or to
                move to another device.
              </p>
              <p className="hint">
                {lastOk ? `Last backup: ${formatDistanceToNowStrict(last, { addSuffix: true })} (${format(last, 'd MMM yyyy')}).` : 'You have not exported a backup yet.'}
              </p>
              <label className="switch">
                <input type="checkbox" checked={withPrivate} onChange={(e) => setWithPrivate(e.target.checked)} />
                <span>Include private data (cycle tracker, time capsules)</span>
              </label>
              <div className="row wrap">
                <button className="btn small" onClick={exportData}>
                  ⬇ Export backup
                </button>
                <button className="btn small ghost" onClick={() => file.current?.click()}>
                  ⬆ Import backup
                </button>
                <input ref={file} type="file" accept="application/json,.json" hidden onChange={importData} />
              </div>
              {undo?.data && (
                <button className="btn small" onClick={undoLast}>
                  ↩ Undo last restore / delete ({undo.at ? format(new Date(undo.at), 'd MMM, HH:mm') : 'saved copy'})
                </button>
              )}
              <button className="btn small danger" onClick={reset}>
                Delete everything
              </button>
            </div>
          </Win>
        </div>
      </div>
    </>
  )
}