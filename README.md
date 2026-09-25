# FutureTech.ai — Interactive Login

A login experience where a desk lamp reacts to you. It leans toward the form when you reach for the password, warms up and switches on when you sign in, and flickers out when the password is wrong.

Behind the lamp is a real multi-user app: create an account, confirm your email, sign in, reset a forgotten password, and edit your profile on a private dashboard. It installs on a laptop as an app (PWA).

**Live demo:** _coming soon (Netlify link goes here after deployment)_

> Until the Supabase project is connected, the site runs in **Demo mode** (a visible badge says so). Every flow works, but nothing is checked or stored on a server. Filling in two public values in `js/config.js` switches it to real accounts. See [SETUP_WHEN_READY.md](SETUP_WHEN_READY.md).

## Features

**Accounts (Supabase Auth)**
- Sign up with full name, email and password, with a live strength meter
- Email confirmation, with a "Resend email" button and a 60-second cooldown
- Sign in with generic errors ("Email or password is incorrect.") so nobody can tell which emails exist
- Forgot password → email link → `reset-password.html` → new password
- "Remember me": on = stays signed in, off = signed out when the browser closes
- Protected dashboard: name, email, member-since date, editable full name
- Sign out in one tab signs out every other open tab

**The lamp**
- Spring tilt toward the form, bulb warm-up from dim amber to warm white, flicker-out on failure
- Pull cord that sways, metal highlights that react to the light, a soft desk shadow
- Light on the glass card comes from the lamp's real direction
- The lamp and card morph between pages (View Transitions API, with a fade fallback)

**Quality**
- Responsive and tested at 360, 390, 768, 1024 and 1440 px with no horizontal scrolling
- Accessible: labels, full keyboard use, visible focus, 44px touch targets, WCAG AA contrast, screen-reader announcements ("Light on", "Signed in as…"), and a full reduced-motion mode
- Installable PWA with an offline page and an "Install app" button
- Strict security headers and Content-Security-Policy (`netlify.toml`)

## Tech stack

| Part | Choice |
|---|---|
| Frontend | HTML, CSS, vanilla JavaScript (ES modules). No framework, no build step, no npm. |
| Auth + database | [Supabase](https://supabase.com) (Auth + Postgres with Row Level Security), free tier |
| Client library | `@supabase/supabase-js` 2.117.1, loaded from jsDelivr (pinned version) |
| Hosting | [Netlify](https://netlify.com) (free, HTTPS) |
| Font | [Sora](https://fonts.google.com/specimen/Sora) from Google Fonts (falls back to system fonts) |

## Architecture

The UI never talks to Supabase directly. Every page calls one module, `auth-service.js`, which forwards to whichever provider is active. Swapping the backend means writing one provider file.

```
  index.html        dashboard.html      reset-password.html
      │                   │                     │
  pages/login.js    pages/dashboard.js   pages/reset-password.js
      │                   │                     │
      └──── ui/lamp.js · ui/feedback.js · ui/panels.js · ui/transitions.js
                          │
                          ▼
              ┌────────────────────────┐
              │  auth/auth-service.js   │   signIn · signUp · signOut
              │  (the only auth API)    │   requestPasswordReset · updatePassword
              └───────────┬────────────┘   resendConfirmation · getSession · onAuthChange
                          │  picks a provider from js/config.js
        ┌─────────────────┼──────────────────┐
        ▼                 ▼                  ▼
  demo-provider     supabase-provider   firebase-provider
  (no real auth,    (supabase-js →      (documented stub,
   visible badge)    *.supabase.co)      ready to implement)
```

Every method returns `{ ok, user?, error? }`. Errors use shared codes from `auth/errors.js` (`INVALID_CREDENTIALS`, `EMAIL_NOT_CONFIRMED`, `RATE_LIMITED`, `NETWORK`, …), each with one plain-English message. The user object always has the same shape: `{ id, email, fullName, avatarUrl, emailConfirmed, createdAt }`.

`AUTH_PROVIDER` in `js/config.js` can be `'auto'` (default: Supabase once configured, otherwise demo), `'demo'`, `'supabase'` or `'firebase'`.

The lamp is driven by three classes on `<body>`: `is-peeking` (password focused), `is-lit` (light on) and `is-authed` (signed in). Auth results only toggle these classes; CSS does the animation.

### Project structure

```
futuretech-login/
├── index.html              Sign in / Create account / Check inbox / Forgot password panels
├── dashboard.html          Protected page after sign-in
├── reset-password.html     Set a new password from the email link
├── offline.html            Shown by the service worker when offline
├── manifest.webmanifest    PWA manifest
├── sw.js                   Service worker (static files only, never Supabase)
├── netlify.toml            Hosting config + security headers + CSP
├── css/                    tokens, base, lamp, card, dashboard
├── js/
│   ├── config.js           AUTH_PROVIDER + public config only
│   ├── validation.js       Email and password rules (UX hints, not security)
│   ├── vt-guard.js         Silences a harmless Chromium view-transition warning
│   ├── auth/               auth-service, errors, demo / supabase / firebase providers
│   ├── ui/                 lamp, feedback, panels, strength, transitions, pwa, app-shell
│   └── pages/              login, dashboard, reset-password
├── icons/                  Favicon + PWA icons from the hexagon mark
├── supabase/schema.sql     profiles table, sign-up trigger, RLS policies
└── SETUP_WHEN_READY.md     Step-by-step Supabase + Netlify setup (in Bangla)
```

## Run locally

ES modules don't work from `file://`, so double-clicking `index.html` won't work. Use a local server.

**VS Code Live Server (recommended)**
1. Open the `futuretech-login` folder in VS Code.
2. Install the **Live Server** extension (Ritwick Dey).
3. Right-click `index.html` → **Open with Live Server**. It opens at `http://127.0.0.1:5500/index.html`.

**Python**
```bash
cd futuretech-login
python -m http.server 5500
```
Then open `http://127.0.0.1:5500`.

Without Supabase values the site runs in Demo mode. The demo shows "email links" on screen instead of sending emails. Use any email and a password with 8+ characters, a letter and a number.

## Supabase setup (short version)

Full click-by-click steps are in [SETUP_WHEN_READY.md](SETUP_WHEN_READY.md).

1. Create a Supabase project (region: Singapore).
2. **Authentication → Sign In / Providers → Email:** Confirm email ON, minimum password length 8.
3. **SQL Editor:** run `supabase/schema.sql`. It creates `public.profiles`, enables RLS (users can only read and update their own row), and adds a trigger that creates the profile on sign-up.
4. **Authentication → URL Configuration:** set the Site URL and add redirect URLs for `index.html`, `dashboard.html` and `reset-password.html`.
5. Put the **Project URL** and **anon / publishable key** in `js/config.js`. With `AUTH_PROVIDER = 'auto'` the app switches to Supabase automatically.

## Adding Firebase later

`js/auth/firebase-provider.js` is a documented stub. Each method has a comment showing which Firebase Auth function to call (`signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `sendPasswordResetEmail`, …). To use it:
1. Fill in `FIREBASE_CONFIG` in `js/config.js` (the Firebase web config is public).
2. Implement the methods so they return `{ ok, user, error }` with the shared error codes.
3. Set `AUTH_PROVIDER = 'firebase'`.
4. In `netlify.toml`, add `https://www.gstatic.com` to `script-src` and the Firebase endpoints to `connect-src`.
5. Protect data with Firebase Security Rules (the equivalent of RLS).

No UI file needs to change.

## Deployment (Netlify)

1. Push the repo to GitHub.
2. Netlify → **Add new site → Import an existing project** → choose the repo.
3. Build command: empty. Publish directory: `.` (root). `netlify.toml` already sets this.
4. After the first deploy, add the Netlify URL in Supabase → **Authentication → URL Configuration**.

`netlify.toml` adds these headers to every response:
- `Content-Security-Policy`: only this site, jsDelivr, Google Fonts and `*.supabase.co`. No inline scripts or styles, no `eval`, no framing.
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`
- `Permissions-Policy` turning off camera, microphone and geolocation
- HSTS and `Cross-Origin-Opener-Policy: same-origin`

It also hides the project notes (`*.md` files and `supabase/`) from the website.

## Security notes

- **Real security is on the server.** Supabase checks passwords, sends emails and issues sessions. Row Level Security in Postgres makes sure a user can only read and change their own profile, even if someone calls the API directly with their own token.
- **Public vs secret keys.** The Supabase Project URL and anon/publishable key are public by design and live in `js/config.js`. The `service_role` / secret key, the database password, OAuth client secrets and SMTP passwords must **never** go into this repo or the browser. They only belong in the Supabase dashboard.
- Passwords are never logged, stored or shown. Only the "Remember me" choice (`0` or `1`) is stored by the app itself.
- User text is always inserted with `textContent`, never `innerHTML`.
- Sign-in, sign-up and forgot-password messages never reveal whether an email is registered.
- The service worker caches only this site's own static files. It never touches Supabase or auth requests.
- Client-side checks (email format, password strength) are hints for the user, not security.

## Free-tier limits

- **Emails:** Supabase's built-in email sender only allows a few emails per hour, meant for testing. For real users, add a custom SMTP provider (for example Resend's free tier) in **Authentication → Emails → SMTP settings**.
- **Project pausing:** a free Supabase project pauses after about a week with no activity. Opening the Supabase dashboard and clicking **Restore** brings it back.
- **Netlify free plan:** has a monthly bandwidth / usage allowance (see netlify.com/pricing). This site is small and has no build step, so a portfolio demo stays well inside it.

## Recording a demo GIF

1. Open the live site in Chrome at about 1280×800, and close other tabs and bookmarks bar for a clean frame.
2. Use [ScreenToGif](https://www.screentogif.com/) (Windows, free) or [Kap](https://getkap.co/) (macOS) to record the browser area.
3. Record this short story (about 15 seconds): focus the password field (lamp leans in) → type a wrong password (flicker + shake) → type the right one (warm-up, unlock, success) → dashboard morph → sign out (lamp turns off).
4. Export at 15 fps, about 900 px wide, and keep it under 5 MB. Put it at the top of this README.

## Testing

Each phase was tested with Playwright (headless Chromium) at five widths, including mocked Supabase responses for every auth flow. Results, fixes and the items only a person can check are in [TEST_LOG.md](TEST_LOG.md).

## Future ideas

- Passkeys / WebAuthn for passwordless sign-in
- Google and GitHub login (the `signInWithOAuth` method is already in `auth-service`)
- Voice login
- An AI assistant that greets the user after sign-in
- An admin panel for managing users
- Avatar upload with Supabase Storage

---

© 2026 FutureTech.ai — Interactive UI Lab
