# Production Planning — v1 Design

**Date:** 2026-08-11
**Status:** Approved
**Repo:** https://github.com/WayamAI/Production_Planning (currently empty; this is the initial build)

## Summary

Build the first deployable version of Wayam AI's Production Planning app: a branded login
page (demo/mock authentication) followed by a dashboard for managing production orders and
viewing them on a simple schedule/timeline. Ships to Vercel.

## Goals

- Orange-themed UI using the real Wayam AI brand assets (logo, favicon, gradient).
- A login page that accepts any Gmail-shaped email + any non-empty password (demo auth, no
  real backend/identity provider).
- A core production-planning workflow: create, list, edit, and track production orders with
  a status and a scheduled date, visible both as a list and on a simple calendar/timeline.
- Deployed to Vercel on a working URL.
- Incremental GitHub commits as pieces land, not one giant commit at the end.

## Non-Goals (v1)

- Real user accounts, password storage, or an identity provider — this is a demo login only.
- A real backend database — data is seeded mock data persisted in `localStorage`.
- Multi-user collaboration, roles/permissions, inventory/materials planning, reporting —
  future slices, not v1.

## Architecture

- **Framework:** Next.js (App Router), TypeScript.
- **UI:** shadcn/ui + Tailwind CSS, configured with the orange brand palette below.
- **State/persistence:** React state + `localStorage` for orders and session; a seed script
  populates a handful of sample orders on first load if none exist.
- **Auth:** Client-side mock auth. Login form validates email looks like `*@gmail.com`
  (simple regex) and password is non-empty, then writes a session flag to `localStorage`
  and redirects to `/dashboard`. A route guard (client component / middleware check)
  redirects unauthenticated visitors from `/dashboard` back to `/login`. A logout action
  clears the session flag.
- **Deployment:** Vercel, using the Next.js zero-config preset.

## Brand Assets

Source files (already provided, in `AIDLC Wayam All assets/`):
- `Logo Main (Light) - Wayam AI.svg` — dark wordmark, for light backgrounds.
- `Logo Main (Dark).svg` — white wordmark, for dark backgrounds / dark mode.
- `fav icon.svg` — square icon mark, used as the favicon and app icon.

These get copied into the new project's `public/` (or `src/assets/`) directory and referenced
by a `<Logo />` component that picks light/dark variant based on the active theme.

**Palette** (from the logo's own gradient stops):
- Primary orange gradient: `#FFA12B → #FA8D23 → #F0731A → #DC440C`
- Accent/dark text: `#161C26`
- These become the Tailwind `primary` scale; shadcn's default neutral scale stays for
  surfaces/borders so text stays readable in both light and dark mode.

## Pages / Components

- `/login` — centered card: logo, email field, password field, submit button, inline
  validation error ("Enter a valid Gmail address" / "Password required"). Orange gradient
  accent on the primary button and a subtle branded background.
- `/dashboard` (protected) — top nav with logo + logout button. Two views toggled by tabs:
  - **List view:** table of production orders (name, status badge, scheduled date, actions).
  - **Timeline/calendar view:** orders plotted by their scheduled date on a simple calendar
    grid (a lightweight custom component, not a heavy calendar library).
  - "New order" button opens a form (name, quantity, scheduled date, status) — create/edit
    in a dialog, delete with confirmation.
- Order status values: `Pending`, `In Progress`, `Done` — shown as colored badges (orange
  gradient scale reused for status emphasis, not literal traffic-light colors).

## Data Model

```ts
type OrderStatus = "pending" | "in_progress" | "done";

interface ProductionOrder {
  id: string;
  name: string;
  quantity: number;
  scheduledDate: string; // ISO date
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}
```

Stored under a single `localStorage` key as a JSON array; a small data-access module
(`lib/orders.ts`) wraps get/create/update/delete so components never touch `localStorage`
directly, and seeds ~5 sample orders on first run.

## Error Handling

- Login: inline field errors, no crash on bad input, no network calls to fail.
- Orders: form validation (name required, quantity > 0, date required) before save;
  `localStorage` read/write wrapped in try/catch with a toast on failure (e.g. storage
  disabled/full) rather than a hard crash.

## Testing

- Unit tests (Vitest, matching this repo's existing convention) for `lib/orders.ts`
  (create/update/delete/seed logic) and the login validation function.
- No e2e/browser tests in v1 — keep scope tight; can add Playwright later if needed.

## Deployment & Git Workflow

- Work happens on a feature branch, small commits per logical piece (scaffold → branding →
  login → dashboard/orders → tests → deploy config), pushed to
  `https://github.com/WayamAI/Production_Planning`.
- Final step: connect the repo to Vercel (or run `vercel --prod` once linked) and confirm the
  deployed URL loads and the login → dashboard flow works end-to-end.
