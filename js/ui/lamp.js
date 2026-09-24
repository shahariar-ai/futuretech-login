/* =========================================================
   Lamp control — drives the body classes the CSS reacts to:
     .is-peeking  lamp leans toward the form
     .is-lit      lamp is on
   Plus the pull cord and the background dust particles.
   ========================================================= */

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let lampOn = false;
let cordEl = null;
let changeListener = null;

export const isLampOn = () => lampOn;
export const prefersReducedMotion = () => reducedMotion.matches;

export function setPeeking(isPeeking) {
  document.body.classList.toggle('is-peeking', isPeeking);
}

export function turnLampOn() {
  setLamp(true);
}

export function turnLampOff() {
  setLamp(false);
}

function setLamp(on) {
  if (lampOn === on) return;
  lampOn = on;
  document.body.classList.toggle('is-lit', on);
  updateCordLabel();
  if (changeListener) changeListener(on);
}

function updateCordLabel() {
  if (!cordEl) return;
  cordEl.setAttribute('aria-pressed', String(lampOn));
  cordEl.setAttribute(
    'aria-label',
    lampOn ? 'Pull the lamp cord to switch the light off' : 'Pull the lamp cord to switch the light on'
  );
}

/** The cord toggles the light for ambience. It never signs anyone in. */
function pullCord() {
  cordEl.classList.remove('is-pulled');
  // Force reflow so the pull animation restarts on rapid clicks
  void cordEl.getBoundingClientRect();
  cordEl.classList.add('is-pulled');
  window.setTimeout(() => cordEl.classList.remove('is-pulled'), 260);

  setLamp(!lampOn);
}

/**
 * Wire up the pull cord (mouse, touch and keyboard).
 * onChange(isOn) is called whenever the light switches.
 */
export function initLamp({ cord, onChange } = {}) {
  cordEl = cord;
  changeListener = onChange || null;
  if (!cordEl) return;

  cordEl.addEventListener('click', pullCord);
  cordEl.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      pullCord();
    }
  });
  updateCordLabel();
}

/** Floating dust particles (skipped for reduced motion). */
export function createParticles(container) {
  if (!container || reducedMotion.matches) return;

  const count = window.innerWidth < 600 ? 16 : 28;
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i += 1) {
    const dot = document.createElement('span');
    dot.className = 'particle';
    dot.style.left = `${Math.random() * 100}%`;
    dot.style.setProperty('--s', `${(Math.random() * 2.5 + 1.5).toFixed(1)}px`);
    dot.style.setProperty('--d', `${(Math.random() * 14 + 14).toFixed(1)}s`);
    dot.style.setProperty('--delay', `${(-Math.random() * 28).toFixed(1)}s`);
    dot.style.setProperty('--x', `${(Math.random() * 80 - 40).toFixed(0)}px`);
    dot.style.setProperty('--o', (Math.random() * 0.45 + 0.25).toFixed(2));
    fragment.appendChild(dot);
  }

  container.appendChild(fragment);
}
