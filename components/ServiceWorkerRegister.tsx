// components/ServiceWorkerRegister.tsx
'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Register the service worker
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope)

          // Handle updates: detect when a new SW is waiting and prompt user
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('New service worker installed and waiting')

                  // Prompt user to update (robust: show confirm dialog)
                  if (confirm('A new version of the app is available. Reload to update?')) {
                    // Tell the waiting SW to activate immediately
                    newWorker.postMessage({ type: 'SKIP_WAITING' })
                    // Reload the page to apply the update
                    window.location.reload()
                  }
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })

      // Listen for messages sent from the service worker (e.g., sync requests)
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SYNC_REQUESTED') {
          console.log('Sync requested by service worker')
          // Handle sync logic here (e.g., retry failed API calls)
          // Example: re-fetch data or trigger a background sync
          console.log('Performing background sync...')
          // Own/custom sync code goes here (e.g., call an API)
        }
      })
    } else {
      console.warn('Service workers are not supported in this browser')
    }
  }, []) // Empty dependency array — runs once on mount

  return null // This component renders nothing visible
}
