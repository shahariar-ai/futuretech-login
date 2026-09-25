/* =========================================================
   App shell — the parts every page shares: the demo-mode
   badge and the background particles.
   ========================================================= */

import { isDemo } from '../auth/auth-service.js';
import { createParticles } from './lamp.js';

export function initAppShell() {
  const badge = document.getElementById('demo-badge');
  if (badge) badge.hidden = !isDemo;
  document.body.classList.toggle('is-demo', isDemo);
  createParticles(document.getElementById('particles'));
}
