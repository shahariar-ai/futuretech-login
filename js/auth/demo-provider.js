/* =========================================================
   DEMO PROVIDER — NO REAL AUTHENTICATION
   ---------------------------------------------------------
   Used when Supabase isn't configured yet. It lets you click
   through every screen, but nothing is checked and nothing
   leaves the browser. The UI shows a "Demo mode" badge
   whenever this provider is active.

   What it stores (and never more):
     - the signed-in demo user: id, email, name, date
       (localStorage with Remember me, sessionStorage without)
     - the email + name from the last sign-up / reset request,
       so the demo "email link" knows who it is for
   Passwords are never stored, compared or logged.

   Demo test addresses (sign in with any password):
     wrong@demo.test        → "Email or password is incorrect."
     unconfirmed@demo.test  → "Confirm your email first." + Resend
     limited@demo.test      → "Too many attempts."
     offline@demo.test      → "Can't reach the server."
   Instead of sending email, sign-up and reset return a
   `demoLink` the page shows as "Open the demo email link".
   ========================================================= */

import { success, failure, ERROR_CODES } from './errors.js';
import { checkPassword } from '../validation.js';

const LATENCY_MS = 600; // simulated round trip so the UI reads as a real request
const SESSION_KEY = 'futuretech-demo-session';
const PENDING_KEY = 'futuretech-demo-pending';
const CHANNEL_NAME = 'futuretech-demo-auth';

const TEST_ADDRESSES = {
  'wrong@demo.test': ERROR_CODES.INVALID_CREDENTIALS,
  'unconfirmed@demo.test': ERROR_CODES.EMAIL_NOT_CONFIRMED,
  'limited@demo.test': ERROR_CODES.RATE_LIMITED,
  'offline@demo.test': ERROR_CODES.NETWORK,
};

const DEMO_LINKS = {
  confirm: 'dashboard.html#type=signup&demo=1',
  recovery: 'reset-password.html#type=recovery&demo=1',
};

const listeners = new Set();
const channel = 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL_NAME) : null;

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
const normaliseEmail = (email) => String(email || '').trim().toLowerCase();

/* ---------- Storage (blocked storage must never break the demo) ---------- */
function safe(action, fallback = null) {
  try {
    return action();
  } catch (error) {
    return fallback;
  }
}

function readJson(storage, key) {
  return safe(() => JSON.parse(storage.getItem(key) || 'null'));
}

function readSession() {
  return readJson(localStorage, SESSION_KEY) || readJson(sessionStorage, SESSION_KEY);
}

function writeSession(user, remember) {
  const [keep, drop] = remember ? [localStorage, sessionStorage] : [sessionStorage, localStorage];
  safe(() => keep.setItem(SESSION_KEY, JSON.stringify(user)));
  safe(() => drop.removeItem(SESSION_KEY));
}

function isRememberedSession() {
  return safe(() => localStorage.getItem(SESSION_KEY) !== null, false);
}

function clearSession() {
  safe(() => localStorage.removeItem(SESSION_KEY));
  safe(() => sessionStorage.removeItem(SESSION_KEY));
}

function setPending(email, fullName = '') {
  safe(() => localStorage.setItem(PENDING_KEY, JSON.stringify({ email, fullName })));
}

function takePending() {
  const pending = readJson(localStorage, PENDING_KEY);
  safe(() => localStorage.removeItem(PENDING_KEY));
  return pending;
}

/* ---------- Events ---------- */
function emit(event) {
  const user = readSession();
  const session = user ? { user } : null;
  listeners.forEach((listener) => window.setTimeout(() => listener(event, session), 0));
}

// Another tab signed out (or in): tell this tab's listeners too
if (channel) {
  channel.addEventListener('message', (message) => {
    if (message.data === 'SIGNED_OUT') safe(() => sessionStorage.removeItem(SESSION_KEY));
    emit(message.data);
  });
}

function broadcast(event) {
  if (channel) channel.postMessage(event);
}

function makeUser(email, fullName) {
  const name = String(fullName || '').trim().slice(0, 100) || email.split('@')[0];
  return {
    id: `demo-${email}`,
    email,
    fullName: name,
    avatarUrl: null,
    emailConfirmed: true,
    createdAt: new Date().toISOString(),
  };
}

function readRedirectParams() {
  const params = {};
  const add = (text) => new URLSearchParams(text).forEach((value, key) => { params[key] = value; });
  add(window.location.search.slice(1));
  add(window.location.hash.slice(1));
  return params;
}

function cleanAddressBar() {
  window.history.replaceState(window.history.state, '', window.location.pathname);
}

/* ---------- Provider ---------- */
const demoProvider = {
  async signIn({ email, password, remember }) {
    await wait(LATENCY_MS);
    const address = normaliseEmail(email);
    if (!address || !password) return failure(ERROR_CODES.INVALID_CREDENTIALS);
    if (TEST_ADDRESSES[address]) return failure(TEST_ADDRESSES[address]);
    const user = makeUser(address);
    writeSession(user, Boolean(remember));
    emit('SIGNED_IN');
    broadcast('SIGNED_IN');
    return success(user);
  },

  async signUp({ fullName, email, password }) {
    await wait(LATENCY_MS);
    const address = normaliseEmail(email);
    if (!address) return failure(ERROR_CODES.INVALID_EMAIL);
    if (TEST_ADDRESSES[address] && TEST_ADDRESSES[address] !== ERROR_CODES.EMAIL_NOT_CONFIRMED
      && TEST_ADDRESSES[address] !== ERROR_CODES.INVALID_CREDENTIALS) return failure(TEST_ADDRESSES[address]);
    // Mirrors the server-side rule a real provider enforces
    if (!checkPassword(password).meetsRules) return failure(ERROR_CODES.WEAK_PASSWORD);
    setPending(address, fullName);
    return success(makeUser(address, fullName), { needsConfirmation: true, demoLink: DEMO_LINKS.confirm });
  },

  async signOut() {
    clearSession();
    emit('SIGNED_OUT');
    broadcast('SIGNED_OUT');
    return success();
  },

  async requestPasswordReset(email) {
    await wait(LATENCY_MS);
    const address = normaliseEmail(email);
    if (TEST_ADDRESSES[address] === ERROR_CODES.RATE_LIMITED || TEST_ADDRESSES[address] === ERROR_CODES.NETWORK) {
      return failure(TEST_ADDRESSES[address]);
    }
    setPending(address);
    return success(null, { demoLink: DEMO_LINKS.recovery });
  },

  async updatePassword(newPassword) {
    await wait(LATENCY_MS);
    const user = readSession();
    if (!user) return failure(ERROR_CODES.SESSION_MISSING);
    if (!checkPassword(newPassword).meetsRules) return failure(ERROR_CODES.WEAK_PASSWORD);
    return success(user); // nothing to store: the demo has no passwords
  },

  async resendConfirmation(email) {
    await wait(LATENCY_MS);
    const address = normaliseEmail(email);
    if (TEST_ADDRESSES[address] === ERROR_CODES.RATE_LIMITED) return failure(ERROR_CODES.RATE_LIMITED);
    setPending(address);
    return success(null, { demoLink: DEMO_LINKS.confirm });
  },

  async signInWithOAuth() {
    return failure(ERROR_CODES.NOT_CONFIGURED);
  },

  async getProfile() {
    await wait(LATENCY_MS / 3);
    const user = readSession();
    return user ? success(user) : failure(ERROR_CODES.SESSION_MISSING);
  },

  async updateProfile({ fullName }) {
    await wait(LATENCY_MS);
    const user = readSession();
    if (!user) return failure(ERROR_CODES.SESSION_MISSING);
    const updated = { ...user, fullName: String(fullName || '').trim().slice(0, 100) };
    writeSession(updated, isRememberedSession());
    emit('USER_UPDATED');
    return success(updated);
  },

  /** The demo "email links" use the same address format as Supabase links. */
  async handleAuthRedirect() {
    const params = readRedirectParams();
    if (params.error || params.error_code || params.error_description) {
      cleanAddressBar();
      return failure(ERROR_CODES.LINK_EXPIRED);
    }
    if (!params.demo || !['signup', 'recovery'].includes(params.type)) return success(null, { type: null });

    cleanAddressBar();
    const pending = takePending();
    if (!pending || !pending.email) return failure(ERROR_CODES.LINK_EXPIRED);
    const user = makeUser(pending.email, pending.fullName);
    writeSession(user, false);
    emit(params.type === 'recovery' ? 'PASSWORD_RECOVERY' : 'SIGNED_IN');
    return success(user, { type: params.type });
  },

  async getSession() {
    const user = readSession();
    return user ? { user } : null;
  },

  onAuthChange(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },
};

export default demoProvider;
