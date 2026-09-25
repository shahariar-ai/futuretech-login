/* =========================================================
   Sign-in page controller: three panels in one card
   (sign in, create account, forgot password) plus the
   "check your inbox" and "signed in" views.
   Talks to auth-service only; results drive the lamp and
   the body classes (is-peeking / is-lit / is-authed).
   ========================================================= */

import * as auth from '../auth/auth-service.js';
import { validateSignIn, validateSignUp, validateEmailOnly } from '../validation.js';
import { initLamp, setPeeking, setGlow, turnLampOn, flickerOut } from '../ui/lamp.js';
import {
  setMessage, shake, initShake, setFieldError, setLoading, announce, setDemoLink,
  initPasswordToggles, hideAllPasswords, startCooldown, clearErrorsOnInput, applyFieldErrors,
} from '../ui/feedback.js';
import { createPanels } from '../ui/panels.js';
import { bindStrengthMeter } from '../ui/strength.js';
import { navigate } from '../ui/transitions.js';
import { initAppShell } from '../ui/app-shell.js';

const { ERROR_CODES } = auth;
const REDIRECT_DELAY_MS = 1500;
const RESEND_COOLDOWN_S = 60;
const LEGACY_USERNAME_KEY = 'futuretech-demo-username'; // Phase 1 stored a username; no longer used

const $ = (id) => document.getElementById(id);
const state = { busy: false, leaving: false, pendingEmail: '' };
let panels;
let card;

async function init() {
  card = $('card');
  initAppShell();
  initLamp({ cord: $('lamp-cord'), onChange: (isOn) => announce(isOn ? 'Light on' : 'Light off') });
  initShake(card);
  initPasswordToggles(card);
  bindStrengthMeter($('signup-password'), $('signup-strength'));
  $('demo-tips').hidden = !auth.isDemo;

  panels = createPanels({
    container: $('panels'),
    titleEl: $('card-title'),
    subEl: $('card-sub'),
    onChange: onPanelChange,
  });

  bindEvents();
  forgetLegacyUsername();
  showSignedOutNote();
  openPanelFromHash({ focus: false });

  // Session guard: already signed in → straight to the dashboard
  const session = await auth.getSession();
  if (session && !state.leaving) {
    state.leaving = true;
    navigate('dashboard.html', { replace: true });
  }
}

function bindEvents() {
  $('panel-signin').addEventListener('submit', handleSignIn);
  $('panel-signup').addEventListener('submit', handleSignUp);
  $('panel-forgot').addEventListener('submit', handleForgot);
  $('signin-resend-btn').addEventListener('click', () => resend($('signin-resend-btn'), $('signin-message'), $('signin-demo-link')));
  $('check-resend-btn').addEventListener('click', () => resend($('check-resend-btn'), $('check-message'), $('check-demo-link')));

  document.querySelectorAll('[data-go]').forEach((button) => {
    button.addEventListener('click', () => goTo(button.dataset.go));
  });
  window.addEventListener('hashchange', () => openPanelFromHash());

  // The lamp leans toward the form while a password field is focused
  card.querySelectorAll('input[type=password]').forEach((input) => {
    input.addEventListener('focus', () => setPeeking(true));
    input.addEventListener('blur', () => setPeeking(false));
  });

  clearErrorsOnInput([$('signin-email'), $('signin-password')], $('signin-message'));
  clearErrorsOnInput([$('signup-name'), $('signup-email'), $('signup-password'), $('signup-confirm')], $('signup-message'));
  clearErrorsOnInput([$('forgot-email')], $('forgot-message'));
}

/* ---------- Panel navigation ---------- */
const HASH_TO_PANEL = { '#signup': 'signup', '#create': 'signup', '#forgot': 'forgot' };

function goTo(name) {
  if (state.leaving) return;
  // Carry the email over, so it never has to be typed twice
  const email = [$('signin-email'), $('signup-email'), $('forgot-email')].map((i) => i.value.trim()).find(Boolean)
    || state.pendingEmail;
  const target = { signin: 'signin-email', signup: 'signup-email', forgot: 'forgot-email' }[name];
  if (target && email && !$(target).value) $(target).value = email;
  panels.show(name);
}

function openPanelFromHash({ focus = 'first' } = {}) {
  if (state.leaving) return;
  const name = HASH_TO_PANEL[window.location.hash] || 'signin';
  const current = panels.current().id.replace('panel-', '');
  if (current === name || (name === 'signin' && current !== 'signup' && current !== 'forgot')) return;
  panels.show(name, { focus });
}

function onPanelChange(panel) {
  const name = panel.id.replace('panel-', '');
  hideAllPasswords(card);
  setPeeking(false);
  if (name !== 'check') setGlow(false);

  const hash = { signup: '#signup', forgot: '#forgot' }[name] || '';
  if (window.location.hash !== hash) {
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search + hash);
  }
}

/* ---------- Sign in ---------- */
async function handleSignIn(event) {
  event.preventDefault();
  if (state.busy || state.leaving) return;

  const emailInput = $('signin-email');
  const passwordInput = $('signin-password');
  const message = $('signin-message');
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  $('signin-resend').hidden = true;
  setDemoLink($('signin-demo-link'), null);
  setMessage(message, '');

  const check = validateSignIn({ email, password });
  const firstInvalid = applyFieldErrors({ email: emailInput, password: passwordInput }, check.errors);
  if (!check.valid) {
    showError(message, check.message);
    firstInvalid.focus();
    return;
  }

  const result = await busy($('signin-submit'), 'Signing in…', () =>
    auth.signIn({ email, password, remember: $('remember').checked }));

  if (!result.ok) {
    flickerOut();
    const { code, message: text } = result.error;
    if (code === ERROR_CODES.EMAIL_NOT_CONFIRMED) {
      setMessage(message, text, 'is-error');
      state.pendingEmail = email;
      $('signin-resend').hidden = false;
      return;
    }
    showError(message, text, code === ERROR_CODES.INVALID_CREDENTIALS);
    if (code === ERROR_CODES.INVALID_EMAIL) setFieldError(emailInput, text);
    return;
  }

  passwordInput.value = '';
  signedIn(result.user);
}

function signedIn(user) {
  state.leaving = true;
  const name = user.fullName || user.email;
  turnLampOn();
  document.body.classList.add('is-authed');
  $('lock').setAttribute('aria-label', 'Unlocked');
  $('success-name').textContent = name;
  announce(`Signed in as ${name}. Light on.`);
  panels.show('success', { focus: $('success-title') });
  window.setTimeout(() => navigate('dashboard.html'), REDIRECT_DELAY_MS);
}

/* ---------- Create account ---------- */
async function handleSignUp(event) {
  event.preventDefault();
  if (state.busy || state.leaving) return;

  const fields = {
    fullName: $('signup-name'),
    email: $('signup-email'),
    password: $('signup-password'),
    confirm: $('signup-confirm'),
  };
  const values = {
    fullName: fields.fullName.value.trim(),
    email: fields.email.value.trim(),
    password: fields.password.value,
    confirm: fields.confirm.value,
  };
  const message = $('signup-message');
  setMessage(message, '');

  const check = validateSignUp(values);
  const firstInvalid = applyFieldErrors(fields, check.errors);
  if (!check.valid) {
    showError(message, check.message);
    firstInvalid.focus();
    return;
  }

  const result = await busy($('signup-submit'), 'Creating account…', () =>
    auth.signUp({ fullName: values.fullName, email: values.email, password: values.password }));

  if (!result.ok) {
    const { code, message: text } = result.error;
    showError(message, text);
    if (code === ERROR_CODES.WEAK_PASSWORD) setFieldError(fields.password, text);
    if (code === ERROR_CODES.INVALID_EMAIL) setFieldError(fields.email, text);
    return;
  }

  fields.password.value = '';
  fields.confirm.value = '';
  fields.password.dispatchEvent(new Event('input')); // reset the strength meter

  // Email confirmation switched off in the provider: already signed in
  if (result.needsConfirmation === false) {
    signedIn(result.user);
    return;
  }

  state.pendingEmail = values.email;
  $('check-address').textContent = values.email;
  setMessage($('check-message'), '');
  setDemoLink($('check-demo-link'), result.demoLink);
  setGlow(true);
  announce('Account created. Check your inbox to confirm your email.');
  panels.show('check', { focus: $('check-title') });
}

/* ---------- Resend the confirmation email ---------- */
async function resend(button, message, demoLinkEl) {
  if (!state.pendingEmail || button.disabled) return;
  button.disabled = true;
  const result = await auth.resendConfirmation(state.pendingEmail);
  if (!result.ok) {
    button.disabled = false;
    setMessage(message, result.error.message, 'is-error');
    return;
  }
  setMessage(message, 'Confirmation email sent. Check your inbox and spam folder.', 'is-success');
  setDemoLink(demoLinkEl, result.demoLink);
  startCooldown(button, RESEND_COOLDOWN_S, 'Resend email');
}

/* ---------- Forgot password ---------- */
async function handleForgot(event) {
  event.preventDefault();
  if (state.busy || state.leaving) return;

  const emailInput = $('forgot-email');
  const message = $('forgot-message');
  const email = emailInput.value.trim();
  setMessage(message, '');
  setDemoLink($('forgot-demo-link'), null);

  const check = validateEmailOnly(email);
  if (applyFieldErrors({ email: emailInput }, check.errors)) {
    showError(message, check.message);
    emailInput.focus();
    return;
  }

  const result = await busy($('forgot-submit'), 'Sending…', () => auth.requestPasswordReset(email));
  if (!result.ok) {
    showError(message, result.error.message);
    return;
  }
  // Same answer whether or not the account exists
  setMessage(message, 'If an account exists for this email, a reset link is on its way.', 'is-info');
  setDemoLink($('forgot-demo-link'), result.demoLink);
}

/* ---------- Shared helpers ---------- */
async function busy(button, busyLabel, action) {
  state.busy = true;
  const idle = button.querySelector('.btn__label').textContent;
  setLoading(button, true, { idle, busy: busyLabel });
  try {
    return await action();
  } finally {
    setLoading(button, false, { idle, busy: busyLabel });
    state.busy = false;
  }
}

function showError(messageEl, text, withShake = true) {
  setMessage(messageEl, text, 'is-error');
  if (withShake) shake(card);
}

function showSignedOutNote() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('signedout')) return;
  url.searchParams.delete('signedout');
  window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  setMessage($('signin-message'), 'Signed out. See you soon.', 'is-info');
  announce('Signed out. Light off.');
}

function forgetLegacyUsername() {
  try {
    localStorage.removeItem(LEGACY_USERNAME_KEY);
  } catch (error) {
    // Storage blocked: nothing to clean up
  }
}

init();
