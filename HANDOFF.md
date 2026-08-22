# Reel Eats — Engineering Handoff

| | |
|---|---|
| **Last updated** | 2026-08-22 |
| **Baseline commit** | `9c39a4d` on `main` |
| **Status** | Feature-complete core pipeline; pre-launch. Not yet publicly deployed. |
| **Author** | @kelly8hu (solo) |

Read this before touching the code. It covers what works, what doesn't, what will bite
you, and what to do next — in that order.

---

## 1. Where the project stands

The core loop works end to end: **share an Instagram Reel → get a structured recipe in
~30 seconds → it's saved to your account.** That path is built, tested, and stable.

What's real and working:

| Area | State | Notes |
|---|---|---|
| Scrape → transcribe → extract → save pipeline | ✅ Working | `server/src/routes/recipes.ts:126` (`processJob`) |
| Async job model (202 + polling) | ✅ Working | Job rows persist status; client polls every 2s |
| Auth (Supabase magic link → JWT) | ✅ Working | `server/src/middleware/requireAuth.ts` |
| Recipe CRUD (list, read, delete) | ✅ Working | No update/edit endpoint by design |
| Duplicate detection | ✅ Working | Same user + same URL → 409 with existing recipe |
| Thumbnail re-hosting | ✅ Working | `server/src/services/storage.ts` |
| PWA install + share target | ✅ Working | `client/public/manifest.json` |
| Server test suite | ✅ 48 passing | Runs offline in <1s, all externals mocked |
| Mood-based recommendations | ⚠️ UI stub | Local state only, nothing persisted |
| Pantry filtering | ⚠️ UI stub | Local state only, shows "coming soon" copy |
| CI | ❌ None | No workflows exist |
| Client tests | ❌ None | Vitest is configured but zero test files |
| Public deployment | ❌ Not live | Vercel/Railway config exists, not yet launched |

**Most recent work (this session):** added `README.md` only — no application code was
touched. Commits `7ce620c` and `9c39a4d`.

---

## 2. Getting productive in 15 minutes

**You will need accounts/keys for:** Supabase, Anthropic, Apify, Replicate. The pipeline
cannot run end to end without all four. Everything else runs offline.

```bash
npm install
cp .env.example .env              # fill in server keys
cp .env.example client/.env.local # fill in the two VITE_ vars
supabase db push                  # apply migrations
just dev                          # client :5173, server :3000
just test                         # 48 tests, no network needed
just check                        # lint + typecheck, both packages
```

**Read the code in this order** — it's the fastest path to understanding the system:

1. `shared/src/schemas.ts` — the `Recipe` shape everything else agrees on. Start here.
2. `server/src/routes/recipes.ts` — the HTTP surface, then `processJob` at the bottom.
   This one function *is* the product.
3. `server/src/services/` — one file per pipeline stage: `scraper` → `whisper` → `ai` →
   `db`, plus `storage`. All business logic lives here; routes stay thin.
4. `client/src/pages/Home.tsx` — submit, poll, and the share-sheet entry path.

The `README.md` has architecture and sequence diagrams if you want the picture first.

---

## 3. Known issues, in priority order

### 🔴 P0 — Fix before any public deployment

**Unauthenticated dev routes are live in the router.**
`server/src/routes/index.ts:11-32` exposes `POST /api/test-pipeline` and
`GET /api/test-pipeline/:jobId`. They bypass `requireAuth` entirely and write against a
hardcoded `TEST_USER_ID`. They are also *not* covered by the 10/user/hour recipe limiter
— only the global 100/IP/15min.

Why this matters beyond the auth hole: **every pipeline run costs real money** (one Apify
actor run + one Whisper `large-v3` run + one Claude call). An open endpoint is a direct
line to your API budget. Delete both routes and the `TEST_USER_ID` constant.

### 🟠 P1 — Fix soon

**No CI.** `.github/` has a PR template but no workflows. The 48-test suite runs offline
in under a second and is the cheapest possible safety net — wire it to run on push.
`just check && just test` is the whole job.

**In-flight jobs are lost on restart or deploy.** `processJob` is fire-and-forget in
memory. Deploy while a job is running and the user sees a row stuck in `processing`
forever — there's no timeout, no retry, no reaper. Cheapest partial fix: a startup
sweep that marks stale `processing` rows as `failed`. Real fix: a durable queue, which
is probably not worth the infrastructure yet.

**No client-side tests.** Vitest is configured in `client/package.json` and there are
zero test files. The polling state machine in `Home.tsx:57-69` is the highest-value
thing to cover — it has five states and drives the whole perceived UX.

### 🟡 P2 — Cleanup / tech debt

**`APIFY_API_KEY` vs `APIFY_API_TOKEN`.** `.env.example` declares both; the code reads
only `APIFY_API_TOKEN` (`server/src/services/scraper.ts:7`). Collapse to one name — this
will waste someone's afternoon eventually.

**Defensive `health_notes` flattening.** `shared/src/schemas.ts:31-40` preprocesses
nested arrays to undo a data bug caused by migration `002`. Migration `004` already
repaired the stored rows, so this is belt-and-braces on a fixed problem. Leave it if
production data is uncertain; remove it once you've confirmed the table is clean.

**Dead pantry state.** `client/src/pages/Recipes.tsx:44` holds `pantryOnly`, which
toggles a "coming soon" card rather than filtering anything. Fine as a stub — just don't
mistake it for a wired feature.

**Uncommitted working tree.** Deliberately left dirty as of this handoff:
- `CLAUDE.md` — modified by the `claude-md-sync` pre-commit hook. Note this hook rewrites
  the file on *every* commit, so it will keep reappearing as modified.
- `server/Dockerfile` — deleted locally, not committed. Safe: `railway.toml` builds from
  the **root** `Dockerfile`, so the server-level one is redundant.
- `TECHNICAL_DESIGN.md` — untracked. The README's references to it were removed in
  `9c39a4d`; if you commit the file, consider linking it back.

---

## 4. Gotchas that aren't obvious from the code

These were learned the hard way. Don't re-derive them.

- **`processJob` must never be awaited.** It's called with `void` and keeps running after
  the response is sent. This single fact is why the server runs always-on on Railway
  instead of serverless — a serverless container would freeze or kill it mid-flight.
  Do not "fix" the floating promise.
- **Instagram CDN thumbnail URLs are signed and expire.** Saved recipes silently lost
  their images days later. Hence `storage.ts` re-hosting every thumbnail to Supabase
  Storage, and the `thumbError` fallbacks in the client.
- **Instagram blocks server-side hotlinking.** `storage.ts:19` spoofs a browser
  `User-Agent`. If thumbnails start 403ing, look there first.
- **Claude returns numbers as strings sometimes.** `RecipeSchema` uses `z.coerce` on every
  numeric field for exactly this reason. Don't swap them back to `z.number()`.
- **Claude is explicitly told to estimate, never emit `<UNKNOWN>`.** A blank quantity makes
  a recipe useless in a kitchen. This is a deliberate product call in the prompt at
  `server/src/services/ai.ts:72` — it's not a bug that the model guesses.
- **Whisper failure is non-fatal by design.** Wrapped in its own try/catch; the pipeline
  degrades to caption + Apify transcript rather than losing the recipe.
- **The extraction schema is defined twice** — once as the Anthropic tool `input_schema`,
  once as zod. They must be changed together. This duplication is intentional (constrain
  at generation time, validate after) but it's a real footgun.
- **`app.set('trust proxy', 1)`** is required for correct IP detection behind Railway.
  Removing it silently breaks rate limiting.

---

## 5. Suggested next steps

Sequenced so each step de-risks the next:

1. **Delete the dev test routes.** (P0 above.) Ten-minute change, closes an auth hole and
   a spending hole.
2. **Add CI** running `just check && just test` on push. Cheap, and it protects
   everything that follows.
3. **Ship it publicly.** The config exists for both Vercel and Railway; nothing technical
   is blocking a deploy. Remember to set `CORS_ORIGIN` to the real Vercel URL.
4. **Add screenshots and a live demo link to the README.** Deliberately left out — the
   README is otherwise complete and structured for both recruiters and engineers. Three
   phone captures (share sheet → processing → recipe detail) plus the URL would close the
   last real gap in it.
5. **Handle stale jobs.** A startup sweep marking orphaned `processing` rows as `failed`
   is a few lines and removes the worst user-visible failure mode.
6. **Then pick a feature.** Pantry filtering is the more defensible one — the ingredient
   data model already supports it, and it's a genuine reason to open the app when you
   aren't saving something. Mood-based recommendations need a recommendation strategy
   that doesn't exist yet.

---

## 6. Things I'd push back on

Handing off honestly, these are the calls worth revisiting:

- **Estimated quantities are unmarked in the UI.** The extractor invents amounts when the
  creator didn't say them, which is the right product call — but nothing distinguishes
  "the creator said 1 tbsp" from "the model guessed 1 tbsp." A subtle marker would be
  more honest and costs little.
- **`shared/` is imported but its schemas are re-validated at three layers.** That's
  deliberate defense in depth, but if extraction ever feels slow, that's a place to look
  before blaming the model.
- **No recipe editing.** Users will want to fix a wrong quantity. Right now their only
  option is delete and re-scrape, which costs another full pipeline run.
