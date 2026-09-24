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

/** Toggle a submit button's busy state; the label swaps without layout shift. */
export function setLoading(button, isLoading, { idle, busy }) {
  button.setAttribute('aria-busy', String(isLoading));
  button.querySelector('.btn__label').textContent = isLoading ? busy : idle;
}
