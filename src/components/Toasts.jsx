import { useStore } from '../lib/store'

export default function Toasts() {
  const { toasts, dismissToast } = useStore()
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>
          <span>{t.msg}</span>
          <button type="button" aria-label="Dismiss" onClick={() => dismissToast(t.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
