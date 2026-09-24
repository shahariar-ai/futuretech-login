/* =========================================================
   Auth error codes and the one message the UI shows for each.
   Providers translate their own errors into these codes, so
   the UI never depends on a specific provider's wording.
   ========================================================= */

export const ERROR_CODES = Object.freeze({
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_NOT_CONFIRMED: 'EMAIL_NOT_CONFIRMED',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  EMAIL_IN_USE: 'EMAIL_IN_USE',
  RATE_LIMITED: 'RATE_LIMITED',
  NETWORK: 'NETWORK',
  NOT_CONFIGURED: 'NOT_CONFIGURED',
  UNKNOWN: 'UNKNOWN',
});

// Sign-in errors stay generic: never reveal whether an email exists.
export const ERROR_MESSAGES = Object.freeze({
  INVALID_CREDENTIALS: 'Email or password is incorrect.',
  EMAIL_NOT_CONFIRMED: 'Confirm your email first. Check your inbox.',
  WEAK_PASSWORD: 'Choose a stronger password: at least 8 characters, with a letter and a number.',
  EMAIL_IN_USE: 'We couldn’t create that account. Try signing in, or reset your password.',
  RATE_LIMITED: 'Too many attempts. Wait a minute and try again.',
  NETWORK: 'Can’t reach the server. Check your connection and try again.',
  NOT_CONFIGURED: 'Sign-in isn’t set up yet. Please try again later.',
  UNKNOWN: 'Something went wrong. Please try again.',
});

/** Build the error object every auth method returns on failure. */
export function authError(code) {
  const known = ERROR_MESSAGES[code] ? code : ERROR_CODES.UNKNOWN;
  return { code: known, message: ERROR_MESSAGES[known] };
}

/** Result builders for the { ok, user?, error? } shape. */
export const success = (user) => (user ? { ok: true, user } : { ok: true });
export const failure = (code) => ({ ok: false, error: authError(code) });
