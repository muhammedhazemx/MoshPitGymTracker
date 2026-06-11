# MOSH PIT GYM

A high-end, brutalist Progressive Web App (PWA) for tracking gym workouts with an offline-first approach. Inspired by the raw energy and industrial aesthetic of streetwear editorial websites (mosh---pits.com).

## ⚡ Features

- **Brutalist Aesthetic**: Bold typography, minimal UI, and high-contrast dark mode.
- **Offline-First**: Powered by IndexedDB (via Dexie.js), all your data stays on your device.
- **Dynamic Workout Splits**: Support for Push/Pull/Legs, Upper/Lower, Full Body, and custom routines.
- **Step-by-Step Logging**: Focused, intentional interaction flow.
- **Progress Tracking**: Instant PR and Last Set feedback.
- **Intense PR Celebrations**: Strobe flash and layered haptic feedback when you hit a new personal best.
- **Adjustable Rest Timer**: Fully customizable rest periods during and between sets.
- **Detailed History**: Expandable session logs with individual set deletion and grouping.
- **Dynamic Routine Management**: Add or remove exercises on the fly, even mid-session.
- **Light / Dark Toggle**: Brutalist inverted-palette light theme with OS preference detection and localStorage persistence.
- **Installable**: Full PWA support with service worker caching.

## 🛠 Tech Stack

- **Framework**: React 19 + TypeScript
- **State/Storage**: Dexie.js (IndexedDB)
- **Animations**: Framer Motion
- **Styling**: SCSS (Dart Sass) — tokens-first architecture with `@use`/`@forward`
- **Icons**: Lucide React (removed; brackets used as brutalist UI language)
- **PWA**: Vite PWA Plugin
- **Testing**: Vitest + @testing-library/react + fake-indexeddb

## 🎨 SCSS Architecture

All styling lives under `src/styles/` using a tokens-first, `@use`-based module system (no `@import`):

```
src/styles/
  _tokens.scss        — SCSS maps: $palettes, $type-scale, $space, $borders, $motion, $breakpoints
  _functions.scss     — Token accessor helpers: space(), type-scale(), palette(), px-to-rem()
  _mixins.scss        — Reusable mixins: bracket-label, invert-on-active, focus-ring,
                        brutalist-button, bp() breakpoints, heavy-numeral, screen-container
  _type.scss          — Typography: heading defaults, .numeral tabular font
  _base.scss          — CSS reset + element defaults with theme-transition
  _themes.scss        — Dark + light theme maps emitted as CSS custom properties
                        (:root = dark, [data-theme="light"] = light, OS-preference media query)
  main.scss           — @use entry point loading all partials in dependency order
  components/
    _globals.scss     — Shared utilities: .container, .label-bracket, .brutalist-button,
                        .screen-header, .input-field
    _landing.scss     — ScreenLanding: split tabs, routine name, actions, theme toggle
    _session.scss     — ScreenSession: nav, exercise header, inputs, log button, tab strip
    _timer.scss       — Rest timer screen (uses semantic --color-rest-bg/fg tokens)
    _history.scss     — ScreenHistory + SessionItem accordion
    _edit-routine.scss — ScreenEditRoutine: list, add block
    _pr-celebration.scss — PR strobe animation (mix-blend-mode:difference for both themes)
```

## 🌗 Light / Dark Theme

- Toggle via the `[light]` / `[dark]` button on the landing screen.
- First load: reads `prefers-color-scheme` OS preference.
- Subsequent loads: reads persisted choice from `localStorage`.
- Theming is pure CSS (`data-theme` on `<html>`) — zero JS style re-renders.
- Both themes maintain WCAG AA contrast ratios.

## 🚀 Getting Started

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/muhammedhazemx/mosh-pit-gym.git
    ```
2.  **Install dependencies**:
    ```bash
    npm install --legacy-peer-deps
    ```
3.  **Start development server**:
    ```bash
    npm run dev
    ```
4.  **Build for production**:
    ```bash
    npm run build
    ```

## 🧪 Tests

Run the full test suite (Vitest + @testing-library/react + fake-indexeddb):

```bash
npm test           # watch mode
npm run test:run   # single run (CI)
```

**Test coverage:**
- `db.test.ts` — Dexie CRUD: routines, session lifecycle, PR detection (new/equal/lower), set logging and deletion, history grouping by date.
- `timer.test.tsx` — Rest timer: countdown accuracy, pause/resume, skip, ±10s adjustments, floor-at-zero, natural completion.
- `theme.test.ts` — useTheme hook: OS preference detection, localStorage persistence, data-theme toggling, stored value override.

## ♿ Accessibility

- WCAG AA contrast in both themes.
- `:focus-visible` focus rings on all interactive elements (SCSS `focus-ring` mixin).
- ARIA labels, roles, and `aria-expanded` on accordion session items.
- Keyboard navigation: `Enter`/`Space` support on custom interactive elements.

## 📱 Mobile Installation

Open the deployed URL on your mobile browser (Chrome/Safari) and select **"Add to Home Screen"** for the full native experience.

---

*Raw energy logged locally.*
