/* =========================================================
   Form validation — UX hints only, NOT security.
   The auth provider enforces the real rules.
   ========================================================= */

// Deliberately simple: something@something.tld, no spaces
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const PASSWORD_RULES_TEXT = 'At least 8 characters, with a letter and a number.';
export const NAME_MAX = 100;

export function isValidEmail(email) {
  return EMAIL_PATTERN.test(String(email || '').trim());
}

function emailError(email) {
  if (!email) return 'Enter your email address.';
  if (!isValidEmail(email)) return 'Enter a valid email address, like name@example.com.';
  return '';
}

/**
 * Password strength for the live meter.
 * Returns { score: 0-3, level: ''|'weak'|'okay'|'strong', meetsRules }
 * Rules (8+ chars, a letter, a number) → at least "okay".
 */
export function checkPassword(password) {
  const value = String(password || '');
  if (!value) return { score: 0, level: '', meetsRules: false };

  const hasLetter = /\p{L}/u.test(value);
  const hasNumber = /\d/.test(value);
  const meetsRules = value.length >= 8 && hasLetter && hasNumber;
  if (!meetsRules) return { score: 1, level: 'weak', meetsRules };

  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^\p{L}\d]/u].filter((re) => re.test(value)).length;
  const strong = value.length >= 14 || (value.length >= 10 && variety >= 3);
  return strong ? { score: 3, level: 'strong', meetsRules } : { score: 2, level: 'okay', meetsRules };
}

/** Build { valid, errors, message } from a map of field → error text. */
function result(errors, summary) {
  const clean = Object.fromEntries(Object.entries(errors).filter(([, text]) => text));
  const count = Object.keys(clean).length;
  const message = count === 0 ? '' : count === 1 ? Object.values(clean)[0] : summary;
  return { valid: count === 0, errors: clean, message };
}

export function validateSignIn({ email, password }) {
  return result(
    { email: emailError(email), password: password ? '' : 'Enter your password.' },
    'Enter your email and password to sign in.'
  );
}

export function validateSignUp({ fullName, email, password, confirm }) {
  const name = String(fullName || '').trim();
  let passwordError = '';
  if (!password) passwordError = 'Choose a password.';
  else if (!checkPassword(password).meetsRules) passwordError = PASSWORD_RULES_TEXT;

  let confirmError = '';
  if (!confirm) confirmError = 'Type the password again.';
  else if (password && confirm !== password) confirmError = 'The passwords don’t match.';

  return result(
    {
      fullName: !name ? 'Enter your full name.' : name.length > NAME_MAX ? `Keep it under ${NAME_MAX} characters.` : '',
      email: emailError(email),
      password: passwordError,
      confirm: confirmError,
    },
    'Check the highlighted fields.'
  );
}

export function validateEmailOnly(email) {
  return result({ email: emailError(email) }, '');
}

export function validateNewPassword({ password, confirm }) {
  const { errors, valid, message } = validateSignUp({ fullName: 'x', email: 'a@b.cd', password, confirm });
  return { valid, errors, message };
}

export function validateFullName(fullName) {
  const name = String(fullName || '').trim();
  return result(
    { fullName: !name ? 'Enter your full name.' : name.length > NAME_MAX ? `Keep it under ${NAME_MAX} characters.` : '' },
    ''
  );
}
