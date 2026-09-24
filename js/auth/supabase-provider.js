/* =========================================================
   Supabase provider — placeholder
   ---------------------------------------------------------
   The real implementation (supabase-js v2) arrives in
   Phase 4, after the Supabase project exists. Until then
   every method reports NOT_CONFIGURED.
   ========================================================= */

import { failure, ERROR_CODES } from './errors.js';

const notConfigured = async () => failure(ERROR_CODES.NOT_CONFIGURED);

const supabaseProvider = {
  signIn: notConfigured,
  signUp: notConfigured,
  signOut: notConfigured,
  requestPasswordReset: notConfigured,
  updatePassword: notConfigured,
  resendConfirmation: notConfigured,
  signInWithOAuth: notConfigured,
  async getSession() { return null; },
  onAuthChange() { return () => {}; },
};

export default supabaseProvider;
