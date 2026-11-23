import { applyFont, applyTheme, storedFont, storedMode, storedPalette } from './lib/theme'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './styles.css'
import App from './App'
import { StoreProvider } from './lib/store'

applyTheme(storedMode(), storedPalette())
applyFont(storedFont())

// When a new version is deployed, reload once so people aren't left on the old one
if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
  let reloaded = false
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded) { reloaded = true; location.reload() } })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <StoreProvider>
        <App />
      </StoreProvider>
    </HashRouter>
  </StrictMode>
)
