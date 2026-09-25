/* =========================================================
   FutureTech.ai — public app configuration
   ---------------------------------------------------------
   Everything in this file is shipped to the browser, so it
   must only ever contain PUBLIC values.

   Safe here (public by design):
     - Supabase Project URL and the anon / publishable key.
       Security comes from Row Level Security in the database.
     - Firebase web config (apiKey, authDomain, projectId…).
       Security comes from Firebase Security Rules.

   NEVER put these here (or anywhere in this repo):
     - Supabase service_role / secret key
     - Firebase Admin SDK credentials
     - OAuth client secrets (Google, GitHub)
     - SMTP passwords or any other password
   Those only belong in the provider dashboards.
   ========================================================= */

/**
 * Which auth provider the app uses: 'auto' | 'demo' | 'supabase' | 'firebase'
 *
 * 'auto' (recommended): Supabase when both SUPABASE_CONFIG values
 * below are filled in, otherwise the demo provider (with a visible
 * "Demo mode" badge). Filling in the two values is all it takes to
 * switch to real accounts.
 */
export const AUTH_PROVIDER = 'auto';

export const SUPABASE_CONFIG = {
  url: '',     // e.g. 'https://abcdefghijkl.supabase.co'
  anonKey: '', // the anon / publishable key (public)
};

export const FIREBASE_CONFIG = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  appId: '',
};
