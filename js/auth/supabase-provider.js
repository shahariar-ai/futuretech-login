/* =========================================================
   Supabase provider — real accounts (supabase-js v2)
   ---------------------------------------------------------
   Used automatically when SUPABASE_CONFIG in config.js has a
   URL and an anon key (AUTH_PROVIDER = 'auto').

   Security lives in Supabase: passwords are checked on the
   server, and Row Level Security decides which profile rows a
   user can read or change. This file never stores, logs or
   inspects passwords; it only hands them to supabase-js.

   Remember me:
     checked   → session kept in localStorage (survives restarts)
     unchecked → session kept in sessionStorage (ends when the
                 browser closes)
   Only the boolean choice is stored, under REMEMBER_KEY.
   ========================================================= */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.1/+esm';
import { SUPABASE_CONFIG } from '../config.js';
import { success, failure, ERROR_CODES } from './errors.js';

const REMEMBER_KEY = 'futuretech-remember';

/* ---------- Links from auth emails ----------
   Read before the client starts, because the client removes
   the tokens from the address bar once it has used them. */
const redirectParams = readRedirectParams();

function readRedirectParams() {
  const params = {};
  const add = (text) => new URLSearchParams(text).forEach((value, key) => { params[key] = value; });
  add(window.location.search.slice(1));
  add(window.location.hash.slice(1));
  return params;
}

/** Remove auth tokens / errors from the address bar, keep the page. */
function cleanAddressBar() {
  const url = new URL(window.location.href);
  ['error', 'error_code', 'error_description', 'code', 'type'].forEach((key) => url.searchParams.delete(key));
  url.hash = '';
  window.history.replaceState(window.history.state, '', url.pathname + url.search);
}

/* ---------- Session storage that follows "Remember me" ---------- */
function safe(action, fallback = null) {
  try {
    return action();
  } catch (error) {
    return fallback; // storage can be blocked (private mode)
  }
}

function isRemembered() {
  return safe(() => localStorage.getItem(REMEMBER_KEY) === '1', false);
}

function setRemembered(remember) {
  safe(() => localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0'));
}

const rememberStorage = {
  getItem: (key) => safe(() => localStorage.getItem(key)) ?? safe(() => sessionStorage.getItem(key)),
  setItem(key, value) {
    const [keep, drop] = isRemembered() ? [localStorage, sessionStorage] : [sessionStorage, localStorage];
    safe(() => keep.setItem(key, value));
    safe(() => drop.removeItem(key));
  },
  removeItem(key) {
    safe(() => localStorage.removeItem(key));
    safe(() => sessionStorage.removeItem(key));
  },
};

const client = createClient(SUPABASE_CONFIG.url.trim(), SUPABASE_CONFIG.anonKey.trim(), {
  auth: {
    storage: rememberStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Implicit flow: email links work even when opened in another browser
    flowType: 'implicit',
  },
});

/* ---------- Error translation ---------- */
const CODE_MAP = {
  invalid_credentials: ERROR_CODES.INVALID_CREDENTIALS,
  user_not_found: ERROR_CODES.INVALID_CREDENTIALS,
  email_not_confirmed: ERROR_CODES.EMAIL_NOT_CONFIRMED,
  provider_email_needs_verification: ERROR_CODES.EMAIL_NOT_CONFIRMED,
  weak_password: ERROR_CODES.WEAK_PASSWORD,
  same_password: ERROR_CODES.SAME_PASSWORD,
  user_already_exists: ERROR_CODES.EMAIL_IN_USE,
  email_exists: ERROR_CODES.EMAIL_IN_USE,
  email_address_invalid: ERROR_CODES.INVALID_EMAIL,
  otp_expired: ERROR_CODES.LINK_EXPIRED,
  flow_state_expired: ERROR_CODES.LINK_EXPIRED,
  flow_state_not_found: ERROR_CODES.LINK_EXPIRED,
  session_expired: ERROR_CODES.SESSION_MISSING,
  session_not_found: ERROR_CODES.SESSION_MISSING,
  refresh_token_not_found: ERROR_CODES.SESSION_MISSING,
  refresh_token_already_used: ERROR_CODES.SESSION_MISSING,
  reauthentication_needed: ERROR_CODES.SESSION_MISSING,
  over_request_rate_limit: ERROR_CODES.RATE_LIMITED,
  over_email_send_rate_limit: ERROR_CODES.RATE_LIMITED,
  over_sms_send_rate_limit: ERROR_CODES.RATE_LIMITED,
  signup_disabled: ERROR_CODES.NOT_CONFIGURED,
  email_provider_disabled: ERROR_CODES.NOT_CONFIGURED,
  PGRST301: ERROR_CODES.SESSION_MISSING, // PostgREST: JWT expired
  PGRST303: ERROR_CODES.SESSION_MISSING,
};

/** Map any supabase-js / PostgREST error to one of our codes. */
export function toErrorCode(error) {
  if (!error) return ERROR_CODES.UNKNOWN;
  if (navigator.onLine === false) return ERROR_CODES.NETWORK;

  const code = String(error.code || '');
  if (CODE_MAP[code]) return CODE_MAP[code];

  const name = String(error.name || '');
  const status = Number(error.status) || 0;
  const message = String(error.message || '').toLowerCase();

  if (name === 'AuthRetryableFetchError' || name === 'TypeError' || message.includes('failed to fetch')
    || message.includes('networkerror') || message.includes('load failed')) return ERROR_CODES.NETWORK;
  if (status === 429) return ERROR_CODES.RATE_LIMITED;
  if (name === 'AuthSessionMissingError') return ERROR_CODES.SESSION_MISSING;
  if (name === 'AuthWeakPasswordError') return ERROR_CODES.WEAK_PASSWORD;
  if (message.includes('invalid login credentials')) return ERROR_CODES.INVALID_CREDENTIALS;
  if (message.includes('email not confirmed')) return ERROR_CODES.EMAIL_NOT_CONFIRMED;
  return ERROR_CODES.UNKNOWN;
}

const fail = (error) => failure(toErrorCode(error));

/* ---------- Helpers ---------- */
const normaliseEmail = (email) => String(email || '').trim().toLowerCase();

/** Absolute URL of another page next to this one (works on any host / folder). */
const pageUrl = (page) => new URL(page, document.baseURI).href;

/** Supabase user (+ optional profiles row) → our provider-independent User. */
function toUser(user, profile = null) {
  if (!user) return null;
  const meta = user.user_metadata || {};
  return {
    id: user.id,
    email: user.email || '',
    fullName: (profile && profile.full_name) || meta.full_name || meta.name || '',
    avatarUrl: (profile && profile.avatar_url) || meta.avatar_url || null,
    emailConfirmed: Boolean(user.email_confirmed_at || user.confirmed_at),
    createdAt: (profile && profile.created_at) || user.created_at || null,
  };
}

async function currentSession() {
  const { data } = await client.auth.getSession();
  return data ? data.session : null;
}

/* ---------- Provider ---------- */
const supabaseProvider = {
  async signIn({ email, password, remember }) {
    setRemembered(Boolean(remember));
    const { data, error } = await client.auth.signInWithPassword({ email: normaliseEmail(email), password });
    if (error) return fail(error);
    return success(toUser(data.user));
  },

  async signUp({ fullName, email, password }) {
    const { data, error } = await client.auth.signUp({
      email: normaliseEmail(email),
      password,
      options: {
        data: { full_name: String(fullName || '').trim().slice(0, 100) },
        emailRedirectTo: pageUrl('dashboard.html'),
      },
    });
    if (error) return fail(error);
    // With "Confirm email" on, Supabase answers an already-registered email
    // exactly like a new one (no session). We show the same "check your
    // inbox" message either way, so the page never reveals who has an account.
    return success(toUser(data.user) || { email: normaliseEmail(email) }, { needsConfirmation: !data.session });
  },

  async signOut() {
    // 'local' signs out this browser (all its tabs). The session is removed
    // locally even if the server can't be reached.
    await client.auth.signOut({ scope: 'local' });
    return success();
  },

  async requestPasswordReset(email) {
    const { error } = await client.auth.resetPasswordForEmail(normaliseEmail(email), {
      redirectTo: pageUrl('reset-password.html'),
    });
    if (error) {
      const code = toErrorCode(error);
      // Only report problems that say nothing about whether the account exists
      if ([ERROR_CODES.RATE_LIMITED, ERROR_CODES.NETWORK, ERROR_CODES.INVALID_EMAIL].includes(code)) return failure(code);
    }
    return success();
  },

  async updatePassword(newPassword) {
    const { data, error } = await client.auth.updateUser({ password: newPassword });
    if (error) return fail(error);
    return success(toUser(data.user));
  },

  async resendConfirmation(email) {
    const { error } = await client.auth.resend({
      type: 'signup',
      email: normaliseEmail(email),
      options: { emailRedirectTo: pageUrl('dashboard.html') },
    });
    if (error) {
      const code = toErrorCode(error);
      if ([ERROR_CODES.RATE_LIMITED, ERROR_CODES.NETWORK, ERROR_CODES.INVALID_EMAIL].includes(code)) return failure(code);
    }
    return success();
  },

  // Ready for Phase 7 (Google / GitHub). Not shown in the UI yet.
  async signInWithOAuth(provider) {
    if (!['google', 'github'].includes(provider)) return failure(ERROR_CODES.NOT_CONFIGURED);
    const { error } = await client.auth.signInWithOAuth({ provider, options: { redirectTo: pageUrl('dashboard.html') } });
    if (error) return fail(error);
    return success(); // the browser is redirected to the provider
  },

  async getProfile() {
    const session = await currentSession();
    if (!session) return failure(ERROR_CODES.SESSION_MISSING);
    const { data, error } = await client
      .from('profiles')
      .select('full_name, avatar_url, created_at')
      .eq('id', session.user.id)
      .maybeSingle();
    if (error) return fail(error);
    return success(toUser(session.user, data));
  },

  async updateProfile({ fullName }) {
    const session = await currentSession();
    if (!session) return failure(ERROR_CODES.SESSION_MISSING);
    const { data, error } = await client
      .from('profiles')
      .update({ full_name: String(fullName || '').trim().slice(0, 100) })
      .eq('id', session.user.id) // RLS also enforces this on the server
      .select('full_name, avatar_url, created_at')
      .maybeSingle();
    if (error) return fail(error);
    if (!data) return failure(ERROR_CODES.UNKNOWN); // no row was allowed to change
    return success(toUser(session.user, data));
  },

  async handleAuthRedirect() {
    const params = redirectParams;
    if (params.error || params.error_code || params.error_description) {
      cleanAddressBar();
      const code = toErrorCode({ code: params.error_code });
      return failure(code === ERROR_CODES.RATE_LIMITED ? code : ERROR_CODES.LINK_EXPIRED);
    }
    if (!params.access_token) return success(null, { type: null });

    // The client reads the tokens while it starts; wait for that to finish
    const session = await currentSession();
    cleanAddressBar();
    if (!session) return failure(ERROR_CODES.LINK_EXPIRED);
    return success(toUser(session.user), { type: params.type || null });
  },

  async getSession() {
    const session = await currentSession();
    return session ? { user: toUser(session.user) } : null;
  },

  onAuthChange(callback) {
    const { data } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return;
      const mapped = session ? { user: toUser(session.user) } : null;
      // Run outside supabase-js's lock, so the callback may call auth methods
      window.setTimeout(() => callback(event, mapped), 0);
    });
    return () => data.subscription.unsubscribe();
  },
};

export default supabaseProvider;
