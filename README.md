# FutureTech.ai — Interactive Login

An animated, fully responsive login page where a desk lamp reacts to you. The lamp leans toward the form when you reach for the password, and switches on — lighting up the room and the card — when you sign in.

Built from scratch with plain HTML, CSS and JavaScript as a FutureTech.ai portfolio piece.

> **Frontend demo only.** There is no real authentication. See [Security limitation](#security-limitation).

## Features

- Desk lamp drawn entirely in SVG: shade, arm, stand, base, bulb and a working pull cord
- Lamp leans toward the form and glows faintly when the password field is focused
- Sign-in switches the lamp on: a warm beam, a light pool on the desk, a brighter card and a warmer room
- Lock icon opens on success, followed by a drawn check-mark animation
- Empty fields shake the card and show inline messages (no `alert()`)
- Password show/hide toggle
- "Remember me" saves the **username only** in `localStorage`
- "Forgot password?" and "Create account" show an inline note explaining they are outside the demo
- Pull cord toggles the light by mouse, touch or keyboard (it never signs you in)
- Floating dust particles that turn golden in the lamplight
- Glassmorphism card, focus animations, button hover and press states
- Mobile-first layout tested at 360, 390, 768, 1024 and 1440 px, with no horizontal scrolling
- Accessible: real labels, keyboard navigation, visible focus rings, live status messages, `aria-pressed` toggles, skip link, and `prefers-reduced-motion` support

## Technologies

- HTML5 (semantic markup, inline SVG)
- CSS3 (custom properties, grid, `backdrop-filter`, keyframes, media queries)
- Vanilla JavaScript (no frameworks, no libraries, no build step)
- Optional web font: [Sora](https://fonts.google.com/specimen/Sora) from Google Fonts. Offline, the page falls back to system fonts automatically.

## How to run locally

The JavaScript uses ES modules, which browsers block on `file://`. **Double-clicking `index.html` no longer works** — run a local server instead.

**Option A — VS Code Live Server (recommended)**

1. Open the `futuretech-login` folder in VS Code (File → Open Folder).
2. Install the **Live Server** extension by Ritwick Dey (Extensions panel, `Ctrl+Shift+X`).
3. Right-click `index.html` → **Open with Live Server**.
4. The page opens at `http://127.0.0.1:5500/index.html` and reloads when you save a file.

**Option B — Python**

```bash
cd futuretech-login
python -m http.server 5500
```

Then visit `http://127.0.0.1:5500`.

## Project structure

```
futuretech-login/
├── index.html                Page markup, SVG lamp, form and success panel
├── css/
│   ├── tokens.css            Colours, radii, easing
│   ├── base.css              Reset, background, particles, top bar, layout, footer
│   ├── lamp.css              Lamp, light and pull cord
│   └── card.css              Glass card, form, buttons, messages, success panel
├── js/
│   ├── config.js             AUTH_PROVIDER + public config only
│   ├── validation.js         Form checks (UX only, not security)
│   ├── auth/
│   │   ├── auth-service.js   The only auth API the UI uses
│   │   ├── errors.js         Error codes + user-facing messages
│   │   ├── demo-provider.js  Demo: no real authentication
│   │   ├── supabase-provider.js  Placeholder until Supabase is connected
│   │   └── firebase-provider.js  Documented stub
│   ├── ui/                   lamp.js, feedback.js, panels.js
│   └── pages/login.js        Sign-in page controller
├── supabase/schema.sql       Database tables, trigger and RLS policies
└── README.md
```

## How the animation works

The whole page is driven by three classes on `<body>`, toggled from JavaScript:

| Class | Set when | Visual effect |
|---|---|---|
| `is-peeking` | Password field is focused | Lamp head tilts toward the form, faint beam and glow |
| `is-lit` | Sign-in succeeds or the cord is pulled | Beam, bulb halo, desk light pool, warm room glow, brighter card |
| `is-authed` | Sign-in succeeds | Lock shackle lifts open, heading changes |

CSS does the rest with transitions:

- **Lamp tilt.** The lamp head is an SVG group that rotates around the joint on top of the stand. Its angle comes from a `--tilt` custom property, and each body state sets a different value. A springy cubic-bezier gives it a small overshoot.
- **Light.** The beam is a blurred SVG polygon with a fading amber gradient. It fades in with a short "filament flicker" keyframe.
- **Card brightness.** The card has two overlay layers: a dark shade (visible when the room is dim) and a warm radial light (visible when the lamp is on). They crossfade.
- **Pull cord.** It is counter-rotated so it hangs straight down, and springs down 10px when pulled.
- **Error shake.** A `shake` keyframe is restarted on every failed attempt by removing the class and forcing a reflow.
- **Success.** The form fades out, the success panel fades in, the ring and tick draw via `stroke-dashoffset`, and a soft amber burst expands behind them.
- **Particles.** JavaScript creates 16–28 small dots with randomised size, speed and drift, animated with a single CSS keyframe.

With `prefers-reduced-motion: reduce` enabled, animations are cut to near-instant and the particles are removed.

### Main JavaScript modules

| Module | Purpose |
|---|---|
| `js/auth/auth-service.js` | The only auth API the UI calls: `signIn`, `signUp`, `signOut`, `getSession`, `onAuthChange`… |
| `js/pages/login.js` | Validates the form, calls `auth-service`, drives the lamp and panels from the result |
| `js/ui/lamp.js` | `turnLampOn()` / `turnLampOff()`, peeking, pull cord, particles |
| `js/ui/feedback.js` | Messages, field errors, shake, loading button |
| `js/ui/panels.js` | Fades between the form and the success panel |

## Security limitation

This project is a **frontend demo only**. It is not connected to any authentication system.

- Any non-empty username and password will "sign in".
- No credentials are checked, sent to a server or stored. The password never leaves the input field.
- "Remember me" stores only the username, in your own browser's `localStorage`.
- Do not use this page as-is to protect anything. Real authentication must happen on a server (or a trusted auth provider) over HTTPS, with hashed passwords, rate limiting and secure session handling.

## Future improvements

- Firebase Authentication
- Supabase Authentication
- Google login (OAuth)
- GitHub login (OAuth)
- WebAuthn / passkeys for passwordless sign-in
- Voice authentication
- An AI assistant that greets the user after login
- A backend API (for example FastAPI) for sessions and user data
- A user dashboard behind the login

---

© 2026 FutureTech.ai — Interactive UI Lab
