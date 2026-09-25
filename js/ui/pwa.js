/* =========================================================
   PWA helpers: service worker registration, the "Install
   app" button and the offline banner.
   ========================================================= */

const OFFLINE_TEXT = 'You’re offline. Signing in and saving need a connection.';

/** Register sw.js (https or localhost only; browsers require it). */
function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  const register = () => {
    navigator.serviceWorker.register(new URL('sw.js', document.baseURI), { scope: './' }).catch(() => {
      // Not fatal: the site works without the service worker
    });
  };
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register);
}

/** Show the button only when the browser says the app can be installed. */
function initInstallButton(button) {
  if (!button) return;
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); // we show our own, quieter button instead of the browser's
    deferredPrompt = event;
    button.hidden = false;
  });

  button.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    button.hidden = true;
    const promptEvent = deferredPrompt;
    deferredPrompt = null;
    promptEvent.prompt();
    try {
      await promptEvent.userChoice;
    } catch (error) {
      // Dismissed: nothing to do
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    button.hidden = true;
  });
}

function initOfflineBanner() {
  const banner = document.createElement('p');
  banner.className = 'offline-banner';
  banner.setAttribute('role', 'status');
  banner.textContent = OFFLINE_TEXT;
  banner.hidden = navigator.onLine !== false;
  document.body.appendChild(banner);
  window.addEventListener('offline', () => { banner.hidden = false; });
  window.addEventListener('online', () => { banner.hidden = true; });
}

export function initPwa() {
  registerServiceWorker();
  initInstallButton(document.getElementById('install-btn'));
  initOfflineBanner();
}
