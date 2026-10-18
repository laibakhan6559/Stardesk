import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { StoreProvider } from './lib/store'
import { TimerProvider } from './lib/timer'
import './styles.css'
import './step1.css'
import './step2.css'
import './step34.css'
import './step56.css'
import './step78.css'
import './step910.css'
import './step11.css'
import './responsive.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider>
      <TimerProvider>
        <App />
      </TimerProvider>
    </StoreProvider>
  </StrictMode>
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
}