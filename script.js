/* =========================================================
   FutureTech.ai — Interactive Login (frontend demo)
   ---------------------------------------------------------
   IMPORTANT: there is no real authentication here. Any
   non-empty username and password "sign in". The password
   is never stored or sent anywhere.
   ========================================================= */
'use strict';

/* ---------- App state and cached elements ---------- */
const state = {
  lampOn: false,
  authed: false,
  busy: false,
};

const dom = {};

const REMEMBER_KEY = 'futuretech-demo-username';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const INFO_MESSAGES = {
  forgot: 'Password recovery isn\u2019t part of this demo. A real version would email you a reset link.',
  create: 'Account creation isn\u2019t part of this demo. Any username and password will sign you in.',
};

/* =========================================================
   Setup
   ========================================================= */
function initializeApp() {
  dom.body = document.body;
  dom.card = document.getElementById('card');
  dom.form = document.getElementById('login-form');
  dom.username = document.getElementById('username');
  dom.password = document.getElementById('password');
  dom.remember = document.getElementById('remember');
  dom.togglePass = document.getElementById('toggle-pass');
  dom.submit = document.getElementById('submit-btn');
  dom.submitLabel = dom.submit.querySelector('.btn__label');
  dom.message = document.getElementById('form-message');
  dom.lock = document.getElementById('lock');
  dom.cord = document.getElementById('lamp-cord');
  dom.success = document.getElementById('success');
  dom.successTitle = document.getElementById('success-title');
  dom.cardTitle = document.getElementById('card-title');
  dom.cardSub = document.getElementById('card-sub');
  dom.successName = document.getElementById('success-name');
  dom.signOut = document.getElementById('signout-btn');
  dom.particles = document.getElementById('particles');

  bindEvents();
  restoreRememberedUser();
  createParticles();
}

function bindEvents() {
  // Enter key submits through the native form submit event
  dom.form.addEventListener('submit', handleSubmit);

  // Lamp leans toward the form while the password field is focused
  dom.password.addEventListener('focus', () => setPeeking(true));
  dom.password.addEventListener('blur', () => setPeeking(false));

  dom.togglePass.addEventListener('click', togglePassword);

  // Clear a field's error as soon as the user types into it
  [dom.username, dom.password].forEach((input) => {
    input.addEventListener('input', () => clearFieldError(input));
  });

  // Pull cord works with mouse, touch and keyboard (Enter / Space)
  dom.cord.addEventListener('click', pullCord);
  dom.cord.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      pullCord();
    }
  });

  // "Forgot password?" and "Create account" show an inline note
  document.querySelectorAll('[data-info]').forEach((button) => {
    button.addEventListener('click', () => showInfo(INFO_MESSAGES[button.dataset.info]));
  });

  dom.signOut.addEventListener('click', signOut);

  dom.card.addEventListener('animationend', (event) => {
    if (event.animationName === 'shake') dom.card.classList.remove('is-shaking');
  });
}

/* =========================================================
   Validation
   ========================================================= */

/**
 * Checks both fields are filled in. Marks invalid fields and
 * returns { valid, firstInvalid, message }.
 */
function validateForm() {
  const username = dom.username.value.trim();
  const password = dom.password.value;
  let firstInvalid = null;

  if (!username) {
    setFieldError(dom.username, 'Enter your username.');
    firstInvalid = dom.username;
  } else {
    clearFieldError(dom.username);
  }

  if (!password) {
    setFieldError(dom.password, 'Enter your password.');
    firstInvalid = firstInvalid || dom.password;
  } else {
    clearFieldError(dom.password);
  }

  let message = '';
  if (!username && !password) message = 'Enter your username and password to sign in.';
  else if (!username) message = 'Enter your username to sign in.';
  else if (!password) message = 'Enter your password to sign in.';

  return { valid: !firstInvalid, firstInvalid, message };
}

function setFieldError(input, text) {
  const field = input.closest('.field');
  field.classList.add('has-error');
  input.setAttribute('aria-invalid', 'true');
  document.getElementById(`${input.id}-error`).textContent = text;
}

function clearFieldError(input) {
  const field = input.closest('.field');
  if (!field.classList.contains('has-error')) return;
  field.classList.remove('has-error');
  input.removeAttribute('aria-invalid');
  document.getElementById(`${input.id}-error`).textContent = '';
  if (dom.message.classList.contains('is-error')) setMessage('', '');
}

/* =========================================================
   Form submit flow
   ========================================================= */
function handleSubmit(event) {
  event.preventDefault();
  if (state.busy || state.authed) return;

  setMessage('', '');
  const result = validateForm();

  if (!result.valid) {
    showError(result.message);
    result.firstInvalid.focus();
    return;
  }

  // Short "signing in" pause so the transition reads as a response
  setLoading(true);
  const delay = reducedMotion.matches ? 100 : 750;

  window.setTimeout(() => {
    setLoading(false);
    saveRememberedUser();
    turnLampOn();
    showSuccess(dom.username.value.trim());
  }, delay);
}

function setLoading(isLoading) {
  state.busy = isLoading;
  dom.submit.setAttribute('aria-busy', String(isLoading));
  dom.submitLabel.textContent = isLoading ? 'Signing in\u2026' : 'Sign in';
}

/* =========================================================
   Password visibility
   ========================================================= */
function togglePassword() {
  const show = dom.password.type === 'password';
  dom.password.type = show ? 'text' : 'password';
  dom.togglePass.setAttribute('aria-pressed', String(show));
  dom.togglePass.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
}

/* =========================================================
   Lamp control
   ========================================================= */
function setPeeking(isPeeking) {
  dom.body.classList.toggle('is-peeking', isPeeking);
}

function turnLampOn() {
  state.lampOn = true;
  dom.body.classList.add('is-lit');
  updateCordLabel();
}

function turnLampOff() {
  state.lampOn = false;
  dom.body.classList.remove('is-lit');
  updateCordLabel();
}

function updateCordLabel() {
  dom.cord.setAttribute('aria-pressed', String(state.lampOn));
  dom.cord.setAttribute(
    'aria-label',
    state.lampOn ? 'Pull the lamp cord to switch the light off' : 'Pull the lamp cord to switch the light on'
  );
}

/** The cord toggles the light for ambience. It never signs anyone in. */
function pullCord() {
  dom.cord.classList.remove('is-pulled');
  // Force reflow so the pull animation restarts on rapid clicks
  void dom.cord.getBoundingClientRect();
  dom.cord.classList.add('is-pulled');
  window.setTimeout(() => dom.cord.classList.remove('is-pulled'), 260);

  if (state.lampOn) turnLampOff();
  else turnLampOn();
}

/* =========================================================
   Feedback: success, error, info
   ========================================================= */
function showSuccess(name) {
  state.authed = true;
  dom.body.classList.add('is-authed');
  dom.lock.setAttribute('aria-label', 'Unlocked');
  dom.successName.textContent = name;
  setHeading('Signed in', 'The light is on.');

  // Fade the form out, then reveal the success panel
  dom.form.classList.add('is-leaving');
  window.setTimeout(() => {
    dom.form.hidden = true;
    dom.form.classList.remove('is-leaving');
    dom.success.hidden = false;
    requestAnimationFrame(() => {
      dom.success.classList.add('is-visible');
      dom.successTitle.focus();
    });
  }, reducedMotion.matches ? 0 : 300);
}

function showError(message) {
  setMessage(message, 'is-error');

  // Restart the shake even if it is already running
  dom.card.classList.remove('is-shaking');
  void dom.card.offsetWidth;
  dom.card.classList.add('is-shaking');
}

function showInfo(message) {
  setMessage(message, 'is-info');
}

function setMessage(text, type) {
  dom.message.classList.remove('is-error', 'is-info');
  if (type) dom.message.classList.add(type);
  dom.message.textContent = text;
}

function setHeading(title, subtitle) {
  dom.cardTitle.textContent = title;
  dom.cardSub.textContent = subtitle;
}

/** Return to the signed-out state, lamp off. */
function signOut() {
  state.authed = false;
  dom.body.classList.remove('is-authed');
  dom.lock.setAttribute('aria-label', 'Locked');
  turnLampOff();
  setHeading('Sign in', 'Switch on the light to enter the lab.');

  dom.success.classList.remove('is-visible');
  dom.success.hidden = true;
  dom.form.hidden = false;

  dom.password.value = '';
  if (dom.password.type === 'text') togglePassword();
  if (!dom.remember.checked) dom.username.value = '';
  setMessage('Signed out.', 'is-info');

  (dom.username.value ? dom.password : dom.username).focus();
}

/* =========================================================
   Remember me — stores the USERNAME only, never the password
   ========================================================= */
function saveRememberedUser() {
  try {
    if (dom.remember.checked) {
      localStorage.setItem(REMEMBER_KEY, dom.username.value.trim());
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
  } catch (error) {
    // Storage can be blocked (private mode, file:// rules); the demo still works
  }
}

function restoreRememberedUser() {
  try {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      dom.username.value = saved;
      dom.remember.checked = true;
    }
  } catch (error) {
    // Ignore: nothing remembered
  }
}

/* =========================================================
   Background particles (skipped for reduced motion)
   ========================================================= */
function createParticles() {
  if (reducedMotion.matches) return;

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

  dom.particles.appendChild(fragment);
}

/* ---------- Start ---------- */
document.addEventListener('DOMContentLoaded', initializeApp);
