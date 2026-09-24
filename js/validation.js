/* =========================================================
   Form validation — UX hints only, NOT security.
   The auth provider enforces the real rules.
   ========================================================= */

/**
 * Checks the sign-in fields are filled in.
 * Returns { valid, errors: { identifier?, password? }, message }.
 */
export function validateSignIn({ identifier, password }) {
  const errors = {};
  if (!identifier) errors.identifier = 'Enter your username.';
  if (!password) errors.password = 'Enter your password.';

  let message = '';
  if (!identifier && !password) message = 'Enter your username and password to sign in.';
  else if (!identifier) message = 'Enter your username to sign in.';
  else if (!password) message = 'Enter your password to sign in.';

  return { valid: !message, errors, message };
}
