import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// PWA Install prompt handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Note: Service worker registration would go here in a full PWA implementation
    console.log('PWA features available - manifest loaded')
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
