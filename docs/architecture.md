# SetRitual 2.0 architecture

## Goals

1. Preserve the current offline-first experience.
2. Share workout rules and models across web, iOS, and Android.
3. Make cloud sync optional and explicit.
4. Keep OpenAI credentials and coaching instructions on a trusted server.
5. Allow the same workout history to power an in-app Coach and a future ChatGPT companion.

## Target shape

```text
Web PWA ───────┐
iOS app ───────┼── Shared core ── Local repository
Android app ───┘                       │
                                      └── Optional sync API/database
                                                   │
                                                   └── Coach API ── OpenAI Responses API
```

The current PWA remains the runnable product while code moves behind these boundaries incrementally.

## Data ownership

- A completed workout is the source of truth, not a generated coaching message.
- Every stored object has a schema version and stable ID.
- Local writes complete before sync begins.
- Sync failures never prevent finishing a workout.
- AI access is opt-in. A user can review the exact data being sent.
- Coaching responses are guidance, not medical diagnosis.

## Mobile direction

Use a shared TypeScript/JavaScript core with a native application shell. React Native with Expo is the preferred first evaluation because it can share domain and service packages while still using native navigation, secure storage, notifications, and app-store builds. Capacitor remains a fallback if preserving the HTML interface proves more valuable than native controls.

Do not choose the final shell until the core repository and workout-session logic are extracted and tested; that keeps the choice reversible.

## Migration milestones

### 1. Foundation — started

- Create the v2 branch and workspace.
- Define versioned workout records.
- Define local/sync repository contracts.
- Define a platform-neutral Coach client.
- Add a server-only Coach endpoint.

### 2. Storage extraction

- Migrate `liftlog_state` into a versioned repository.
- Add migration tests using real v1 backup fixtures.
- Prefer IndexedDB on web and SQLite on mobile.
- Retain JSON export and restore.

### 3. Screen extraction

- Move calculations, plan generation, and workout-session rules into `packages/core`.
- Replace inline event handlers with screen controllers.
- Keep visual parity throughout the migration.

### 4. Private sync

- Add authentication and per-user authorization.
- Add append-safe workout synchronization.
- Add conflict handling for plan edits.
- Add account deletion and data export.

### 5. Coach

- Add explicit Coach consent and sharing controls.
- Generate a post-workout review only after the workout is safely stored.
- Add an ongoing conversation with relevant workout history.
- Add a weekly check-in and progress summary.
- Require confirmation before a coach changes a plan.

### 6. Native apps

- Add the chosen iOS/Android shell.
- Use secure device storage for tokens.
- Add background sync and optional notifications.
- Complete accessibility, offline, and app-store privacy reviews.
