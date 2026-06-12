import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import MultiTenantApp from './MultiTenantApp.jsx'
import { MULTI_TENANT } from './firebase'
import './index.css'

// MULTI_TENANT is OFF by default (and in production), so this renders the
// existing single-family App unchanged. Set VITE_MULTI_TENANT=true locally to
// preview the new real-auth flow during the Phase 1 rollout.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {MULTI_TENANT ? <MultiTenantApp /> : <App />}
  </React.StrictMode>,
)

// Register the service worker for installability + offline app shell.
// Dev (Vite) skips this so HMR isn't shadowed by a cache; prod-only.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((e) => console.warn('SW register failed', e))
  })
}
