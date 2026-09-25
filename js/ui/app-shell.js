/* =========================================================
   App shell — the parts every page shares: the demo-mode
   badge, the background particles and the PWA helpers
   (service worker, Install app button, offline banner).
   ========================================================= */

import { isDemo } from '../auth/auth-service.js';
import { createParticles } from './lamp.js';
import { initPwa } from './pwa.js';

export function initAppShell() {
  const badge = document.getElementById('demo-badge');
  if (badge) badge.hidden = !isDemo;
  document.body.classList.toggle('is-demo', isDemo);
  createParticles(document.getElementById('particles'));
  initPwa();
}
