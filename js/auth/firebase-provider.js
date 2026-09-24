/* =========================================================
   Firebase provider — documented stub, ready to implement
   ---------------------------------------------------------
   To implement:
   1. Fill FIREBASE_CONFIG in config.js (public web config).
   2. Import the modular SDK from the official CDN, e.g.
        import { initializeApp } from 'https://www.gstatic.com/firebasejs/<version>/firebase-app.js';
        import { getAuth, ... } from 'https://www.gstatic.com/firebasejs/<version>/firebase-auth.js';
   3. Replace each method below with the mapping shown, and
      translate Firebase error codes with toErrorCode().
   4. Set AUTH_PROVIDER = 'firebase' in config.js.
   Security comes from Firebase Security Rules, not from
   hiding the config.
   ========================================================= */

import { failure, ERROR_CODES } from './errors.js';

/** Map Firebase Auth error codes to our codes (use when implementing). */
export function toErrorCode(firebaseCode) {
  const map = {
    'auth/invalid-credential': ERROR_CODES.INVALID_CREDENTIALS,
    'auth/wrong-password': ERROR_CODES.INVALID_CREDENTIALS,
    'auth/user-not-found': ERROR_CODES.INVALID_CREDENTIALS,
    'auth/email-already-in-use': ERROR_CODES.EMAIL_IN_USE,
    'auth/weak-password': ERROR_CODES.WEAK_PASSWORD,
    'auth/too-many-requests': ERROR_CODES.RATE_LIMITED,
    'auth/network-request-failed': ERROR_CODES.NETWORK,
  };
  return map[firebaseCode] || ERROR_CODES.UNKNOWN;
}

const notConfigured = async () => failure(ERROR_CODES.NOT_CONFIGURED);

const firebaseProvider = {
  // setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
  // then signInWithEmailAndPassword(auth, email, password).
  // If !user.emailVerified → signOut and return EMAIL_NOT_CONFIRMED.
  signIn: notConfigured,

  // createUserWithEmailAndPassword(auth, email, password)
  // → updateProfile(user, { displayName: fullName }) → sendEmailVerification(user)
  signUp: notConfigured,

  // signOut(auth)
  signOut: notConfigured,

  // sendPasswordResetEmail(auth, email, { url: '<site>/reset-password.html' })
  // Always return success so the UI never reveals whether the email exists.
  requestPasswordReset: notConfigured,

  // From the email link: confirmPasswordReset(auth, oobCode, newPassword)
  // When signed in:      updatePassword(auth.currentUser, newPassword)
  updatePassword: notConfigured,

  // sendEmailVerification(auth.currentUser)
  resendConfirmation: notConfigured,

  // signInWithRedirect(auth, new GoogleAuthProvider() | new GithubAuthProvider())
  signInWithOAuth: notConfigured,

  // await auth.authStateReady(); map auth.currentUser to the User shape:
  // { id: uid, email, fullName: displayName, avatarUrl: photoURL,
  //   emailConfirmed: emailVerified, createdAt: metadata.creationTime }
  async getSession() { return null; },

  // onAuthStateChanged(auth, (user) => callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', session))
  // returns its unsubscribe function directly.
  onAuthChange() { return () => {}; },
};

export default firebaseProvider;
