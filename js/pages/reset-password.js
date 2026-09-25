/* =========================================================
   Reset password page (opened from the email link).
   ---------------------------------------------------------
   1. auth-service reads the link (PASSWORD_RECOVERY).
   2. Valid → "Choose a new password" form.
      Expired / invalid / missing → clear message + a way
      back to "Forgot password".
   3. Success → lamp on, "Password updated", and the
      recovery session is closed so the user signs in with
      the new password.
   ========================================================= */

import * as auth from '../auth/auth-service.js';
import { validateNewPassword } from '../validation.js';
import { initLamp, setPeeking, turnLampOn, flickerOut } from '../ui/lamp.js';
import {
  setMessage, shake, initShake, setFieldError, setLoading, announce,
  initPasswordToggles, hideAllPasswords, clearErrorsOnInput, applyFieldErrors,
} from '../ui/feedback.js';
import { createPanels } from '../ui/panels.js';
import { bindStrengthMeter } from '../ui/strength.js';
import { navigate } from '../ui/transitions.js';
import { initAppShell } from '../ui/app-shell.js';

const { ERROR_CODES } = auth;
// Lets a reload of this page keep the form while the recovery session lasts
const RECOVERY_FLAG = 'futuretech-recovery';

const $ = (id) => document.getElementById(id);
const state = { busy: false, formShown: false, done: false };
let panels;
let card;

function flag(value) {
  try {
    if (value === undefined) return sessionStorage.getItem(RECOVERY_FLAG) === '1';
    if (value) sessionStorage.setItem(RECOVERY_FLAG, '1');
    else sessionStorage.removeItem(RECOVERY_FLAG);
  } catch (error) {
    // Storage blocked: the link itself still works
  }
  return false;
}

async function init() {
  card = $('card');
  initAppShell();
  initLamp({ cord: $('lamp-cord'), onChange: (isOn) => announce(isOn ? 'Light on' : 'Light off') });
  initShake(card);
  initPasswordToggles(card);
  bindStrengthMeter($('reset-password'), $('reset-strength'));
  panels = createPanels({ container: $('panels'), titleEl: $('card-title'), subEl: $('card-sub') });

  $('panel-new').addEventListener('submit', handleSubmit);
  clearErrorsOnInput([$('reset-password'), $('reset-confirm')], $('reset-message'));
  card.querySelectorAll('input[type=password]').forEach((input) => {
    input.addEventListener('focus', () => setPeeking(true));
    input.addEventListener('blur', () => setPeeking(false));
  });

  // The provider may also report the recovery as an event
  auth.onAuthChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY' && session) showForm(session.user);
  });

  const link = await auth.handleAuthRedirect();
  if (state.formShown || state.done) return;

  if (!link.ok) {
    showInvalid(link.error.code === ERROR_CODES.LINK_EXPIRED ? null : link.error.message);
    return;
  }
  if (link.type === 'recovery') {
    showForm(link.user);
    return;
  }
  if (link.type === 'signup') {
    // A confirmation link that landed here: the account is ready
    navigate('dashboard.html', { replace: true });
    return;
  }

  // No link in the address: allow a reload during an active recovery only
  const session = flag() ? await auth.getSession() : null;
  if (session) showForm(session.user);
  else showInvalid('This page only works from the link in a password reset email. Request a new link to continue.');
}

function showForm(user) {
  if (state.formShown || state.done) return;
  state.formShown = true;
  flag(true);
  $('reset-username').value = (user && user.email) || ''; // helps password managers
  panels.show('new');
  announce('Reset link accepted. Choose a new password.');
}

function showInvalid(text) {
  flag(false);
  if (text) $('invalid-text').textContent = text;
  panels.show('invalid', { focus: $('invalid-title') });
  announce('This reset link is invalid or has expired.');
}

async function handleSubmit(event) {
  event.preventDefault();
  if (state.busy || state.done) return;

  const fields = { password: $('reset-password'), confirm: $('reset-confirm') };
  const message = $('reset-message');
  const values = { password: fields.password.value, confirm: fields.confirm.value };
  setMessage(message, '');

  const check = validateNewPassword(values);
  const firstInvalid = applyFieldErrors(fields, check.errors);
  if (!check.valid) {
    setMessage(message, check.message, 'is-error');
    shake(card);
    firstInvalid.focus();
    return;
  }

  state.busy = true;
  const labels = { idle: 'Update password', busy: 'Updating…' };
  setLoading($('reset-submit'), true, labels);
  const result = await auth.updatePassword(values.password);
  setLoading($('reset-submit'), false, labels);
  state.busy = false;

  if (!result.ok) {
    flickerOut();
    const { code, message: text } = result.error;
    if (code === ERROR_CODES.SESSION_MISSING || code === ERROR_CODES.LINK_EXPIRED) {
      showInvalid('Your reset link has expired. Request a new one to continue.');
      return;
    }
    setMessage(message, text, 'is-error');
    shake(card);
    if (code === ERROR_CODES.WEAK_PASSWORD || code === ERROR_CODES.SAME_PASSWORD) {
      setFieldError(fields.password, text);
      fields.password.focus();
    }
    return;
  }

  state.done = true;
  flag(false);
  fields.password.value = '';
  fields.confirm.value = '';
  hideAllPasswords(card);
  // Close the one-time recovery session: next time, sign in with the new password
  await auth.signOut();

  turnLampOn();
  document.body.classList.add('is-authed');
  $('lock').setAttribute('aria-label', 'Unlocked');
  announce('Password updated. Light on.');
  panels.show('done', { focus: $('done-title') });
}

init();
