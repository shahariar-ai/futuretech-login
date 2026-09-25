/* =========================================================
   Page transitions between index, dashboard and reset pages.
   ---------------------------------------------------------
   Modern Chromium / Safari: CSS cross-document View
   Transitions (@view-transition in base.css) morph the lamp
   and the card between pages; nothing to do here.
   Other browsers: a short fade out before navigating, and a
   fade in on arrival (CSS). Reduced motion: no animation.
   ========================================================= */

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const FADE_MS = 200;

/** True when the browser animates same-origin navigations itself. */
export const supportsCrossDocumentTransitions = () => 'onpagereveal' in window;

/** Go to another page of the app with the right transition. */
export function navigate(url, { replace = false } = {}) {
  const go = () => (replace ? window.location.replace(url) : window.location.assign(url));
  if (supportsCrossDocumentTransitions() || reducedMotion.matches) {
    go();
    return;
  }
  document.documentElement.classList.add('is-page-leaving');
  window.setTimeout(go, FADE_MS);
}

// Coming back through the back/forward cache: undo the fade-out
window.addEventListener('pageshow', (event) => {
  if (event.persisted) document.documentElement.classList.remove('is-page-leaving');
});
