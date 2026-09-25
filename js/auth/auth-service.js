/* =========================================================
   auth-service — the ONLY auth API the UI uses.
   ---------------------------------------------------------
   UI code (ui/*, pages/*) imports this file and never a
   provider directly. The provider is picked by AUTH_PROVIDER
   in config.js and loaded on first use:
     'auto'     → Supabase if its URL + anon key are filled in,
                  otherwise the demo provider
     'demo' | 'supabase' | 'firebase' → that provider

   Every method returns: { ok: boolean, user?: User, error?: { code, message } }
   getSession()          → { user } | null
   onAuthChange()        → unsubscribe()
   handleAuthRedirect()  → { ok, type: 'recovery' | 'signup' | null, error? }
                           (reads a link from an auth email, if any)

   User shape (provider-independent):
   { id, email, fullName, avatarUrl, emailConfirmed, createdAt }
   ========================================================= */

import { AUTH_PROVIDER, SUPABASE_CONFIG } from '../config.js';
import { failure, ERROR_CODES } from './errors.js';

const PROVIDERS = {
  demo: () => import('./demo-provider.js'),
  supabase: () => import('./supabase-provider.js'),
  firebase: () => import('./firebase-provider.js'),
};

/** True when both public Supabase values are filled in. */
export function isSupabaseConfigured(config = SUPABASE_CONFIG) {
  return Boolean(config && String(config.url || '').trim() && String(config.anonKey || '').trim());
}

/** Turn the AUTH_PROVIDER setting into a concrete provider name. */
export function resolveProviderName(setting = AUTH_PROVIDER, config = SUPABASE_CONFIG) {
  if (setting === 'auto') return isSupabaseConfigured(config) ? 'supabase' : 'demo';
  return setting;
}

export const providerName = resolveProviderName();
export const isDemo = providerName === 'demo';

let providerPromise = null;

function loadProvider() {
  if (!providerPromise) {
    const load = PROVIDERS[providerName];
    providerPromise = load
      ? load().then((module) => module.default)
      : Promise.reject(new Error(`Unknown AUTH_PROVIDER "${AUTH_PROVIDER}"`));
  }
  return providerPromise;
}

/** Call a provider method; an unexpected throw becomes a clean error result. */
async function call(method, ...args) {
  let provider;
  try {
    provider = await loadProvider();
  } catch (error) {
    // The provider script itself could not load (offline, CDN blocked)
    return failure(navigator.onLine === false ? ERROR_CODES.NETWORK : ERROR_CODES.NOT_CONFIGURED);
  }
  try {
    return await provider[method](...args);
  } catch (error) {
    return failure(ERROR_CODES.UNKNOWN);
  }
}

export const signIn = ({ email, password, remember = false }) => call('signIn', { email, password, remember });
export const signUp = ({ fullName, email, password }) => call('signUp', { fullName, email, password });
export const signOut = () => call('signOut');
export const requestPasswordReset = (email) => call('requestPasswordReset', email);
export const updatePassword = (newPassword) => call('updatePassword', newPassword);
export const resendConfirmation = (email) => call('resendConfirmation', email);
export const signInWithOAuth = (provider) => call('signInWithOAuth', provider);
export const getProfile = () => call('getProfile');
export const updateProfile = ({ fullName }) => call('updateProfile', { fullName });
export const handleAuthRedirect = () => call('handleAuthRedirect');

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
 * Events: SIGNED_IN, SIGNED_OUT, PASSWORD_RECOVERY, USER_UPDATED, TOKEN_REFRESHED.
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
export { ERROR_CODES } from './errors.js';
