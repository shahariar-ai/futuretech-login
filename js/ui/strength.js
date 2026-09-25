/* =========================================================
   Password strength meter (weak / okay / strong).
   A UX hint only; the auth provider enforces the real rules.
   ========================================================= */

import { checkPassword, PASSWORD_RULES_TEXT } from '../validation.js';

const TEXT = {
  '': PASSWORD_RULES_TEXT,
  weak: `Weak. ${PASSWORD_RULES_TEXT}`,
  okay: 'Okay. Longer, or with capitals and symbols, is stronger.',
  strong: 'Strong password.',
};

/** Update the meter while the user types. Text only changes with the level. */
export function bindStrengthMeter(input, meter) {
  const text = meter.querySelector('.strength__text');
  const update = () => {
    const { level } = checkPassword(input.value);
    if (meter.dataset.level === level) return;
    meter.dataset.level = level;
    text.textContent = TEXT[level];
  };
  input.addEventListener('input', update);
  update();
  return update;
}
