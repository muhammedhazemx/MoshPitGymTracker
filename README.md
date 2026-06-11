# MOSH PIT GYM

A brutalist, offline-first PWA for tracking gym workouts. Bold typography, high contrast, and all your data stored locally on your device.

## Features

- **Offline-first** — all data lives on-device via IndexedDB (Dexie.js)
- **Dynamic splits** — Push/Pull/Legs, Upper/Lower, Full Body, or custom
- **Step-by-step set logging** with instant PR and last-set feedback
- **PR celebrations** — strobe flash + haptics (with a reduced-motion path)
- **Adjustable rest timer** between and during sets
- **Expandable history** with per-set deletion and date grouping
- **Mid-session editing** — add or remove exercises on the fly
- **Light / dark themes** — OS-preference detection + localStorage persistence
- **Installable PWA** with service-worker caching

## Tech Stack

- **Framework:** React 19 + TypeScript + Vite
- **Storage:** Dexie.js (IndexedDB)
- **Styling:** SCSS (Dart Sass) — tokens-first `@use`/`@forward` architecture
- **Animation:** Framer Motion
- **PWA:** Vite PWA Plugin
- **Icons:** none — custom monospace `[bracket]` UI language
- **Testing:** Vitest + Testing Library + fake-indexeddb (31/31 passing)

## Getting Started
