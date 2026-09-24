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
