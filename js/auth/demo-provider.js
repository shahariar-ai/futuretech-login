/* =========================================================
   DEMO PROVIDER — NO REAL AUTHENTICATION
   ---------------------------------------------------------
   Any non-empty identifier and password "sign in". Nothing
   is checked, stored or sent anywhere. The session lives in
   memory only and disappears on reload. The UI shows a
   "Demo mode" badge whenever this provider is active.
   ========================================================= */

import { success, failure, ERROR_CODES } from './errors.js';

const LATENCY_MS = 750; // simulated round trip so the UI reads as a real request

let currentUser = null;
const listeners = new Set();

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

function emit(event) {
  const session = currentUser ? { user: currentUser } : null;
  listeners.forEach((listener) => listener(event, session));
}

function makeUser(identifier, fullName) {
  return {
    id: 'demo-user',
    email: identifier.includes('@') ? identifier : '',
    fullName: fullName || identifier,
    avatarUrl: null,
    emailConfirmed: true,
    createdAt: new Date().toISOString(),
  };
}

const demoProvider = {
  async signIn({ email, password }) {
    await wait(LATENCY_MS);
    const identifier = String(email || '').trim();
    if (!identifier || !password) return failure(ERROR_CODES.INVALID_CREDENTIALS);
    currentUser = makeUser(identifier);
    emit('SIGNED_IN');
    return success(currentUser);
  },

  async signUp({ fullName, email, password }) {
    await wait(LATENCY_MS);
    if (!email || !password) return failure(ERROR_CODES.UNKNOWN);
    return success(makeUser(String(email).trim(), fullName));
  },

  async signOut() {
    currentUser = null;
    emit('SIGNED_OUT');
    return success();
  },

  async requestPasswordReset() {
    await wait(LATENCY_MS);
    return success();
  },

  async updatePassword() {
    await wait(LATENCY_MS);
    return success(currentUser);
  },

  async resendConfirmation() {
    await wait(LATENCY_MS);
    return success();
  },

  async signInWithOAuth() {
    return failure(ERROR_CODES.NOT_CONFIGURED);
  },

  async getSession() {
    return currentUser ? { user: currentUser } : null;
  },

  onAuthChange(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },
};

export default demoProvider;
