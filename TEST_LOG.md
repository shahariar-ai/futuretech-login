# TEST_LOG — FutureTech.ai Login

Automated checks run with Playwright (Chromium headless) against a local static
server (`python -m http.server`). Test widths: 360 / 390 / 768 / 1024 / 1440 px.
The test script lives outside the repo (Claude's scratchpad), so the project
still needs no npm.

Legend: ✅ passed · 🔧 fixed during the phase · 👤 needs a human to check

---

## Phase 0 — Inspect and safeguard

- ✅ All required files present. `CLAUDE_CODE_INSTRUCTIONS (1).md` was renamed to `CLAUDE_CODE_INSTRUCTIONS.md`.
- ✅ Git already installed (2.55). `git init`, `.gitignore` added, commit `v1 demo baseline`.
- ✅ Baseline run on the original demo: 50/54 checks passed.
  Known gaps in the original (fixed in Phase 2):
  - Pull cord tap target is only ~21–23px wide on phones (should be ≥ 24px, ideally 44px).
  - No `aria-live` announcement for "signed in" or "light on / off".
- Baseline screenshots taken at all five widths (idle, password focused, signed in, reduced motion).

## Phase 1 — Auth-ready architecture

What changed: `style.css` → `css/tokens|base|lamp|card.css`; `script.js` →
`js/config.js`, `js/auth/*`, `js/ui/*`, `js/pages/login.js`, `js/validation.js`.

- ✅ `node --check` on every JS file.
- ✅ Visual diff vs. baseline at all five widths: only differences are random
  particles and the new badge text. Layout is identical.
- ✅ No console errors, no horizontal scroll at any width.
- ✅ All original flows still work: empty-field shake + messages, focus to first invalid
  field, error clears on typing, lamp peeks on password focus, show/hide password,
  Enter submits, lamp on + lock opens + success panel, sign out resets everything,
  Remember me restores the username only, pull cord by keyboard and click,
  "Forgot password?" info note, reduced motion (no particles, quick sign-in).
- ✅ Password never appears in `localStorage` / `sessionStorage`.
- ✅ "Demo mode — no real authentication" badge shows only when `AUTH_PROVIDER = 'demo'`
  (short "Demo mode" on phones; full text still read by screen readers).
- ✅ Architecture check: switching the provider to `'supabase'` (unconfigured) hides the
  badge and sign-in fails cleanly with "Sign-in isn't set up yet" and no console errors.
- ✅ UI files import only `auth-service.js`, never a provider.
- 👤 From now on the site must be opened with **VS Code Live Server** (ES modules do not
  work from `file://`).

## Phase 2 — Premium UI polish

What changed: spring lamp tilt (real damped-spring `linear()` curve with a
cubic-bezier fallback), bulb warm-up (dim amber → warm white, ~450ms),
flicker-out on failed sign-in (~550ms), pendulum cord sway, metal highlights
that warm up with the light, soft falloff desk shadow, beam with eased falloff
and faded sides, card light coming from the lamp's side (top-left on phones,
left edge on tablet/desktop), layered glass edge + grain + specular rim,
lower blur on phones + solid fallback without `backdrop-filter`, accent caret,
drawn checkbox tick, morphing eye icon, spinner that never moves the label,
44px touch targets, safe-area padding, `enterkeyhint`, an `aria-live` region
for "Light on / Light off / Signed in / Signed out", and a real reduced-motion
path (no spring, flicker, sway, shake or particles — fades only).

- ✅ 73/73 automated checks passed (Chromium, all five widths).
- ✅ No console errors, no horizontal scroll at 360 / 390 / 768 / 1024 / 1440, before and after sign-in.
- ✅ Touch targets: every button/link ≥ 44px tall; lamp cord hit area now ≥ 36×44px on phones (was ~21px wide). 🔧 Brand link raised to 44px.
- ✅ Screen reader live region announces "Signed in as …. Light on.", "Light off", "Signed out. Light off."
- ✅ Failed sign-in (tested by switching to the unconfigured provider) flickers the bulb out and leaves the lamp off.
- ✅ Loading state: spinner fades in on the right, label stays centred, button height stays 52px.
- ✅ Checkbox tick draws in; eye icon slash draws in when the password is shown; caret is amber.
- ✅ Reduced motion: no particles, no tilt spring, no cord sway; sign-in still completes.
- ✅ Contrast (WCAG AA ≥ 4.5:1), worst cases: muted text on lit card 5.7:1, placeholder 6.3:1, button label 9.0:1; everything else higher.
- ✅ Before/after screenshots compared at all five widths (idle, password focused, signed in).
- 🔧 Test-only timing fixes (checkbox and spinner sampled too early). No app bug.
- 👤 Needs a human eye: how the spring, warm-up and flicker *feel*; Safari/Firefox
  rendering of the specular rim (`mask-composite`) and spring curve (`linear()`) —
  both have fallbacks; a real phone with a notch and the on-screen keyboard open.

## Before Pause A — `supabase/schema.sql`

Tested for real on a throwaway local PostgreSQL 18 database (with a small mock of
Supabase's `auth` schema and the `anon` / `authenticated` roles). The database was
deleted afterwards; nothing touched Supabase.

- ✅ Script runs without errors, and running it a second time is also fine (idempotent).
- ✅ Sign-up trigger creates a profile: name trimmed, OAuth `name`/`avatar_url` picked up, empty metadata → empty name.
- ✅ RLS is enabled on `profiles`.
- ✅ User A sees only their own row and cannot read User B's row.
- ✅ User A can update their own name; updating B's row changes 0 rows; B is unchanged.
- ✅ User A cannot change `id` or `created_at`, cannot insert, cannot delete (permission denied).
- ✅ Names over 100 characters are rejected; `updated_at` updates automatically.
- ✅ Anonymous visitors cannot read profiles at all.
- ✅ The trigger function cannot be called through the API.
- ✅ Deleting an auth user deletes their profile (cascade).
- 👤 Must be re-checked on the real Supabase project in Phase 10 (User A vs User B through the API).

**Change of plan (2026-09-25):** Supabase setup is postponed. Phases 4–8 and the
Phase 9 preparation were built without Supabase credentials. `AUTH_PROVIDER = 'auto'`
uses the demo provider until the Supabase URL + anon key are filled in.
The Supabase provider is tested against **mocked Supabase HTTP responses**
(Playwright route interception: a patched `config.js` points the app at
`https://mockproj.supabase.co`, and every `/auth/v1/*` and `/rest/v1/*` call is
answered by the test). The real `supabase-js@2.117.1` library from jsDelivr runs
unchanged in these tests.

## Phase 4 — Sign in, create account, forgot password

What changed: `AUTH_PROVIDER = 'auto'`; real `supabase-provider.js`
(supabase-js 2.117.1 pinned, implicit flow, all errors mapped); demo provider that
supports every flow without storing passwords; one card with Sign in / Create account /
Check your inbox / Forgot password / Signed in panels (crossfade + height animation);
email field; strength meter; resend confirmation with 60s cooldown; Remember me
(localStorage vs sessionStorage); session guard; new error codes `INVALID_EMAIL`,
`LINK_EXPIRED`, `SAME_PASSWORD`, `SESSION_MISSING`.

- ✅ 139/139 automated checks passed.
- ✅ All panels at 360 / 390 / 768 / 1024 / 1440: no horizontal scroll, every touch target ≥ 44px, no console errors.
- ✅ Demo: empty / bad email validation, wrong password (flicker + shake + generic message),
  unconfirmed → Resend (success message, countdown, demo email link), rate limited, network error,
  success → lamp on, unlocked, "Signed in as …" announced, redirect to `dashboard.html` after ~1.5s.
- ✅ Remember me off → session in `sessionStorage`; on → `localStorage`. The password is never in any storage.
- ✅ Session guard: opening `index.html` while signed in goes to the dashboard.
- ✅ Create account: all four fields validated, strength meter weak / okay / strong, mismatch error,
  success → "Check your inbox", lamp glows faintly (not fully on), password fields cleared, resend works,
  email carried back to the sign-in panel.
- ✅ Forgot password: always the same neutral message; `index.html#forgot` and `#signup` open the right panel.
- ✅ Keyboard only (Tab / Enter) sign in; focus goes to the welcome heading. Reduced motion: no particles.
- ✅ Supabase (mocked): `POST /auth/v1/token?grant_type=password` with the anon key header;
  `invalid_credentials` → generic message; `email_not_confirmed` → message + `POST /auth/v1/resend {type: signup}`;
  `429` → rate-limit message; aborted request → network message; success → name from metadata,
  session stored per Remember me, only `futuretech-remember` = 0/1 stored as the choice.
- ✅ Supabase (mocked): sign-up sends trimmed `full_name` and `redirect_to=…/dashboard.html`;
  an already-registered email gets the same "check your inbox" (no account enumeration);
  server `weak_password` → message + field flagged; confirmation off → signed in straight away;
  forgot → `redirect_to=…/reset-password.html`, unknown email still neutral, `429` → rate-limit message.
- ✅ If supabase-js can't be downloaded (CDN blocked) the page shows a clean error, no uncaught exceptions.
- 🔧 Panel fade-in used `requestAnimationFrame`, which was sometimes not fired in headless runs; replaced with a forced reflow.
- ℹ️ With a real server, Chrome itself prints "Failed to load resource: 400" in the console for a wrong
  password (and 429 for rate limits). That line comes from the browser, not the app; the tests allow only that line.
- 👤 Real Supabase only: the confirmation email actually arrives, its link signs you in, `email_not_confirmed`
  wording from the live server, real rate limits, closing the browser really ends a "Remember me off" session
  (some browsers restore sessions on restart).

## Phase 5 — Reset password page

What changed: `reset-password.html` + `js/pages/reset-password.js` (same lamp and card).
The page reads the email link through `auth-service.handleAuthRedirect()` (and also
listens for `PASSWORD_RECOVERY`), shows "Choose a new password" with the strength meter,
calls `updatePassword`, then closes the one-time recovery session so the next sign-in
uses the new password. Expired, used, invalid or missing links get a clear message and
a "Request a new link" button (→ `index.html#forgot`).

- ✅ 69/69 automated checks passed (and the Phase 4 suite still passes 139/139).
- ✅ Demo end to end: Forgot password → demo email link → form → validation (empty, weak, mismatch)
  → "Password updated", lamp on, announced → session closed → "Back to sign in" stays on sign in.
- ✅ Link tokens / errors are removed from the address bar. Reloading during a recovery keeps the form.
  A used demo link, a missing link and `otp_expired` all show the "invalid or expired" panel.
- ✅ Layout at 360 / 390 / 768 / 1024 / 1440 for the invalid, form and done panels: no horizontal scroll,
  touch targets ≥ 44px, no console errors.
- ✅ Supabase (mocked): recovery link tokens verified with `GET /auth/v1/user`; `PUT /auth/v1/user`
  sends the new password with the recovery token; `POST /auth/v1/logout` afterwards; nothing left in storage.
  `same_password` → message + field; `weak_password`, `429`, network error → messages;
  server rejects the token → invalid panel.
- 🔧 Chromium sometimes skips a cross-page view transition when the next page is ready very early, and
  then prints "Uncaught (in promise) InvalidStateError: Transition was aborted…". The navigation itself
  works. Fixed with `js/vt-guard.js`, a tiny script at the top of each page that marks only that error as handled
  (checked over 16 repeated navigations: 0 errors).
- 🔧 Link-style anchors no longer underlined until hover (matched the link buttons).
- 👤 Real Supabase only: the reset email arrives, its link opens this page, the new password works and the old one doesn't.

## Phase 6 — Dashboard, profile, sign out, page transitions

What changed: `dashboard.html`, `css/dashboard.css`, `js/pages/dashboard.js`.
The body starts as `.is-guarding` (private card hidden) until the session check passes.
Shows "Welcome, {name}", email, member-since date and email status, with a small lit lamp
in the header. Full name can be edited (Supabase: `profiles` table through RLS). Sign out
turns the lamp off and returns to sign in; signing out in one tab signs out the others.
Cross-document View Transitions morph the lamp and card between pages
(`@view-transition`, `.vt-lamp`, `.vt-card`), with a fade fallback in `transitions.js`.
Sign-up confirmation links land on the dashboard ("Email confirmed"); expired links
go back to sign in with a clear message.

- ✅ 88/88 automated checks passed (Phase 4: 139/139 and Phase 5: 69/69 re-run, still passing).
- ✅ Signed out → `dashboard.html` redirects to sign in with **no painted frame** of the private card (demo and mocked Supabase).
- ✅ Content: name, email, member since, "Confirmed", lamp lit, "Signed in as …" announced.
- ✅ Profile: empty name → error; unchanged → "No changes to save."; saved → welcome updates;
  `<b>` in a name stays plain text (textContent); kept after reload.
- ✅ Sign out → "Signed out" on sign in, address cleaned, session removed; dashboard redirects again;
  the Back button doesn't bring the dashboard back.
- ✅ Cross-tab sign-out: demo (Remember me on and off) and Supabase (supabase-js BroadcastChannel).
- ✅ Layout at 360 / 390 / 768 / 1024 / 1440 with a very long email: no horizontal scroll, touch targets ≥ 44px, no console errors.
- ✅ Page transitions: Chromium runs a view transition into the dashboard; a browser without
  cross-document transitions gets the fade-out; reduced motion navigates with no animation.
- ✅ Supabase (mocked): `GET /rest/v1/profiles?id=eq.<own id>` with the user's token; name from the profile row;
  `PATCH /rest/v1/profiles {full_name}` → "Saved"; RLS returning 0 rows → error (not "Saved");
  500 → message; expired JWT (`PGRST301`) → back to sign in; network error → message;
  profile load failure → note, dashboard still works; `POST /auth/v1/logout` and storage cleared on sign out;
  confirmation link with tokens → "Email confirmed", tokens removed from the address bar.
- 🔧 The first "no flash" probe also sampled before the stylesheet loaded (nothing painted yet); changed it to check painted frames only.
- 👤 Real Supabase only: User A cannot read or change User B's profile through the API (RLS was proven on local
  Postgres before Pause A; re-check live), the confirmation link from a real email, cross-tab sign-out in two real
  browser windows, and how the lamp/card morph *looks* in Chrome vs Firefox/Safari.
