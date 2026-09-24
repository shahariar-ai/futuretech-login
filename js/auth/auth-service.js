/* =========================================================
   auth-service — the ONLY auth API the UI uses.
   ---------------------------------------------------------
   UI code (ui/*, pages/*) imports this file and never a
   provider directly. The provider is picked by AUTH_PROVIDER
   in config.js and loaded on first use.

   Every method returns: { ok: boolean, user?: User, error?: { code, message } }
   getSession()   → { user } | null
   onAuthChange() → unsubscribe()

   User shape (provider-independent):
   { id, email, fullName, avatarUrl, emailConfirmed, createdAt }
   ========================================================= */

import { AUTH_PROVIDER } from '../config.js';
import { failure, ERROR_CODES } from './errors.js';

const PROVIDERS = {
  demo: () => import('./demo-provider.js'),
  supabase: () => import('./supabase-provider.js'),
  firebase: () => import('./firebase-provider.js'),
};

let providerPromise = null;

function loadProvider() {
  if (!providerPromise) {
    const load = PROVIDERS[AUTH_PROVIDER];
    providerPromise = load
      ? load().then((module) => module.default)
      : Promise.reject(new Error(`Unknown AUTH_PROVIDER "${AUTH_PROVIDER}"`));
  }
  return providerPromise;
}

/** Call a provider method; an unexpected throw becomes a clean error result. */
async function call(method, ...args) {
  try {
    const provider = await loadProvider();
    return await provider[method](...args);
  } catch (error) {
    return failure(ERROR_CODES.UNKNOWN);
  }
}

export const providerName = AUTH_PROVIDER;
export const isDemo = AUTH_PROVIDER === 'demo';

export const signIn = ({ email, password, remember = false }) => call('signIn', { email, password, remember });
export const signUp = ({ fullName, email, password }) => call('signUp', { fullName, email, password });
export const signOut = () => call('signOut');
export const requestPasswordReset = (email) => call('requestPasswordReset', email);
export const updatePassword = (newPassword) => call('updatePassword', newPassword);
export const resendConfirmation = (email) => call('resendConfirmation', email);
export const signInWithOAuth = (provider) => call('signInWithOAuth', provider);

export async function getSession() {
  try {
    const provider = await loadProvider();
    return await provider.getSession();
  } catch (error) {
    return null;
  }
}

/**
 * Subscribe to auth events: callback(event, session).
 * Returns an unsubscribe function that is safe to call at any time.
 */
export function onAuthChange(callback) {
  let unsubscribe = null;
  let cancelled = false;
  loadProvider()
    .then((provider) => {
      if (!cancelled) unsubscribe = provider.onAuthChange(callback);
    })
    .catch(() => {});
  return () => {
    cancelled = true;
    if (unsubscribe) unsubscribe();
  };
}
