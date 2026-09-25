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

// The browser may skip a cross-document transition (for example when the
// next page renders late). The page still navigates normally; this only
// stops the skipped transition from surfacing as an unhandled error.
function quietlySkip(event) {
  const transition = event.viewTransition;
  if (!transition) return;
  [transition.ready, transition.updateCallbackDone, transition.finished].forEach((promise) => {
    if (promise) promise.catch(() => {});
  });
}
window.addEventListener('pageswap', quietlySkip);
window.addEventListener('pagereveal', quietlySkip);
