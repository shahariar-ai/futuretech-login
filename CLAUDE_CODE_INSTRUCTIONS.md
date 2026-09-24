# Claude Code Instructions — FutureTech.ai Interactive Login (Full Build Plan)

## 0. Read this first

You are working inside the `futuretech-login/` folder. It currently contains a **frontend-only demo**:

```
futuretech-login/
├── index.html   SVG desk lamp + glass login card + success panel
├── style.css    Theme, layout, lamp states (body.is-peeking / is-lit / is-authed), animations
├── script.js    Fake validation, lamp control, success/error flow, particles
└── README.md
```

Right now any non-empty username and password "signs in". Nothing is checked.

**Final goal:** a production-quality, real multi-user app that many people can use on their own laptops.

1. Clean, auth-ready architecture: the UI talks to one `auth-service`, and providers (Demo, Supabase, Firebase) plug in behind it.
2. Premium UI: realistic lamp, better lighting and glass, polished micro-interactions, great on mobile, accessible.
3. Real accounts with Supabase: sign up, email verification, sign in, forgot/reset password, sign out.
4. A protected dashboard per user, with smooth page transitions.
5. Optional Google and GitHub login.
6. Installable on laptops as a PWA.
7. Hosted online over HTTPS so anyone can use it with a link.

**Frontend:** HTML + CSS + vanilla JavaScript (ES modules). No React, no build step, no npm needed to run the site.
**Backend:** Supabase (Auth + Postgres), free tier. Firebase stays as a ready-to-implement option.

### About the user

- The user (Shahariar) is learning web development. Explain what you do **in simple Bangla**. Keep code, comments and UI text in English.
- The user does the manual steps in the Supabase / Google / GitHub dashboards. When a step needs them, **stop and give numbered, click-by-click instructions**, then wait for their reply.
- Never ask the user to paste a `service_role` key, admin key or any password into the chat.

---

## 1. Hard rules (apply to every phase)

1. **Run continuously.** The user wants to do all testing once, at the end. Work through the phases one after another **without waiting for approval**. Only stop at the three pause points in section 1A. At the end of each phase, print a 2–3 line Bangla progress note and keep going.
2. **Git.** Commit at the end of every phase with a clear message. Never commit secrets.
3. **Keep the core experience.** Lamp, glass card, particles, shake, lock-unlock and success animation must keep working. Auth results drive the same body classes (`is-peeking`, `is-lit`, `is-authed`).
4. **Security — real, not fake:**
   - No browser-side password hashing, no "encryption", no pretend checks. Real security lives in the auth provider and the database rules.
   - Never log, store or display passwords. Never put passwords in `localStorage`.
   - The Supabase **anon/publishable key** and the **Firebase web config** are public by design and may live in `js/config.js`. Security comes from **Row Level Security (Supabase)** or **Security Rules (Firebase)**. Do not build a backend server just to hide them.
   - **Never** put a Supabase `service_role` key, Firebase Admin credentials, OAuth client secrets or SMTP passwords in frontend code or in the repo. Those only go into the provider dashboards.
   - Every database table has RLS enabled, with policies so a user can only read/update their own row.
   - Insert user-provided text with `textContent`, never `innerHTML`.
   - Sign-in errors are generic: "Email or password is incorrect." Never reveal whether an email exists.
5. **Quality bar:** no `alert()`, no broken links, no console errors, no horizontal scrolling at 360 / 390 / 768 / 1024 / 1440 px.
6. **Performance bar:** keep 60fps on a mid-range phone. Animate only `transform` and `opacity` where possible. Reduce `backdrop-filter` blur and particle count on small screens. No animation longer than 1s, except the success moment.
7. **Accessibility bar:** WCAG AA contrast, labels on every input, full keyboard use, visible focus, `aria-live` announcements for auth and lamp state changes, and a complete `prefers-reduced-motion` path.
8. ES modules do not work from `file://`. From Phase 1 on, the user must run the site with **VS Code Live Server**. Tell them clearly.
9. Screenshots: if a headless browser is available (e.g. Playwright), take screenshots at all five widths before and after UI changes and show the differences.

### 1A. Run mode — test at the end

**Self-testing is still required.** The user won't test between phases, so you must:
- After every phase, run your own checks: JS syntax check, open every page in a headless browser (Playwright) at 360 / 390 / 768 / 1024 / 1440 px, confirm no console errors and no horizontal scroll, and click through the flows that exist so far.
- Fix anything that fails **before** committing the phase. Never move on with a known bug.
- Commit every phase separately, so any phase can be rolled back if a problem shows up in the final test.
- Keep a running `TEST_LOG.md`: for each phase, what you checked, what passed, what you fixed, and anything only a human can check (e.g. real emails arriving).

**Ask once, at the very start (Phase 0):**
- "Do you want Google and GitHub login too?" (Phase 7 is skipped if the answer is no.)

**Only three pause points** — these need the user's hands in outside dashboards, so you cannot skip them:

| Pause | When | What the user does |
|---|---|---|
| **A** | After Phase 2 | Everything in Supabase in one sitting: create the project, copy URL + anon key, run `schema.sql`, email settings, local URL configuration — and, if chosen, the Google and GitHub OAuth apps. Give one combined numbered checklist. |
| **B** | Phase 9 | Push to GitHub and connect Netlify, then add the live URL in Supabase (and the OAuth apps). |
| **C** | Phase 10 | The final test, done together. |

Before Pause A, finish Phases 0–2 **and** write `supabase/schema.sql` and all provider code you can, so the pause is as short as possible. The anon/publishable key is public by design, so the user may paste it into the chat or into `js/config.js` themselves. Never ask for the `service_role` key, OAuth client secrets or passwords.

Phases 4–8 then run straight through after Pause A.

---

## 2. Target structure (end of all phases)

```
futuretech-login/
├── index.html                 Sign in / Create account / Forgot password (one page, three panels)
├── dashboard.html             Protected page after sign-in
├── reset-password.html        Set a new password (from the email link)
├── css/
│   ├── tokens.css             Colours, type scale, spacing, easing, shadows
│   ├── base.css               Reset, body, background, particles, footer
│   ├── lamp.css               Lamp, light, shadows
│   ├── card.css               Glass card, form, buttons, messages
│   └── dashboard.css
├── js/
│   ├── config.js              AUTH_PROVIDER + public config only
│   ├── auth/
│   │   ├── auth-service.js    The only auth API the UI uses
│   │   ├── errors.js          Error codes + user-facing messages
│   │   ├── demo-provider.js   Current demo behaviour, clearly labelled
│   │   ├── supabase-provider.js
│   │   └── firebase-provider.js  Documented stub, ready to implement
│   ├── ui/
│   │   ├── lamp.js            Lamp states, bulb warm-up, flicker-out, particles
│   │   ├── feedback.js        Messages, field errors, shake, loading button
│   │   ├── panels.js          Panel switching inside the card
│   │   └── transitions.js     Page transitions
│   ├── pages/
│   │   ├── login.js
│   │   ├── dashboard.js
│   │   └── reset-password.js
│   └── validation.js          Email + password rules (UX only, not security)
├── icons/                     PWA icons generated from the hexagon mark
├── manifest.webmanifest
├── sw.js
├── supabase/
│   └── schema.sql             Tables, trigger, RLS policies
├── netlify.toml               Hosting config + security headers
├── .gitignore
└── README.md
```

---

## 3. Phases

### Phase 0 — Inspect and safeguard
- Read all four files. Explain in Bangla how the current flow works, and list anything you think is weak.
- `git init` if needed. Add `.gitignore` (`.DS_Store`, `node_modules/`, `.env`, `.vscode/*` except `extensions.json`). Commit as `v1 demo baseline`.

### Phase 1 — Auth-ready architecture (no visible change)
Refactor into the target structure **without changing how the page looks or behaves**.

**auth-service.js** — the single interface the UI uses:

```js
// Every method returns: { ok: boolean, user?: User, error?: { code, message } }
signIn({ email, password, remember })
signUp({ fullName, email, password })
signOut()
requestPasswordReset(email)
updatePassword(newPassword)
resendConfirmation(email)
signInWithOAuth(provider)          // 'google' | 'github'
getSession()                        // → { user } | null
onAuthChange(callback)              // → unsubscribe()

// User shape (provider-independent):
// { id, email, fullName, avatarUrl, emailConfirmed, createdAt }
```

- **errors.js:** codes `INVALID_CREDENTIALS`, `EMAIL_NOT_CONFIRMED`, `WEAK_PASSWORD`, `EMAIL_IN_USE`, `RATE_LIMITED`, `NETWORK`, `NOT_CONFIGURED`, `UNKNOWN`, each with one plain-English message. Providers translate their own errors into these codes.
- **demo-provider.js:** keeps today's behaviour (any non-empty fields succeed). The UI must show a small visible "Demo mode — no real authentication" badge when this provider is active. No fake hashing, no fake user database.
- **supabase-provider.js:** real implementation comes in Phase 4. For now, methods return `NOT_CONFIGURED`.
- **firebase-provider.js:** documented stub returning `NOT_CONFIGURED`, with comments showing which Firebase Auth functions map to each method, so it can be implemented later.
- **config.js:** `AUTH_PROVIDER = 'demo'` plus empty public config fields for Supabase and Firebase, with a comment explaining which values are public and which must never appear here.
- UI code (`ui/*`, `pages/*`) must never import a provider directly.
- Split CSS into the files listed above. No visual change.
- Test at all five widths. Commit `refactor: auth-ready architecture`.

### Phase 2 — Premium UI polish (no functional change)
Take "before" screenshots first.

**Lamp realism**
- Spring-based tilt with a small natural overshoot and settle when leaning toward the form.
- Bulb warm-up: dim amber to full warm white over ~400ms, with a slight colour-temperature shift.
- Failed sign-in: short flicker, then the bulb fades out (subtle, under 600ms).
- The pull cord sways slightly after being pulled and when the head moves.
- Metal parts get soft highlights that respond to the light being on or off.

**Lighting and shadows**
- The light on the card comes from the lamp's actual direction (a gradient positioned toward the lamp side, on desktop and mobile layouts).
- The lamp casts a soft, falloff shadow on the desk. The card casts a soft shadow that gets a warm tint when the lamp is on.
- The beam fades smoothly with no hard edges or clipping lines.

**Glass**
- Layered border: a thin inner top highlight plus an outer shadow.
- A very light noise texture (inline SVG or CSS) to prevent gradient banding.
- A subtle specular edge that brightens when the lamp is on.
- Lower blur on small screens for performance, with a solid-enough fallback when `backdrop-filter` isn't supported.

**Micro-interactions**
- Inputs: smooth label, icon and border transitions. The caret colour matches the accent.
- Buttons: hover lift, press compression, focus ring, loading state with no layout shift.
- Checkbox tick draws in. The password toggle icon morphs rather than swapping instantly.
- Messages slide in gently and are announced by screen readers.

**Mobile**
- Comfortable thumb reach: the main button is within easy reach, with 44px minimum touch targets.
- No layout jump when the on-screen keyboard opens (use `dvh` units and avoid fixed heights).
- Correct `inputmode` and `autocomplete` values. No zoom on input focus.
- Honour the safe area on phones with notches.

**Accessibility**
- Check contrast of all text, including placeholders and muted text, against AA.
- Announce "Light on" / "Light off" and auth results through an `aria-live` region.
- Reduced motion: no tilt spring, no flicker, no particles. Keep simple fades only.

Take "after" screenshots at all five widths and show the difference. Commit `ui: premium polish`.

### Phase 3 — Supabase project (Pause A)
Prepare everything first, then give the user one combined checklist (these steps plus the URL configuration from Phase 4 and, if chosen, the OAuth steps from Phase 7) and wait once:
1. supabase.com → sign in → **New project** (name `futuretech-login`, region closest to Bangladesh such as Singapore, save the database password safely offline).
2. **Project Settings → API:** copy the Project URL and the anon/publishable key into `js/config.js`.
3. **Authentication → Providers → Email:** keep "Confirm email" on, and set minimum password length to 8.

Then write `supabase/schema.sql`:
- `public.profiles`: `id uuid primary key references auth.users on delete cascade`, `full_name text`, `avatar_url text`, `created_at timestamptz default now()`, `updated_at timestamptz default now()`.
- Enable RLS. Policies: select own row, update own row (`auth.uid() = id`). No public insert policy.
- A `security definer` trigger function on `auth.users` insert that creates the profile row from `raw_user_meta_data.full_name`, with `set search_path = ''`.
- Include in the checklist: paste it into **SQL Editor → New query → Run**, and confirm the result.
- Commit.

### Phase 4 — Real authentication (Supabase provider)
- Implement `supabase-provider.js` with `supabase-js` v2 from `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2` (pin an exact version). Map all Supabase errors to the codes in `errors.js`.
- Switch `AUTH_PROVIDER` to `'supabase'`. The demo badge disappears.
- Change the form to use **email** instead of username.

Three panels inside the same card, with a smooth crossfade and height animation between them:

**Sign in**
- Email + password, show/hide, Remember me, Forgot password?, Create account.
- Success → bulb warm-up → unlock → success animation → go to `dashboard.html` after ~1.5s.
- `INVALID_CREDENTIALS` → flicker-out + shake + generic message.
- `EMAIL_NOT_CONFIRMED` → "Confirm your email first. Check your inbox." plus a **Resend email** button.
- `NETWORK` → "Can't reach the server. Check your connection and try again."
- `RATE_LIMITED` → "Too many attempts. Wait a minute and try again."

**Create account**
- Full name, email, password, confirm password.
- Live password strength meter (weak / okay / strong). Rules: at least 8 characters, with a letter and a number. These are UX hints; Supabase enforces the real minimum.
- After success: "Check your inbox to confirm your email." The lamp glows faintly, not fully on.

**Forgot password**
- Always show: "If an account exists for this email, a reset link is on its way."

**Remember me**
- Checked → persistent session (default `localStorage`).
- Unchecked → session ends when the browser closes, using a custom `sessionStorage` storage for the Supabase client. Store only the boolean choice.

**Session guard**
- If a valid session exists when `index.html` loads, go straight to the dashboard.

Already included in Pause A: **Authentication → URL Configuration**: Site URL `http://127.0.0.1:5500` for now, plus redirect URLs for `index.html`, `reset-password.html` and `dashboard.html`.

Self-test with the headless browser (sign-up with two test addresses if email confirmation allows it; otherwise log it for the final test). Commit.

### Phase 5 — Reset password page
- `reset-password.html` uses the same theme and lamp.
- Handles the `PASSWORD_RECOVERY` auth event → new password + confirm → `auth-service.updatePassword`.
- Success → lamp on → "Password updated" → link back to sign in.
- Expired or invalid link → clear message and a button back to "Forgot password".
- Commit.

### Phase 6 — Dashboard and page transitions
- `dashboard.html` checks the session **before** showing content, so there is no flash of protected content. No session → redirect to `index.html`.
- Same theme. A small lamp stays lit in the header.
- Shows "Welcome, {fullName}", email and account creation date.
- Edit full name (updates `profiles` through RLS), with saved/error feedback.
- Sign out → lamp turns off → back to sign in.
- `onAuthChange`: signing out in one tab signs out other open tabs.
- **Page transitions:** use the cross-document View Transitions API where supported (the lamp and card morph between login and dashboard), with a simple fade fallback in `transitions.js` for other browsers. Respect reduced motion.
- Commit.

### Phase 7 — Google and GitHub login (only if the user said yes in Phase 0; dashboard steps are done during Pause A)
- Add "Continue with Google" and "Continue with GitHub" buttons, following each provider's official button wording and branding guidelines.
- `auth-service.signInWithOAuth(provider)` with redirect to `dashboard.html`.
- Give click-by-click steps:
  - Google Cloud Console → OAuth consent screen → OAuth client ID (Web) → authorised redirect URI = the callback URL shown in Supabase → paste Client ID/Secret into **Supabase → Authentication → Providers → Google** (the secret goes only there).
  - GitHub → Settings → Developer settings → OAuth Apps → New → callback URL from Supabase → paste into **Providers → GitHub**.
- Commit.

### Phase 8 — Installable app (PWA)
- `manifest.webmanifest`: name "FutureTech.ai Login", short_name "FutureTech", `display: standalone`, theme/background `#0A0F1C`, start_url `./index.html`.
- PNG icons (192, 512, 512 maskable) generated from the hexagon mark.
- `sw.js`: cache static files only. **Never cache** requests to `*.supabase.co` or any auth endpoint. Versioned cache name, clean old caches on activate. Offline → a clear "You're offline" message.
- A subtle **Install app** button that appears only when `beforeinstallprompt` fires.
- Check DevTools → Application → Manifest shows no errors, and the app installs and opens in its own window.
- Commit.

### Phase 9 — Deploy online (Pause B)
Recommended host: **Netlify** (free, HTTPS by default).
1. Push the repo to GitHub (give the exact commands, or GitHub Desktop steps).
2. Netlify → Add new site → Import from GitHub → no build command, publish directory `/`.
3. `netlify.toml` with security headers: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy` (camera, microphone, geolocation off), and a Content-Security-Policy allowing only self, jsDelivr, Google Fonts and `https://*.supabase.co` (plus the OAuth providers if Phase 7 was done). Test that nothing breaks.
4. Update Supabase URL Configuration: Site URL = the Netlify URL, and add the live redirect URLs (keep the localhost ones for development).
5. Update the Google/GitHub OAuth apps with the live URLs if Phase 7 was done.

Explain free-tier limits in plain Bangla:
- Supabase's built-in email sender allows only a few emails per hour. For real users, set up custom SMTP (for example Resend's free tier) in **Authentication → Emails → SMTP settings**. Offer to guide them.
- Free Supabase projects pause after about a week without activity. Opening the Supabase dashboard resumes it.
- Customise the confirmation and reset email templates with FutureTech.ai wording.

Commit and push.

### Phase 10 — Final test together (Pause C) and README
First share `TEST_LOG.md` in Bangla. Then walk the user through this checklist **one item at a time** on the **live URL**, on at least two laptops or browsers. If something fails, find which phase caused it (use the per-phase commits), fix it, redeploy, and re-test that item:

- [ ] Sign up → confirmation email arrives → link works → can sign in
- [ ] Wrong password → flicker-out, shake, generic message
- [ ] Unconfirmed email → resend works
- [ ] Forgot password → email → reset page → new password works, old one doesn't
- [ ] Remember me off → closing the browser signs out
- [ ] Opening `dashboard.html` directly while signed out redirects to sign in, with no content flash
- [ ] User A cannot read or change User B's profile (test with A's session directly against the API)
- [ ] Signing out in one tab signs out the other tab
- [ ] Page transitions work, and fall back cleanly in a browser without View Transitions
- [ ] Google / GitHub login (if enabled)
- [ ] App installs as a PWA and opens in its own window
- [ ] Keyboard-only use works, reduced motion works, screen reader hears state changes
- [ ] No console errors, no horizontal scroll at 360 / 390 / 768 / 1024 / 1440 px
- [ ] Switching `AUTH_PROVIDER` back to `'demo'` still works (architecture check)

Rewrite `README.md`: overview, live link, features, tech stack, architecture diagram of `auth-service` and providers, how to run locally, Supabase setup, how to add the Firebase provider later, deployment, security notes (RLS, public vs secret keys), free-tier limits, how to record a demo GIF, future ideas (passkeys/WebAuthn, voice login, AI assistant after login, admin panel).

Finish with a Bangla summary for the user: what was built, the live link, and what to show clients on Upwork.

---

## 4. Definition of done

- Real users can create accounts and sign in from any laptop via the live HTTPS link.
- The UI depends only on `auth-service`. Supabase is live, and Firebase can be added by implementing one provider file.
- Each user's data is protected by RLS. No secrets in the repo.
- The lamp reacts realistically to real auth results.
- Premium, responsive, accessible UI that stays smooth on mid-range phones.
- The app installs on laptops as a PWA.
