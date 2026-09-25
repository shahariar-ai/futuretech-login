/* =========================================================
   Feedback — form messages, field errors, card shake and
   the loading state of submit buttons. All user-provided
   text goes in through textContent, never innerHTML.
   ========================================================= */

/** Show a status message. type: 'is-error' | 'is-info' | '' */
export function setMessage(messageEl, text, type = '') {
  messageEl.classList.remove('is-error', 'is-info', 'is-success');
  if (type) messageEl.classList.add(type);
  messageEl.textContent = text;
}

/** Restart the shake even if it is already running. */
export function shake(card) {
  card.classList.remove('is-shaking');
  void card.offsetWidth;
  card.classList.add('is-shaking');
}

/** Remove the shake class when the animation ends, so it can replay. */
export function initShake(card) {
  card.addEventListener('animationend', (event) => {
    if (event.animationName === 'shake') card.classList.remove('is-shaking');
  });
}

function errorElementFor(input) {
  return document.getElementById(`${input.id}-error`);
}

export function setFieldError(input, text) {
  input.closest('.field').classList.add('has-error');
  input.setAttribute('aria-invalid', 'true');
  errorElementFor(input).textContent = text;
}

/** Returns true if the field had an error that is now cleared. */
export function clearFieldError(input) {
  const field = input.closest('.field');
  if (!field.classList.contains('has-error')) return false;
  field.classList.remove('has-error');
  input.removeAttribute('aria-invalid');
  errorElementFor(input).textContent = '';
  return true;
}

let announceTimer = 0;

/**
 * Screen-reader announcement through the page's #sr-status live region.
 * The text is set after a short delay so repeated messages are read again.
 */
export function announce(text) {
  const region = document.getElementById('sr-status');
  if (!region) return;
  window.clearTimeout(announceTimer);
  region.textContent = '';
  announceTimer = window.setTimeout(() => { region.textContent = text; }, 60);
}

/** Toggle a submit button's busy state; the label swaps without layout shift. */
export function setLoading(button, isLoading, { idle, busy }) {
  button.setAttribute('aria-busy', String(isLoading));
  button.querySelector('.btn__label').textContent = isLoading ? busy : idle;
}

/**
 * Show (href) or hide (falsy) a demo-mode "email link" paragraph.
 * The href comes from the demo provider, never from user input.
 */
export function setDemoLink(container, href) {
  if (!container) return;
  const link = container.querySelector('a');
  if (href) link.setAttribute('href', href);
  container.hidden = !href;
}

/** Wire every show/hide password button: <button data-toggle-pass="inputId">. */
export function initPasswordToggles(root = document) {
  root.querySelectorAll('[data-toggle-pass]').forEach((button) => {
    const input = document.getElementById(button.dataset.togglePass);
    button.addEventListener('click', () => setPasswordVisible(button, input, input.type === 'password'));
  });
}

export function setPasswordVisible(button, input, show) {
  input.type = show ? 'text' : 'password';
  button.setAttribute('aria-pressed', String(show));
  button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
}

/** Hide every password again (e.g. before leaving a panel). */
export function hideAllPasswords(root = document) {
  root.querySelectorAll('[data-toggle-pass]').forEach((button) => {
    setPasswordVisible(button, document.getElementById(button.dataset.togglePass), false);
  });
}

/**
 * Disable a button for `seconds`, showing a countdown in its label,
 * then restore it. Used for "Resend email" so people don't hit limits.
 */
export function startCooldown(button, seconds, label) {
  const labelEl = button.querySelector('.btn__label') || button;
  let left = seconds;
  button.disabled = true;
  const tick = () => {
    if (left <= 0) {
      window.clearInterval(timer);
      button.disabled = false;
      labelEl.textContent = label;
      return;
    }
    labelEl.textContent = `${label} (${left}s)`;
    left -= 1;
  };
  const timer = window.setInterval(tick, 1000);
  tick();
}

/** Clear a field's error (and a matching form error) as soon as it is edited. */
export function clearErrorsOnInput(inputs, messageEl) {
  inputs.forEach((input) => {
    input.addEventListener('input', () => {
      if (clearFieldError(input) && messageEl && messageEl.classList.contains('is-error')) setMessage(messageEl, '');
    });
  });
}

/** Apply { fieldKey: text } errors to { fieldKey: input }; returns the first invalid input. */
export function applyFieldErrors(fields, errors) {
  let first = null;
  Object.entries(fields).forEach(([key, input]) => {
    if (errors[key]) {
      setFieldError(input, errors[key]);
      if (!first) first = input;
    } else {
      clearFieldError(input);
    }
  });
  return first;
}
