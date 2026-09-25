/* =========================================================
   Dashboard — the protected page.
   ---------------------------------------------------------
   1. The body starts as .is-guarding (private content hidden).
   2. The session is checked before anything is shown;
      no session → back to index.html.
   3. Profile name can be edited (Supabase: profiles table,
      protected by Row Level Security).
   4. Sign out here — or in any other tab — turns the lamp
      off and returns to sign in.
   ========================================================= */

import * as auth from '../auth/auth-service.js';
import { validateFullName } from '../validation.js';
import { setMessage, setFieldError, clearErrorsOnInput, applyFieldErrors, setLoading, announce } from '../ui/feedback.js';
import { navigate } from '../ui/transitions.js';
import { initAppShell } from '../ui/app-shell.js';

const { ERROR_CODES } = auth;
const SIGN_OUT_FADE_MS = 450;

const $ = (id) => document.getElementById(id);
const state = { user: null, leaving: false, saving: false };

function formatDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function render(user) {
  state.user = user;
  const name = user.fullName || user.email.split('@')[0] || 'there';
  $('welcome-name').textContent = name;
  $('detail-email').textContent = user.email || '—';
  $('detail-created').textContent = formatDate(user.createdAt);
  const confirmed = $('detail-confirmed');
  confirmed.textContent = user.emailConfirmed ? 'Confirmed' : 'Not confirmed yet';
  confirmed.className = user.emailConfirmed ? 'is-ok' : 'is-warn';
  const input = $('profile-name');
  if (document.activeElement !== input) input.value = user.fullName || '';
}

/** Leave for the sign-in page (no session, or signed out). */
function leave(query = '') {
  if (state.leaving) return;
  state.leaving = true;
  document.body.classList.add('is-signing-out');
  document.body.classList.remove('is-lit');
  window.setTimeout(() => navigate(`index.html${query}`, { replace: true }), query ? SIGN_OUT_FADE_MS : 0);
}

async function guard() {
  const session = await auth.getSession();
  if (!session) {
    leave();
    return false;
  }
  return session;
}

async function init() {
  initAppShell();

  // A confirmation link from the sign-up email lands here
  const link = await auth.handleAuthRedirect();
  if (!link.ok) {
    navigate('index.html?link=expired', { replace: true });
    return;
  }

  const session = await guard();
  if (!session) return;

  render(session.user);
  document.body.classList.remove('is-guarding');
  document.body.classList.add('is-lit', 'is-authed');
  if (link.type === 'signup') {
    setMessage($('dash-message'), 'Email confirmed. Your account is ready.', 'is-success');
    announce('Email confirmed. Signed in. Light on.');
  } else {
    announce(`Signed in as ${session.user.fullName || session.user.email}. Light on.`);
  }

  bindEvents();

  const profile = await auth.getProfile();
  if (profile.ok) render(profile.user);
  else if (profile.error.code === ERROR_CODES.SESSION_MISSING) leave('?signedout=1');
  else setMessage($('profile-message'), 'Couldn’t load your profile. Showing your account details instead.', 'is-info');
}

function bindEvents() {
  $('signout-btn').addEventListener('click', handleSignOut);
  $('profile-form').addEventListener('submit', handleSave);
  clearErrorsOnInput([$('profile-name')], $('profile-message'));

  // Signed out in another tab (or the session ended) → follow along
  auth.onAuthChange((event, session) => {
    if (event === 'SIGNED_OUT' || (!session && event !== 'PASSWORD_RECOVERY')) {
      announce('Signed out. Light off.');
      leave('?signedout=1');
    } else if (session && (event === 'USER_UPDATED' || event === 'SIGNED_IN')) {
      // The profile row is the source of truth for the name
      render({ ...session.user, fullName: state.user.fullName || session.user.fullName, createdAt: state.user.createdAt });
    }
  });

  // Back button after signing out: the page may come back from the cache
  window.addEventListener('pageshow', async (event) => {
    if (!event.persisted) return;
    state.leaving = false;
    document.body.classList.remove('is-signing-out');
    if (!(await auth.getSession())) {
      document.body.classList.add('is-guarding');
      leave();
    }
  });
}

async function handleSignOut() {
  if (state.leaving) return;
  const button = $('signout-btn');
  button.disabled = true;
  await auth.signOut();
  announce('Signed out. Light off.');
  leave('?signedout=1');
}

async function handleSave(event) {
  event.preventDefault();
  if (state.saving || state.leaving) return;

  const input = $('profile-name');
  const message = $('profile-message');
  const fullName = input.value.trim();
  setMessage(message, '');

  const check = validateFullName(fullName);
  if (applyFieldErrors({ fullName: input }, check.errors)) {
    setMessage(message, check.message, 'is-error');
    input.focus();
    return;
  }
  if (fullName === (state.user.fullName || '')) {
    setMessage(message, 'No changes to save.', 'is-info');
    return;
  }

  state.saving = true;
  const labels = { idle: 'Save changes', busy: 'Saving…' };
  setLoading($('profile-submit'), true, labels);
  const result = await auth.updateProfile({ fullName });
  setLoading($('profile-submit'), false, labels);
  state.saving = false;

  if (!result.ok) {
    if (result.error.code === ERROR_CODES.SESSION_MISSING) {
      leave('?signedout=1');
      return;
    }
    setMessage(message, result.error.message, 'is-error');
    setFieldError(input, 'Not saved.');
    return;
  }
  render(result.user);
  setMessage(message, 'Saved. Your name is updated.', 'is-success');
}

init();
