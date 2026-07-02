# 🌌 Nebula

**An AI-Powered Personal Media Intelligence Platform**

[![Nebula CI](https://github.com/UdayPatnala/nebula/actions/workflows/ci.yml/badge.svg)](https://github.com/UdayPatnala/nebula/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-142%20passing-brightgreen)](https://github.com/UdayPatnala/nebula)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.1-646cff)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## What is Nebula?

Nebula is a personal media intelligence platform for transforming collections of photos and videos into interactive, story-driven galleries. Its workflow takes a user from media upload through analysis and review to gallery design, preview, and publication.

This repository contains the React and TypeScript frontend, including the complete product navigation, a five-stage analysis experience, gallery customization, a credit economy, five-tier role-based access control, administration tools, privacy settings, automated tests, CI, and container deployment support.

The current data layer is deliberately self-contained for development: authentication, projects, credits, notifications, and audit records are simulated and persisted in the browser with `localStorage`. The architecture is ready to replace those adapters with Firebase Authentication and Cloud Firestore for shared, persistent production data.

---

## Developer Preview

The app starts with a sample registered-user session so the complete product flow can be explored immediately. The current login form accepts a valid email-shaped value and creates a local preview session; it does not yet authenticate against a remote identity provider. Clear the site data in the browser to reset the seeded projects, credits, notifications, and session.

---

## Core Concepts

### The Upload → Analyse → Build → Publish Pipeline

```
  ┌──────────┐    ┌──────────────┐    ┌────────────────┐    ┌───────────┐
  │  Upload  │ →  │  AI Analysis │ →  │ Gallery Builder │ →  │  Publish  │
  │  Media   │    │  (5 stages)  │    │  (themes/layout)│    │  (public) │
  └──────────┘    └──────────────┘    └────────────────┘    └───────────┘
```

1. **Upload** — Drag-and-drop files into the upload queue. The system validates MIME types and enforces per-role size limits (100 MB for free users, 1 GB for premium). Uploads run concurrently with real-time progress bars.

2. **AI Analysis** — The product models a five-stage processing pipeline:
   - *Stage 1 — Metadata Extraction*: EXIF data, timestamps, geolocation, camera info.
   - *Stage 2 — Face Detection & Clustering*: Identifies faces and groups them across the collection.
   - *Stage 3 — Object & Scene Recognition*: Tags objects, scenes, and landmarks.
   - *Stage 4 — OCR & Caption Generation*: Reads text in images and generates natural-language captions.
   - *Stage 5 — Event Grouping & Timeline*: Clusters media into events by date, location, and visual similarity.

3. **Gallery Builder** — Choose a theme (Editorial, Cinematic, Mosaic, Timeline, Story), pick a layout (Grid, Masonry, Carousel, Film Strip, Full Bleed), toggle ambient music, and preview the result in real time.

4. **Publish** — The publication flow prepares a gallery for a shareable route and records the associated credit transaction.

---

### Credit Economy

Every meaningful operation on the platform costs credits. This creates a sustainable usage model:

| Operation | Credits |
|-----------|---------|
| AI Analysis (per project) | 10 |
| Gallery Publish | 5 |
| Premium Theme Unlock | 2 |
| Export Archive | 3 |
| Daily Check-in Reward | +5 |

Credits are tracked per user with a transaction ledger. Administrative adjustments are represented in the audit log with the actor, timestamp, action, and reason.

---

### Role-Based Access Control

The platform supports five user tiers, each inheriting the permissions of the tier below:

| Role | Key Capabilities |
|------|-----------------|
| **Visitor** | View public galleries, browse landing page |
| **Registered User** | Upload, AI analysis, gallery building, publish, credits |
| **Premium User** | Priority AI processing, gallery password protection, watermarking, expiration dates |
| **Administrator** | User management, content moderation, credit adjustments, audit logs, queue monitoring |
| **Super Administrator** | Global settings, admin management, full system control |

Permissions are defined as a flat set of 30+ granular capabilities (e.g. `upload_media`, `moderate_galleries`, `adjust_user_credits`) checked via `hasPermission(role, permission)`.

---

## Architecture

```
nebula/
├── src/
│   ├── api/            API client with typed endpoint methods
│   ├── components/     8 reusable UI primitives
│   │   ├── Avatar      User avatars with fallback initials
│   │   ├── Badge       Status indicators (success, error, warning, info)
│   │   ├── Button      Primary, secondary, ghost, destructive variants
│   │   ├── Card        Glass-morphism content containers
│   │   ├── Input       Form inputs with validation states
│   │   ├── Loader      Spinner and skeleton placeholders
│   │   ├── Modal       Dialog overlays with focus trapping
│   │   └── Skeleton    Content loading placeholders
│   ├── config/         RBAC rules, credit costs, feature flags, roadmap
│   ├── hooks/          Stateful logic (projects, uploads, gallery builder)
│   ├── layouts/        AppShell with sidebar navigation
│   ├── pages/          Page-level components for public, user, and admin routes
│   ├── providers/      Auth, Theme, and Notification context providers
│   ├── routes/         Centralised React Router route tree
│   ├── services/       Mock database with localStorage persistence
│   ├── styles/         Design tokens (variables.css, breakpoints.css)
│   ├── tests/          Vitest test suites
│   └── types/          TypeScript interfaces and type definitions
├── .github/workflows/  CI/CD pipeline (GitHub Actions)
├── Dockerfile          Multi-stage production container
├── nginx.conf          SPA routing, caching, security headers
├── vercel.json         Vercel SPA deep-link routing
├── vitest.config.ts    Test runner configuration
└── .env.example        Environment variable documentation
```

### Design System

The UI is built on a token-based design system defined entirely in CSS custom properties:

- **Theming**: Light and dark modes via `[data-theme]` attribute switching. Every colour, shadow, and glass effect adapts automatically.
- **Glassmorphism**: Frosted-glass surfaces using `var(--glass-bg)`, `var(--glass-border)`, and `var(--glass-blur)`.
- **Typography**: Outfit + Inter font stack with a 9-step size scale from `--font-size-display` (3.5rem) down to `--font-size-caption` (0.8125rem).
- **Spacing**: 8-step scale from `--spacing-xxs` (4px) to `--spacing-3xl` (64px).
- **Elevation**: 4-level shadow system (`--shadow-sm` through `--shadow-xl`) with separate dark-mode values.
- **Colour palette**: Primary (Deep Violet `#7c3aed`), Secondary (Sky Blue `#0284c7`), Accent (Rose `#db2777`), plus semantic success/warning/error/info tokens.

Shared components primarily use these design tokens so themes and responsive behavior remain consistent.

---

## Pages

| Route | Page | What It Does |
|-------|------|-------------|
| `/` | Landing | Public product introduction and entry point |
| `/login` | Login | Email/password authentication with validation |
| `/signup` | Sign Up | New account registration with role assignment |
| `/dashboard` | Dashboard | Project summary cards, quick actions, and credit balance |
| `/projects/:projectId/upload` | Upload | Drag-and-drop upload queue with progress tracking |
| `/projects/:projectId/analysis` | AI Processing | Five-stage pipeline stepper with a live activity log |
| `/projects/:projectId` | AI Review | Review of tags, face clusters, and timelines |
| `/projects/:projectId/gallery` | Gallery Builder | Theme and layout selection, preview, and publish flow |
| `/gallery/:shareId` | Public Gallery | Public gallery viewing route |
| `/credits` | Credits | Balance display, transaction history, entitlements |
| `/admin` | Admin | User table, moderation queue, audit log, credit adjustments |
| `/settings` | Settings | Privacy toggles, notification preferences, data export, account deletion |

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| **UI Framework** | React 19 | Concurrent features, excellent ecosystem |
| **Language** | TypeScript 6.0 | End-to-end type safety, `noUnusedLocals` strict mode |
| **Build Tool** | Vite 8.1 | Sub-second HMR, optimised production bundling |
| **Routing** | React Router 7 | Nested layouts, type-safe route params |
| **Styling** | Vanilla CSS + custom properties | Zero runtime cost, full design token control |
| **Testing** | Vitest 4.1 + V8 coverage | Native ESM, Vite-aligned, fast execution |
| **Linting** | oxlint | Rust-based, 50-100× faster than ESLint |
| **CI/CD** | GitHub Actions | Lint, type-check, test, build, container verification, and staging hook |
| **Planned backend** | Firebase Auth + Cloud Firestore | Managed identity and per-user persistent application data |
| **Container** | Docker (Node 20 Alpine → nginx 1.27 Alpine) | ~25 MB final image, non-root, HEALTHCHECK |

---

## Getting Started

### Prerequisites

- **Node.js** 20 or later
- **npm** 10 or later

### Quick Start

```bash
git clone https://github.com/UdayPatnala/nebula.git
cd nebula
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Scripts

```bash
npm run dev           # Start dev server with hot reload
npm run build         # TypeScript check + Vite production build
npm test              # Run all 142 tests
npm run test:watch    # Tests in watch mode
npm run test:coverage # Generate V8 coverage report
npm run lint          # Static analysis via oxlint
npm run preview       # Preview production build locally
```

### Environment Variables

Copy the example file and fill in your values:

```bash
# macOS/Linux
cp .env.example .env.local

# Windows PowerShell
Copy-Item .env.example .env.local
```

See [.env.example](.env.example) for the full list of configurable variables including API endpoints, feature flags (`VITE_FF_*`), and service credentials.

---

## Deploying on Vercel

Nebula is a Vite single-page application. The included [`vercel.json`](vercel.json) rewrites application routes to `index.html`, so refreshing a nested React Router URL works correctly.

### Deploy from GitHub

1. Push this repository to GitHub.
2. Sign in to [Vercel](https://vercel.com/) and choose **Add New → Project**.
3. Import `UdayPatnala/nebula`.
4. Keep the detected framework as **Vite**.
5. Confirm the build command is `npm run build` and the output directory is `dist`.
6. Add the Firebase variables from `.env.example` under **Project Settings → Environment Variables** for Production, Preview, and Development.
7. Select **Deploy**. Future pushes to `main` create production deployments, while other branches and pull requests create previews.

The same flow is available from the command line:

```bash
npm install --global vercel
vercel
vercel --prod
```

Vercel's official [Vite deployment guide](https://vercel.com/docs/frameworks/frontend/vite) covers framework detection, SPA rewrites, and CLI deployment.

---

## Connecting Firebase Authentication and Firestore

Firebase will replace the current browser-local `AuthProvider` and `mockDb` adapters. Use Cloud Firestore rather than Realtime Database for Nebula's user profiles, projects, transactions, notifications, and audit records because these entities map naturally to document collections.

### 1. Create and register the Firebase app

1. Create a project in the [Firebase console](https://console.firebase.google.com/).
2. Add a **Web app** from the project overview.
3. Install the modular SDK:

   ```bash
   npm install firebase
   ```

4. Copy the web configuration values into `.env.local` using the `VITE_FIREBASE_*` names listed in `.env.example`.
5. Add the same variables to Vercel. Firebase web configuration values identify the project but do not replace security rules; never place private service-account credentials in `VITE_*` variables.

### 2. Enable authentication

In Firebase, open **Authentication → Sign-in method** and enable **Email/Password**. The app integration should then:

- initialize `getAuth(app)`;
- create accounts with `createUserWithEmailAndPassword`;
- sign in with `signInWithEmailAndPassword`;
- restore sessions with `onAuthStateChanged`;
- sign out with `signOut`;
- store the Nebula role and profile fields in `/users/{uid}` rather than trusting a role selected by the browser.

See Firebase's official [web setup](https://firebase.google.com/docs/web/setup) and [password authentication](https://firebase.google.com/docs/auth/web/password-auth) guides.

### 3. Create Cloud Firestore

Open **Firestore Database**, create the database in the region nearest the expected users, and start with restrictive rules. A practical collection model is:

```text
users/{uid}
users/{uid}/projects/{projectId}
users/{uid}/transactions/{transactionId}
users/{uid}/notifications/{notificationId}
galleries/{galleryId}
auditLogs/{logId}
```

The first migration should replace `src/services/mockDb.ts` with Firestore functions based on `getDoc`, `getDocs`, `addDoc`, `setDoc`, `updateDoc`, and `deleteDoc`. Keep the React hooks and pages dependent on a small service interface so the UI does not need to know which database is in use.

### 4. Add security rules before production

Do not leave Firestore in test mode. At minimum, users should only access their own private documents:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null
                         && request.auth.uid == uid;

      match /{document=**} {
        allow read, write: if request.auth != null
                           && request.auth.uid == uid;
      }
    }
  }
}
```

Public gallery rules, administrator access, credit changes, and audit-log writes require narrower validation than this starter rule. Privileged actions should run in a trusted backend such as Firebase Cloud Functions, never from role claims supplied by the browser. Review the official [Firestore quickstart and security guidance](https://firebase.google.com/docs/firestore/quickstart) before enabling production traffic.

### 5. Finish the production hardening

- Add the Vercel production and preview domains under **Firebase Authentication → Settings → Authorized domains**.
- Enable a password policy and email-enumeration protection.
- Add Firebase App Check for abuse resistance.
- Test registration, login, logout, refresh persistence, per-user data isolation, and denied cross-user reads.
- Keep Firebase service-account keys and other server secrets outside the frontend and outside Git.

---

## Docker

```bash
docker build -t nebula:latest .
docker run -p 80:80 nebula:latest
```

The production image uses a two-stage build — Node 20 Alpine compiles the TypeScript and bundles assets, then the final stage copies only the `dist/` output into a minimal nginx 1.27 Alpine image. The container runs as a non-root `nebula` user and exposes a `/healthz` endpoint for orchestrator liveness probes.

---

## Testing

142 automated tests across two suites:

**`roles.test.ts`** (26 tests) — Business logic verification:
- Permission checks across all 5 roles and 30+ capabilities
- Upload size limit enforcement per role tier
- Storage quota scaling validation
- Credit cost constant correctness

**`selfVerification.test.ts`** (116 tests) — Repository health automation:
- Structural audit confirming 27 critical files exist
- Page completeness check for all 12 application pages
- No-placeholder policy (scans for TODO, FIXME, HACK, stub functions)
- Secrets scanning (detects hardcoded API key patterns)
- CI/CD pipeline configuration validation
- Design token integrity checks
- Dependency manifest verification

```
 ✓ src/tests/roles.test.ts (26 tests) 5ms
 ✓ src/tests/selfVerification.test.ts (116 tests) 22ms

 Test Files  2 passed (2)
      Tests  142 passed (142)
   Duration  379ms
```

---

## Security

- **RBAC** — 5-tier role hierarchy; admin routes gate on `administrator` or `super_administrator`
- **Input validation** — All form inputs validated before processing
- **Upload security** — MIME type checking + role-based size caps via `getMaxUploadSizeForRole()`
- **Audit logging** — Every administrative action (credit adjustments, moderation, user changes) logged with timestamp and actor ID
- **Security headers** — `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` set in nginx
- **Secrets management** — Zero credentials in source code; all secrets injected via environment variables
- **Container hardening** — Non-root user, minimal alpine base, no unnecessary packages

---

## Roadmap

| Phase | Focus | Status |
|-------|-------|--------|
| **1** | Interactive frontend — galleries, credits, RBAC, admin, tests | ✅ Complete |
| **2** | Firebase foundation — production auth, Firestore, Storage, secure rules | Next |
| **3** | AI Intelligence — Storytelling, NL search, highlight reels, narration | Planned |
| **4** | Enterprise — Organisations, SSO, compliance, multi-tenancy | Planned |
| **5** | Ecosystem — Public API, plugin marketplace, developer SDK | Planned |

Each future feature is registered as a feature flag in [`src/config/roadmap.ts`](src/config/roadmap.ts) and can be toggled at runtime:

```bash
VITE_FF_AI_STORYTELLING=true
VITE_FF_PREMIUM_TEMPLATES=true
```

---

## Project Structure Summary

| Count | Category |
|-------|----------|
| 12 | Application pages |
| 8 | Reusable UI components |
| 3 | Context providers |
| 4 | Custom hooks |
| 30+ | RBAC permissions |
| 142 | Automated tests |
| 5 | Product roadmap phases |
| 30 | Feature flags |

---

## License

Released under the [MIT License](LICENSE).

---

## Author

Patnala Uday Kumar — [GitHub](https://github.com/UdayPatnala)
