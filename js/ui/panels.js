/* =========================================================
   Panels — switch between the views inside the card
   (form ↔ success) with a short fade.
   ========================================================= */

import { prefersReducedMotion } from './lamp.js';

const LEAVE_MS = 300;

/**
 * Fade `from` out, then reveal `to` and move focus to `focusEl`.
 * Panels use the `hidden` attribute plus an `.is-visible` class.
 */
export function swapPanel(from, to, { focusEl } = {}) {
  from.classList.add('is-leaving');

  window.setTimeout(() => {
    from.hidden = true;
    from.classList.remove('is-leaving', 'is-visible');
    to.hidden = false;
    requestAnimationFrame(() => {
      to.classList.add('is-visible');
      if (focusEl) focusEl.focus();
    });
  }, prefersReducedMotion() ? 0 : LEAVE_MS);
}

/** Show `to` immediately (no animation), hiding `from`. */
export function showPanelNow(from, to) {
  from.classList.remove('is-visible', 'is-leaving');
  from.hidden = true;
  to.hidden = false;
}
