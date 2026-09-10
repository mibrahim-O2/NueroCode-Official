# NeuroCode — Final Pre-Deployment Fix Pass

All 16 items landed as individual commits pushed directly to `main`.
Working tree clean, `main` in sync with `origin/main`.

---

## PART 1 — FINAL REPORT (per item)

### Item 1 — Migration audit + `025_grant_admin_audit_logs.sql`
**Commit:** `fc59c36` — *Item 1: add migration 025 granting service_role on admin_audit_logs* — pushed ✅
**Files:** created `database/schema/025_grant_admin_audit_logs.sql`

Existing migrations confirmed present (NOT run):

| File | Contents |
|---|---|
| `database/schema/022_grant_roadmap_challenges.sql` | `grant select, insert, update, delete on public.roadmap_challenges to service_role;` |
| `database/schema/023_leaderboard_index.sql` | `create index if not exists idx_users_xp_desc on public.users(xp desc);` |
| `database/schema/024_submission_query_indexes.sql` | `create index if not exists idx_submissions_user_topic_created on public.submissions(user_id, topic, created_at desc);`<br>`create index if not exists idx_submissions_user_created on public.submissions(user_id, created_at desc);` |

New file `025_grant_admin_audit_logs.sql`:
```sql
grant select, insert, update, delete on public.admin_audit_logs to service_role;
```
Migration set is now `001`–`025` with no gaps.

---

### Item 2 — `PISTON_API` default → self-hosted
**Commit:** `8de1a77` — *Item 2: default PISTON_API to the self-hosted URL, not the public API* — pushed ✅
**Files:** `backend/app/config/settings.py`, `backend/.env.example`

- `settings.py`: `PISTON_API: str = "https://emkc.org/api/v2/piston"` → `PISTON_API: str = "http://localhost:2000/api/v2"`
- `.env.example`: `PISTON_API=` line set to `http://localhost:2000/api/v2`

---

### Item 3 — `frontend/.env.example` VITE_API_URL check
**Commit:** none (confirmation only, as instructed)
No `VITE_API_URL` is needed in `frontend/.env.example`. The only reader of that variable was `Dashboard.jsx`, and Item 4 removes it. The frontend uses `VITE_BACKEND_URL` (already documented) via `apiClient`. No change made.

---

### Item 4 — Route Dashboard analytics through `apiClient`
**Commit:** `3b9c151` — *Item 4: route dashboard analytics through the shared apiClient* — pushed ✅
**Files:** `frontend/src/services/profileService.js`, `frontend/src/pages/Dashboard.jsx`

- `profileService.js`: added
  `export const getUserCharts = () => apiClient.get('/profile/analytics/user-charts');`
- `Dashboard.jsx`: removed the local `getStoredToken` helper, the raw `fetch()` to
  `` `${VITE_API_URL || 'http://localhost:8000'}/profile/analytics/user-charts` ``, and the
  `VITE_API_URL` reference. Now imports and calls `getUserCharts()`, which goes through the
  shared `apiClient` (same token handling + `VITE_BACKEND_URL` base as every other request).
  Fallback-on-error behaviour (placeholder progression) preserved.

---

### Item 5 — Lazy Firebase Admin SDK init
**Commit:** `96ffd14` — *Item 5: initialize Firebase Admin SDK lazily, not at import time* — pushed ✅
**Files:** `backend/app/services/firebase_service.py` (rewritten)

- Module import no longer calls `credentials.Certificate(...)` / `initialize_app(...)`.
- New `_ensure_firebase_initialized()` runs on first `verify_id_token()` call, guarded by a
  module-level `_initialized` flag **and** `firebase_admin._apps`.
- A missing/invalid `FIREBASE_SERVICE_ACCOUNT_PATH` now raises a clear `HTTP 500` with the
  offending path in the detail — only when a login is attempted — instead of crashing app
  startup (health checks, docs, all other routes stay up).
- Invalid/expired tokens still raise `HTTP 401`.
- Confirmed sole caller: `auth_routes.py` `login` handler.

---

### Item 6 — Remove Test Mode from the backend entirely
**Commit:** `48de77b` — *Item 6: remove Test Mode backend entirely* — pushed ✅
**Files:**
- deleted `backend/app/routes/test_mode_routes.py`
- deleted `backend/app/schemas/test_mode_schemas.py`
- `backend/app/database/repositories.py` — removed the `# --- Test Mode ---` section (6 helpers:
  `set_roadmap_node_status`, `unlock_all_roadmap_nodes`, `complete_roadmap_through_position`,
  `set_user_stats`, `create_test_assessment_and_credential`, `clear_simulated_credentials`).
  Confirmed each was used only by `test_mode_routes.py`. `reset_student_roadmap` (separate
  section, shared with `admin_service.py`) was **kept**.
- `backend/app/main.py` — removed the `test_mode_routes` import, `app.include_router(test_mode_routes.router)`, and the `if settings.TEST_MODE:` startup-warning block.
- `backend/app/routes/__init__.py` — removed `test_mode_routes` from the import tuple and `__all__`.
- `backend/app/config/settings.py` — removed `TEST_MODE: bool = False` and reworded the group comment.
- `backend/.env.example` — removed `TEST_MODE=false` and its comment.
- `backend/app/services/assessment_service.py` — removed the `TEST_MODE_QUESTION` constant and
  the `if settings.TEST_MODE:` branch in `start_assessment` (fixed-question shortcut).

  > **Note:** the last three files (`assessment_service.py`, `routes/__init__.py`, `.env.example`)
  > were not enumerated in the item text but are strictly required — they read/exported
  > `TEST_MODE`/`test_mode_routes`, so `python -c "import app.main"` would fail without them.
  > Bundled into this one commit to keep the item self-contained and importable.

---

### Item 7 — Keystroke `MIN_SAMPLES` 6 → 9
**Commit:** `00ddfc4` — *Item 7: raise keystroke MIN_SAMPLES to 9 to match backend* — pushed ✅
**Files:** `frontend/src/hooks/useKeystrokeMonitor.js`

`const MIN_SAMPLES = 6;` → `const MIN_SAMPLES = 9;` with a comment explaining that N timestamps
yield N-1 intervals and the backend (`proctoring_service.py`) rejects samples with `< 8`
intervals, so the two values must stay in sync.

---

### Item 8 — Server-side interview timeout
**Commit:** `a9cca01` — *Item 8: enforce interview time limit server-side* — pushed ✅
**Files:** `backend/app/services/interview_service.py`, `backend/app/routes/interview_routes.py`

- `interview_service.py`: added `import datetime`, imported `_parse_timestamp` from repositories,
  added `GRACE_PERIOD_SECONDS = 60`. In `submit_interview`, after the status check:
  ```python
  started_at = _parse_timestamp(session["started_at"])
  elapsed = (datetime.datetime.now(datetime.timezone.utc) - started_at).total_seconds()
  time_limit = session.get("time_limit_seconds") or settings.INTERVIEW_DURATION_SECONDS
  if elapsed > time_limit + GRACE_PERIOD_SECONDS:
      raise TimeoutError("Interview time limit exceeded — this submission is too late to be graded.")
  ```
  Mirrors `assessment_service.submit_assessment`.
- `interview_routes.py`: added `except TimeoutError as exc: raise HTTPException(status_code=408, detail=str(exc))` to the submit handler (before the existing `ValueError → 400`).

---

### Item 9 — Remove real personal emails from `TeamSection.jsx`
**Commit:** `ff6f59a` — *Item 9: remove real personal emails from TeamSection* — pushed ✅
**Files:** `frontend/src/components/landing/TeamSection.jsx`

- Removed `email: 'mailto:mibrahimkhalid306@gmail.com',` from Muhammad Ibrahim's `links`.
- Removed `email: 'mailto:Alibaloch35400@gmail.com',` from Ali Mugheri's `links`
  (the file had `Alibaloch35400@…`, not the `Alibaseloch…` spelling in the task text).
- `SocialBadge` renders nothing for a missing `links` key, so the email icon simply
  disappears for those two members.
- `REPLACE_ARSAL_EMAIL@example.com`, `REPLACE_ALI_X`, and all other `REPLACE_*` placeholders
  left exactly as-is.

---

### Item 10 — Remove unused `ANTHROPIC_API_KEY` / `MODEL_NAME`
**Commit:** `1d56c73` — *Item 10: drop unused ANTHROPIC_API_KEY and MODEL_NAME settings* — pushed ✅
**Files:** `backend/app/config/settings.py`, `backend/.env.example`

Removed both fields from `Settings` and both lines from `.env.example`. Grep confirms zero
other references in `backend/app` (only stale `.pyc` files matched). No Claude provider exists.

---

### Item 11 — Remove unused `class-variance-authority`
**Commit:** `b869aad` — *Item 11: remove unused class-variance-authority dependency* — pushed ✅
**Files:** `frontend/package.json`, `frontend/package-lock.json`

Removed `"class-variance-authority": "^0.7.0"` (zero usages in `frontend/src`). Ran
`npm install` — lockfile updated, committed.

---

### Item 12 — Remove dead `/practice/:nodeId` route
**Commit:** `19224be` — *Item 12: remove dead /practice/:nodeId route* — pushed ✅
**Files:** `frontend/src/routes/AppRoutes.jsx`

Removed `<Route path="/practice/:nodeId" element={<Practice />} />`. `Practice.jsx` reads
`nodeId` only from `useSearchParams()` (`?nodeId=`), never `useParams`. Grep confirms nothing
links to the path form.

---

### Item 13 — Fix stale tree-sitter comment in `code_analysis.py`
**Commit:** `fd4a2fa` — *Item 13: correct tree-sitter comment to match reverted requirements* — pushed ✅
**Files:** `backend/app/ai/code_analysis.py`

Rewrote the top-of-module comment. It had claimed `requirements.txt` pins
`tree-sitter>=0.22` + per-language grammar packages as the active path. Reality:
`requirements.txt` is reverted to `tree-sitter==0.21.3` + `tree-sitter-languages==1.10.2`,
so the `except ImportError` fallback (`tree_sitter_languages.get_parser`) is what actually
runs. Comment now says the `try` block is the "newer layout kept working without a code
change" path and the fallback is normal.

---

### Item 14 — NO ACTION (report only)
No commit, no migration. Known low-priority, non-blocking doc inconsistencies in
`database/schema/021_roadmap_challenges.sql`:
- The header comment says "25-problem challenge pool" / "Array of 25 problems (12 Easy, 10
  Medium, 3 Hard)". The Challenge Gate service actually uses a **10-problem** pool
  (4 easy / 4 medium / 2 hard). Comment only — the column is `JSONB DEFAULT '[]'`, not
  constrained to any count.
- The table has a client-facing RLS policy (`auth.uid() = user_id`). The backend reaches this
  table only via the `service_role` key, which bypasses RLS, so the policy is never evaluated
  in practice. Harmless; left in place.

Neither blocks deployment.

---

### Item 15 — Remove the "Documentation" link
**Commit:** `6e73abd` — *Item 15: remove the Documentation link (Navbar + Footer)* — pushed ✅
**Files:** `frontend/src/components/landing/Navbar.jsx`, `frontend/src/components/landing/Footer.jsx`

- `Navbar.jsx`: removed the `DOCS_URL` constant, the desktop `<a>…Documentation</a>` in the
  `<nav>`, and the mobile `<a>…Documentation ↗</a>`.
- `Footer.jsx`: removed the `DOCS_URL` constant and the `<li>…Documentation ↗</li>` under
  "Project".
- No documentation content written. `docs/DOCUMENTATION.md` (empty placeholder) left untouched.

---

### Item 16 — `docs/SETUP_AND_DEPLOYMENT.md` corrections
**Commit:** `5d8f469` — *Item 16: fix Piston runtimes example + complete env var table* — pushed ✅
**Files:** `docs/SETUP_AND_DEPLOYMENT.md`

- (a) Step 6 `/runtimes` sample JSON: added
  `{ "language": "c++", "version": "10.2.0" }` alongside the existing `c` entry, matching what
  `piston_service.py` (`"c++"` 10.2.0) requests.
- (b) PISTON_API line already shows `http://localhost:2000/api/v2` — no change.
- (c) "Environment Variable Switch" table: added the missing backend vars — `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `GEMINI_API_KEY`, `FRONTEND_URL`,
  `FIREBASE_SERVICE_ACCOUNT_PATH`, `ADMIN_EMAIL`, `INTEGRITY_PASS_THRESHOLD`,
  `ASSESSMENT_DURATION_SECONDS`, `REVIEW_DUE_DAYS`, `INTERVIEW_DURATION_SECONDS`.
- (d) No `VITE_API_URL` reference exists in the doc — nothing to remove (grep confirmed).

---

## Post-change verification

| Check | Command | Result |
|---|---|---|
| Frontend build | `npm run build` (in `frontend/`) | ✅ exit 0 — `✓ built in 18m 04s`, 3271 modules, no errors (only the pre-existing "chunks > 500 kB" advisory) |
| Backend import | `backend/venv/Scripts/python.exe -c "import app.main"` | ✅ `import app.main OK` (exit 0) |

> The very first backend import attempt segfaulted while the 18-minute Vite build was still
> running (resource contention); an immediate re-run with the build finished succeeded cleanly.

### Commit summary

| Item | Commit | Item | Commit |
|---|---|---|---|
| 1 | `fc59c36` | 9 | `ff6f59a` |
| 2 | `8de1a77` | 10 | `1d56c73` |
| 3 | *(no commit — confirm only)* | 11 | `b869aad` |
| 4 | `3b9c151` | 12 | `19224be` |
| 5 | `96ffd14` | 13 | `fd4a2fa` |
| 6 | `48de77b` | 14 | *(no commit — report only)* |
| 7 | `00ddfc4` | 15 | `6e73abd` |
| 8 | `a9cca01` | 16 | `5d8f469` |

All commits pushed to `origin/main`.

---

# PART 2 — COMPLETE MANUAL TESTING PLAN

## Pre-flight setup

### 1. Database migrations (run in order, once, against the Supabase project)
Run any not-yet-applied migrations up to `025`. The ones added/confirmed in this pass:

| Order | File | Purpose | How to verify |
|---|---|---|---|
| 022 | `database/schema/022_grant_roadmap_challenges.sql` | `service_role` DML grant on `roadmap_challenges` | Challenge Gate start/submit works (no `permission denied`) |
| 023 | `database/schema/023_leaderboard_index.sql` | `idx_users_xp_desc` | `\d public.users` shows the index |
| 024 | `database/schema/024_submission_query_indexes.sql` | 2 submission indexes | `\d public.submissions` shows both |
| 025 | `database/schema/025_grant_admin_audit_logs.sql` | `service_role` DML grant on `admin_audit_logs` | Admin action that writes an audit row succeeds |

Run in the Supabase SQL editor (or `psql`), each file's contents as-is. They are all
idempotent (`grant`, `create index if not exists`).

### 2. Service start order (three real services, three terminals)

| # | Service | Directory | Command | Ready when |
|---|---|---|---|---|
| 1 | **Piston** (self-hosted code execution) | repo root | `docker compose up -d piston` (or the project's Piston compose) | `curl http://localhost:2000/api/v2/runtimes` returns a non-empty array containing `python` 3.12.0, `javascript` 20.11.1, `c++` 10.2.0 |
| 2 | **Backend** (FastAPI) | `backend/` | `venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000` | `GET http://localhost:8000/health` returns `{"status":"ok","piston":"connected", ...}` |
| 3 | **Frontend** (Vite) | `frontend/` | `npm run dev` | `http://localhost:5173` loads the landing page |

> Start Piston **before** the backend — `start_assessment` / `start_interview` /
> Challenge Gate all call `ensure_runtime_available("python")` and fail fast if Piston is down.

### 3. Environment files
- `backend/.env` — from `backend/.env.example`. Must set: `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `GEMINI_API_KEY`, `FIREBASE_SERVICE_ACCOUNT_PATH`
  (pointing to a valid service-account JSON), `ADMIN_EMAIL`. `PISTON_API` now defaults to the
  self-hosted URL so it can be left unset locally.
- `frontend/.env` — `VITE_BACKEND_URL=http://localhost:8000` plus the Firebase web config
  (`VITE_FIREBASE_*`). No `VITE_API_URL` needed.

### 4. Test accounts

| Role | How to create | Used for |
|---|---|---|
| **Student A** (fresh) | Sign up via the app with a Google account | roadmap/practice/challenge/interview/assessment/review/discussion happy paths |
| **Student B** (progressed) | Student A after completing ≥1 cluster, or seed `roadmap_nodes` to `completed` for one cluster's topics | assessment gating, credentials, teacher-comment target |
| **Educator** | Create a student, then in DB set `users.role = 'educator'` (or via admin UI) | educator dashboard, submission comments |
| **Admin** | Set `users.email` = the `.env` `ADMIN_EMAIL`, `users.role = 'admin'` | admin panel, provider switch, audit logs |

---

## Module A — Authentication

| # | Action | Expected result | Verifies |
|---|---|---|---|
| A1 | Click "Sign in with Google", complete Google popup | Redirect to `/dashboard`; `neurocode_token` in `localStorage`; `GET /auth/me` → `200` with user JSON | Core auth |
| A2 | `POST /auth/login` with a malformed `id_token` | `401` `{"detail":"Invalid or expired Firebase ID token"}` — **app still serves other routes** | **Item 5** (lazy Firebase, 401 path) |
| A3 | Temporarily point `FIREBASE_SERVICE_ACCOUNT_PATH` at a missing file, restart backend | Backend **starts normally**; `GET /health` → `200`; `GET /docs` loads | **Item 5** (no startup crash) |
| A4 | With that bad path, attempt a real login | `500` with detail naming `FIREBASE_SERVICE_ACCOUNT_PATH` and the bad path | **Item 5** (clear deferred error) |
| A5 | Restore the path, hit `/health`, then log in | Login works without a backend restart being required for other routes; first login triggers init | **Item 5** (lazy init on first use) |
| A6 | Call any protected endpoint with no `Authorization` header | `401` | Core auth middleware |

---

## Module B — Roadmap

| # | Action | Expected result | Verifies |
|---|---|---|---|
| B1 | Open `/roadmap` as Student A | `200`; first node(s) `available`, rest `locked`; XP/level header matches `/auth/me` | Core roadmap |
| B2 | Complete a topic's practice requirement, refresh | That node → `completed`, next → `available`; `GET /roadmap/me` reflects it | Core roadmap progression |
| B3 | `GET /roadmap/review-due` after completing a topic >7 days ago (or set `REVIEW_DUE_DAYS=0`) | Array with the completed topic + `days_since_completion` | Core spaced-review surfacing |
| B4 | Visit `/practice/anything-here` (old path param URL) | Route no longer matched → app 404 / redirect (NOT the Practice page) | **Item 12** |
| B5 | Visit `/practice?nodeId=<valid node>` | Practice page loads scoped to that node | **Item 12** (query param still works) |

---

## Module C — Practice

| # | Action | Expected result | Verifies |
|---|---|---|---|
| C1 | `/practice?topic=Arrays`, generate a problem | `200`; problem with title/description/examples/test cases | Core practice |
| C2 | Submit a correct Python solution | `200`; all test cases pass; XP awarded; submission row created | Core practice grading (Piston) |
| C3 | Submit a wrong solution | `200`; failing cases listed; no XP for pass; anti-pattern/complexity feedback where applicable | Core practice feedback |
| C4 | Submit C++ solution (`c++`) to a problem | Runs and grades correctly | Piston `c++` runtime (see Item 16 doc fix) |
| C5 | Stop Piston, try to generate/submit | Clear "code execution unavailable" style error, `502`/`503`; app doesn't hang | Core resilience |

---

## Module D — Challenge Gate

| # | Action | Expected result | Verifies |
|---|---|---|---|
| D1 | Start a challenge for an unlocked node | `200`; a 10-problem pool (4 easy / 4 medium / 2 hard); `roadmap_challenges` row `status='in_progress'` — **no `permission denied for table roadmap_challenges`** | **Item 1 / migration 022**, core challenge |
| D2 | Solve problems, advance | `current_index` / `solved_indices` update per submit | Core challenge |
| D3 | Meet the pass threshold | `status='passed'`; node checkpoint cleared | Core challenge |
| D4 | Fail enough problems | `status='failed'`; ret/retry path per UI | Core challenge |
| D5 | Start a challenge for a **locked** node | `4xx` "not unlocked" | Core gating |

---

## Module E — Mock Interview

| # | Action | Expected result | Verifies |
|---|---|---|---|
| E1 | `POST /interviews/start` `{topic, difficulty}` | `200`; question + `time_limit_seconds` (1800) + `started_at`; `interview_sessions` row `status='in_progress'` | Core interview |
| E2 | Submit a solution within the time limit | `200`; `results`, `complexity`, `time_taken_seconds`; session `status='completed'` | Core interview grading |
| E3 | In DB set the session's `started_at` to ~35 min ago, then `POST /interviews/{id}/submit` | `408` `{"detail":"Interview time limit exceeded — this submission is too late to be graded."}`; session stays `in_progress` | **Item 8** |
| E4 | Set `started_at` to exactly `now - 1800s + 30s` (inside grace), submit | `200` — accepted (60 s grace) | **Item 8** (grace window) |
| E5 | Submit an already-completed session | `400` "already been completed" (unchanged) | **Item 8** (ordering preserved) |
| E6 | `GET /interviews/mine` | List of the user's past sessions | Core interview history |

---

## Module F — Assessment + Proctoring

| # | Action | Expected result | Verifies |
|---|---|---|---|
| F1 | `GET /assessments/clusters` as Student B | Each cluster with `unlocked` / `passed` flags | Core assessment gating |
| F2 | `POST /assessments/start` for a fully-completed cluster | `200`; AI-generated question (no fixed "Sum of Two Numbers"); `duration_seconds` = 2700; `assessments` row `in_progress` | **Item 6** (no TEST_MODE fixed question), core |
| F3 | `POST /assessments/start` for an incomplete cluster | `403` "Cluster is not fully completed yet" | Core gating |
| F4 | Submit a passing solution within time, clean proctoring | `200`; `assessment_score >= 70`, `integrity_score` from `proctoring_logs`; credential issued (`silver`/`gold`/`platinum`) | Core assessment + credential |
| F5 | In DB set `created_at` to ~50 min ago, submit | `408`/`TimeoutError` "Assessment time limit exceeded" | Core assessment timeout (Item 8's mirror) |
| F6 | During an assessment, switch browser tabs 3× | 3 `tab_switch` rows in `proctoring_logs`; on submit `integrity_score = 100 - 15 = 85` | Core proctoring persistence + server scoring |
| F7 | Paste into the editor once + trigger a camera alert | `paste` (-8) and `camera_alert` (-10) recorded; score reflects server-side `INTEGRITY_EVENT_PENALTIES` | Core proctoring |
| F8 | Type continuously for ~30 s at a natural rhythm, then again in a very robotic fixed cadence | First batch: no `keystroke_alert` (or an honest read). Robotic batch of ≥8 intervals: `checkKeystrokeRhythm` posts and may flag; a batch with **<9 keystrokes in the 30 s window is not sent at all** | **Item 7** (needs ≥9 samples → ≥8 intervals; backend no longer silently rejects short samples) |
| F9 | Finish an assessment with `integrity_score` below `INTEGRITY_PASS_THRESHOLD` (60) | `assessments.status = 'flagged'`; no credential | Core integrity gating |

---

## Module G — Credentials

| # | Action | Expected result | Verifies |
|---|---|---|---|
| G1 | After F4, open `/credentials` | The new credential card with badge level + topics mastered | Core credentials |
| G2 | Open the public verify page for its ID | `200`; shows score, integrity, issue date; QR/PDF export works | Core verification |
| G3 | Verify a bogus credential ID | `404` / "not found" | Core verification |

---

## Module H — Official Solution

| # | Action | Expected result | Verifies |
|---|---|---|---|
| H1 | After solving a practice/challenge problem, open "Official Solution" | `200`; canonical solution + explanation shown only post-submission | Core solution gate |
| H2 | Request the solution before submitting | Blocked / hidden | Core solution gate |

---

## Module I — Spaced Review

| # | Action | Expected result | Verifies |
|---|---|---|---|
| I1 | With a due review present, load `/dashboard` | "Quick Review" banner naming the topic + days-ago; "Review Now" → `/practice?topic=…` | Core spaced review |
| I2 | Disable `show_review_reminders` in settings, reload | Banner suppressed | Core preference wiring |
| I3 | Complete the refresher | Review re-scheduled / cleared from `review-due` | Core review loop |

---

## Module J — Peer Discussion

| # | Action | Expected result | Verifies |
|---|---|---|---|
| J1 | Open a problem's discussion, post a comment | `200`; comment appears with author + timestamp | Core discussion |
| J2 | Reply to a comment | Threaded reply renders | Core discussion |
| J3 | Delete your own comment | Removed; others' comments not deletable | Core authorization |

---

## Module K — Teacher Comments

| # | Action | Expected result | Verifies |
|---|---|---|---|
| K1 | As Educator, open a student's submission, add a comment | `200`; `submission_comments` row; visible to that student | Core teacher comments |
| K2 | As the student, view the submission | Educator's comment shown | Core visibility |
| K3 | As an unrelated student, try to read it | `403` / not visible | Core authorization |

---

## Module L — Educator / Admin

| # | Action | Expected result | Verifies |
|---|---|---|---|
| L1 | Educator dashboard: list students | Roster with progress/XP | Core educator view |
| L2 | Educator: reset a student's roadmap | `roadmap_nodes` for that student reset; `reset_student_roadmap` still present and working | **Item 6** (this shared helper was deliberately kept) |
| L3 | Admin panel loads for the `ADMIN_EMAIL` account | `200`; non-admins get `403` | Core admin gating |
| L4 | Admin performs an audited action (e.g. provider switch with the passcode) | Action succeeds **and** an `admin_audit_logs` row is written — no `permission denied for table admin_audit_logs` | **Item 1 / migration 025** |
| L5 | Admin: switch AI provider with a wrong passcode | Rejected | Core provider-switch gating |
| L6 | Confirm there is **no** `/test-mode/*` route | `GET /test-mode/status` → `404`; not in `/openapi.json` | **Item 6** |
| L7 | `GET /openapi.json` | Loads; no `test_mode` paths/schemas; all other routers present | **Item 6** (nothing else broke) |

---

## Module M — Profile / Settings / Dashboard analytics

| # | Action | Expected result | Verifies |
|---|---|---|---|
| M1 | `/dashboard` loads for Student B | Heatmap, XP progression, "Practice Solved by Topic" all render from real data | **Item 4**, core dashboard |
| M2 | DevTools Network tab while dashboard loads | Request to `/profile/analytics/user-charts` carries the `Authorization: Bearer <neurocode_token>` header and uses the `VITE_BACKEND_URL` base (same as all other XHR) — **no** separate `http://localhost:8000` hard-coded call | **Item 4** (routed through `apiClient`) |
| M3 | Break the analytics endpoint (stop backend mid-load) or force a 500 | Dashboard still renders; console `warn`; placeholder "Joined → Today" progression shown | **Item 4** (fallback preserved) |
| M4 | Edit profile name / bio, save | `200`; `/auth/me` reflects it | Core profile |
| M5 | Toggle a preference (theme, review reminders), reload | Persists | Core settings |
| M6 | Landing page: header/nav | **No "Documentation" link** in the desktop nav or the mobile menu | **Item 15** |
| M7 | Landing page: footer "Project" column | Contains "Team" only — **no "Documentation ↗"** | **Item 15** |
| M8 | Landing "Team" section | Muhammad Ibrahim and Ali Mugheri cards show GitHub/LinkedIn/X/Facebook icons but **no email icon**; Arsal's card unchanged (still has its placeholder links) | **Item 9** |

---

## Module N — Config / Build / Infra sanity

| # | Action | Expected result | Verifies |
|---|---|---|---|
| N1 | Fresh `backend/.env` with `PISTON_API` unset, start backend, `GET /health` | `"piston":"connected"` — backend hit `http://localhost:2000/api/v2` by default | **Item 2** |
| N2 | `grep -rn "ANTHROPIC_API_KEY\|MODEL_NAME" backend/app` | No matches (source) | **Item 10** |
| N3 | `grep -rn "class-variance-authority" frontend/src` | No matches; `npm ls class-variance-authority` → not installed | **Item 11** |
| N4 | `cd frontend && npm run build` | Exit 0, no errors | Build sanity (Items 4, 9, 11, 12, 15) |
| N5 | `backend/venv/Scripts/python.exe -c "import app.main"` | `OK`, exit 0 | Import sanity (Items 5, 6, 8, 10, 13) |
| N6 | Read `code_analysis.py` top comment; check `backend/requirements.txt` | Comment now matches reality: `tree-sitter==0.21.3` + `tree-sitter-languages==1.10.2` pinned → `get_parser` fallback is the active path | **Item 13** |
| N7 | `curl http://localhost:2000/api/v2/runtimes` vs `docs/SETUP_AND_DEPLOYMENT.md` Step 6 | Doc's example JSON now lists `python`, `javascript`, `c`, **`c++`** — matches a real Piston response | **Item 16a** |
| N8 | `docs/SETUP_AND_DEPLOYMENT.md` env var table | Lists all 13 vars (2 original + 11 added); every one also appears in `backend/.env.example` or `frontend/.env` | **Item 16c** |
| N9 | `grep -rn "VITE_API_URL" frontend/src docs backend` | No matches anywhere | **Items 3, 4, 16d** |
| N10 | Review `database/schema/021_roadmap_challenges.sql` | "25 problems" comment + client RLS policy still present — documented as known non-blocking (Item 14), not changed | **Item 14** |
