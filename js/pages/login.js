/* =========================================================
   Sign-in page controller.
   Talks to auth-service only; results drive the lamp and
   the body classes (is-peeking / is-lit / is-authed).
   ========================================================= */

import * as auth from '../auth/auth-service.js';
import { validateSignIn } from '../validation.js';
import { initLamp, setPeeking, turnLampOn, turnLampOff, createParticles } from '../ui/lamp.js';
import { setMessage, shake, initShake, setFieldError, clearFieldError, setLoading } from '../ui/feedback.js';
import { swapPanel, showPanelNow } from '../ui/panels.js';

const REMEMBER_KEY = 'futuretech-demo-username'; // stores the username only, never the password

const INFO_MESSAGES = {
  forgot: 'Password recovery isn’t part of this demo. A real version would email you a reset link.',
  create: 'Account creation isn’t part of this demo. Any username and password will sign you in.',
};

const SUBMIT_LABELS = { idle: 'Sign in', busy: 'Signing in…' };

const state = { busy: false, authed: false };
const dom = {};

function init() {
  dom.body = document.body;
  dom.card = document.getElementById('card');
  dom.form = document.getElementById('login-form');
  dom.username = document.getElementById('username');
  dom.password = document.getElementById('password');
  dom.remember = document.getElementById('remember');
  dom.togglePass = document.getElementById('toggle-pass');
  dom.submit = document.getElementById('submit-btn');
  dom.message = document.getElementById('form-message');
  dom.lock = document.getElementById('lock');
  dom.success = document.getElementById('success');
  dom.successTitle = document.getElementById('success-title');
  dom.successName = document.getElementById('success-name');
  dom.cardTitle = document.getElementById('card-title');
  dom.cardSub = document.getElementById('card-sub');
  dom.signOut = document.getElementById('signout-btn');
  dom.demoBadge = document.getElementById('demo-badge');

  dom.demoBadge.hidden = !auth.isDemo;

  initLamp({ cord: document.getElementById('lamp-cord') });
  initShake(dom.card);
  bindEvents();
  restoreRememberedUser();
  createParticles(document.getElementById('particles'));
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
    input.addEventListener('input', () => {
      if (clearFieldError(input) && dom.message.classList.contains('is-error')) setMessage(dom.message, '');
    });
  });

  document.querySelectorAll('[data-info]').forEach((button) => {
    button.addEventListener('click', () => setMessage(dom.message, INFO_MESSAGES[button.dataset.info], 'is-info'));
  });

  dom.signOut.addEventListener('click', handleSignOut);
}

/* ---------- Sign in ---------- */
async function handleSubmit(event) {
  event.preventDefault();
  if (state.busy || state.authed) return;

  setMessage(dom.message, '');
  const identifier = dom.username.value.trim();
  const password = dom.password.value;
  const result = validateSignIn({ identifier, password });

  applyFieldError(dom.username, result.errors.identifier);
  applyFieldError(dom.password, result.errors.password);

  if (!result.valid) {
    showError(result.message);
    (result.errors.identifier ? dom.username : dom.password).focus();
    return;
  }

  setBusy(true);
  // Phase 4 switches this field to a real email address
  const response = await auth.signIn({ email: identifier, password, remember: dom.remember.checked });
  setBusy(false);

  if (!response.ok) {
    showError(response.error.message);
    return;
  }

  saveRememberedUser(identifier);
  turnLampOn();
  showSuccess(response.user.fullName);
}

function applyFieldError(input, text) {
  if (text) setFieldError(input, text);
  else clearFieldError(input);
}

function setBusy(isBusy) {
  state.busy = isBusy;
  setLoading(dom.submit, isBusy, SUBMIT_LABELS);
}

function showError(text) {
  setMessage(dom.message, text, 'is-error');
  shake(dom.card);
}

function showSuccess(name) {
  state.authed = true;
  dom.body.classList.add('is-authed');
  dom.lock.setAttribute('aria-label', 'Unlocked');
  dom.successName.textContent = name;
  setHeading('Signed in', 'The light is on.');
  swapPanel(dom.form, dom.success, { focusEl: dom.successTitle });
}

function setHeading(title, subtitle) {
  dom.cardTitle.textContent = title;
  dom.cardSub.textContent = subtitle;
}

/* ---------- Sign out: back to the signed-out state, lamp off ---------- */
async function handleSignOut() {
  await auth.signOut();
  state.authed = false;
  dom.body.classList.remove('is-authed');
  dom.lock.setAttribute('aria-label', 'Locked');
  turnLampOff();
  setHeading('Sign in', 'Switch on the light to enter the lab.');

  showPanelNow(dom.success, dom.form);

  dom.password.value = '';
  if (dom.password.type === 'text') togglePassword();
  if (!dom.remember.checked) dom.username.value = '';
  setMessage(dom.message, 'Signed out.', 'is-info');

  (dom.username.value ? dom.password : dom.username).focus();
}

/* ---------- Password visibility ---------- */
function togglePassword() {
  const show = dom.password.type === 'password';
  dom.password.type = show ? 'text' : 'password';
  dom.togglePass.setAttribute('aria-pressed', String(show));
  dom.togglePass.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
}

/* ---------- Remember me: the USERNAME only, never the password ---------- */
function saveRememberedUser(identifier) {
  try {
    if (dom.remember.checked) localStorage.setItem(REMEMBER_KEY, identifier);
    else localStorage.removeItem(REMEMBER_KEY);
  } catch (error) {
    // Storage can be blocked (private mode); sign-in still works
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

init();
