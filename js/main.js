/**
 * Main entry point for the game
 * @module main
 */

import { gameManager } from './gameManager.js';
import { supportsServiceWorker } from './utils.js';

/**
 * Register service worker for PWA functionality
 */
async function registerServiceWorker() {
  if (!supportsServiceWorker()) {
    console.log('Service Workers not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    });

    console.log('Service Worker registered:', registration.scope);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker available, prompt user to refresh
          if (confirm('Nova versão disponível! Recarregar a página?')) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }
        }
      });
    });
  } catch (error) {
    console.error('Service Worker registration failed:', error);
  }
}

/**
 * Check for app updates
 */
function checkForUpdates() {
  if (!supportsServiceWorker()) return;

  navigator.serviceWorker.ready.then((registration) => {
    registration.update();
  });
}

/**
 * Initialize the application
 */
async function init() {
  try {
    // Register service worker
    await registerServiceWorker();

    // Initialize game manager
    await gameManager.initialize();

    // Check for updates every 30 minutes
    setInterval(checkForUpdates, 30 * 60 * 1000);

    console.log('Game initialized successfully');
  } catch (error) {
    console.error('Failed to initialize game:', error);
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Handle visibility change (user returns to tab)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    checkForUpdates();
  }
});

// Handle online/offline events
window.addEventListener('online', () => {
  console.log('Connection restored');
  // Could show a toast notification here
});

window.addEventListener('offline', () => {
  console.log('Connection lost - running in offline mode');
  // Could show a toast notification here
});

// Prevent zoom on double tap for better mobile UX
let lastTouchEnd = 0;
document.addEventListener('touchend', (event) => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, { passive: false });
