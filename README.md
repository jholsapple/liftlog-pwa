# SetRitual 2.0

SetRitual is a local-first workout planner and training log. This branch preserves the working PWA while establishing shared boundaries for future iOS, Android, cloud sync, and AI Coach clients.

The PWA now includes Next Set Coach, an offline adaptive progression loop that
uses completed sets and Easy/Good/Hard feedback to recommend the next weight
and rep target. One-tap suggestion acceptance, exercise mastery, Coach XP, and
post-session debriefs are stored locally with the workout history.

## Run the current app

```sh
npm run dev
```

Then open <http://127.0.0.1:8765>.

## Verify the workspace

```sh
npm run check
```

## 2.0 structure

- `index.html`, `manifest.json`, `sw.js`: current production PWA and local Next Set Coach experience.
- `packages/core`: platform-independent workout models and summaries shared by web, iOS, and Android.
- `packages/coach-client`: client boundary used by any interface that talks to the Coach service.
- `services/coach-api`: server-only OpenAI boundary. API keys must never be included in a client build.
- `docs/architecture.md`: staged migration and mobile strategy.

The next implementation milestone is moving persistence behind the repository interfaces, then migrating screens one at a time without changing the stored workout history.
