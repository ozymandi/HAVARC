import { StrictMode } from 'react'
import { registerSW } from 'virtual:pwa-register'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthProvider'

/* New version → the page reloads itself (registerType 'autoUpdate' reloads once the new
 * service worker takes over). Browsers only look for a new worker on navigation, and an
 * installed PWA can stay open for days, so we also check whenever the app comes back to
 * the foreground and once an hour. The draft and the outbox live in IndexedDB, so a reload
 * never loses work. */
const UPDATE_CHECK_MS = 60 * 60 * 1000
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return
    const check = () => {
      if (document.visibilityState === 'visible') void registration.update()
    }
    document.addEventListener('visibilitychange', check)
    setInterval(check, UPDATE_CHECK_MS)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
