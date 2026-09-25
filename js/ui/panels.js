/* =========================================================
   Panels — the views inside one card (sign in, create
   account, forgot password…). Switching crossfades the
   panels and smoothly animates the card's height.
   Each panel carries its card heading in data-title and
   data-sub, and uses the `hidden` attribute + .is-visible.
   ========================================================= */

import { prefersReducedMotion } from './lamp.js';

const LEAVE_MS = 180;
const RESIZE_MS = 320;
const RESIZE_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * createPanels({ container, titleEl, subEl, onChange })
 * → { show(panelOrName, { focus }), current() }
 * focus: an element, 'first' (first field, default) or false.
 */
export function createPanels({ container, titleEl, subEl, onChange } = {}) {
  let current = container.querySelector('.panel:not([hidden])');
  let pending = null; // a swap waiting for the leave fade

  function resolve(panel) {
    return typeof panel === 'string' ? document.getElementById(`panel-${panel}`) : panel;
  }

  function setHeading(panel) {
    if (titleEl && panel.dataset.title) titleEl.textContent = panel.dataset.title;
    if (subEl && panel.dataset.sub !== undefined) subEl.textContent = panel.dataset.sub;
  }

  function focusIn(panel, focus) {
    if (focus === false) return;
    const target = focus && focus !== 'first'
      ? focus
      : panel.querySelector('input:not([type=checkbox]):not([tabindex="-1"]), h2[tabindex="-1"]');
    if (target) target.focus({ preventScroll: true });
  }

  function animateHeight(fromHeight) {
    const toHeight = container.getBoundingClientRect().height;
    if (Math.abs(toHeight - fromHeight) < 2 || typeof container.animate !== 'function') return;
    container.classList.add('is-resizing');
    const animation = container.animate(
      [{ height: `${fromHeight}px` }, { height: `${toHeight}px` }],
      { duration: RESIZE_MS, easing: RESIZE_EASING }
    );
    const done = () => container.classList.remove('is-resizing');
    animation.onfinish = done;
    animation.oncancel = done;
  }

  function show(panel, { focus = 'first' } = {}) {
    const next = resolve(panel);
    if (pending) pending(true); // finish an unfinished switch first
    if (!next || next === current) return;

    const from = current;
    current = next;
    const instant = prefersReducedMotion();
    const startHeight = container.getBoundingClientRect().height;
    from.classList.add('is-leaving');

    let timer = 0;
    const swap = (skipAnimation = false) => {
      window.clearTimeout(timer);
      pending = null;
      from.hidden = true;
      from.classList.remove('is-leaving', 'is-visible');
      next.hidden = false;
      setHeading(next);
      if (!instant && !skipAnimation) animateHeight(startHeight);
      void next.offsetWidth; // start the fade-in from the hidden state
      next.classList.add('is-visible');
      focusIn(next, focus);
      if (onChange) onChange(next);
    };

    if (instant) swap();
    else {
      pending = swap;
      timer = window.setTimeout(swap, LEAVE_MS);
    }
  }

  return { show, current: () => current };
}
