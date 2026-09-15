# Demo Mode — Manual Test Plan

Run these in order. "Owner" is the account whose email matches `OWNER_EMAIL`. "Student" is any other account. Backend
at `http://localhost:8000`, frontend at `http://localhost:5173`.

## 0. Prerequisites

| # | Step | Expected |
|---|---|---|
| 0.1 | Apply migrations `026`–`035` in the Supabase SQL editor, in order. | Each runs without error. |
| 0.2 | Set `OWNER_EMAIL` and `DEMO_MODE_PASSCODE` in `backend/.env`, restart the backend. | No "Insecure or missing settings" warning mentioning either setting. |
| 0.3 | Start Piston; run `cd backend && python -m app.demo.verify_demo_content`. | Ends with `78/78 checks passed` and `ALL DEMO CONTENT VERIFIED`. |
| 0.4 | **Baseline for §8:** as the owner (Demo Mode off), note XP, level, streak, the real roadmap state, the number of real submissions and credentials, and the real leaderboard. | Values recorded. |

## 1. Activating Demo Mode as the owner

| # | Step | Expected |
|---|---|---|
| 1.1 | Log in as the owner → Administration. | A **Demo Mode** section is visible with a grey toggle, a disabled **Exit Demo** button and nine reset buttons. |
| 1.2 | Flip the toggle. | Passcode modal "Demo Mode Verification" opens. |
| 1.3 | Enter a wrong passcode. | "Incorrect passcode." shown; Demo Mode stays off. |
| 1.4 | Enter the correct passcode. | Toggle turns green, shows "On"; Topbar shows a **Demo Mode** badge; name shows **mibrahim-O2** with the NeuroCode logo. |
| 1.5 | Exit Demo, then flip the toggle on again in the same tab. | No passcode prompt the second time. |
| 1.6 | Close the tab, reopen the app, flip the toggle on. | Passcode prompt appears again (once per session). |
| 1.7 | Dashboard greeting, Topbar and Profile page. | All show mibrahim-O2; Profile shows "Profile editing is paused…" instead of the edit form. |

## 2. A non-owner cannot see or use Demo Mode

| # | Step | Expected |
|---|---|---|
| 2.1 | Log in as a student. | No Demo Mode badge anywhere; the student can't reach Administration at all. |
| 2.2 | Make another account admin; log in as it → Administration. | No Demo Mode section. |
| 2.3 | With the student's token (DevTools → Local Storage → `neurocode_token`): `curl -H "Authorization: Bearer <token>" http://localhost:8000/demo/status` | `403 {"detail":"Demo Mode is only available to the project owner."}` |
| 2.4 | Repeat 2.3 for `POST /demo/toggle`, `POST /demo/roadmap/reset`, `GET /demo/cohort/overview`, `POST /demo/practice/submit` with `{}`. | All `403` — even the malformed body is rejected as 403, not 422. |
| 2.5 | `curl http://localhost:8000/demo/status` with no token. | `403`. |
| 2.6 | Temporarily blank `OWNER_EMAIL`, restart, try 2.3 with the **owner's** token. | `403` — an unset owner locks everyone out. Restore the value afterwards. |

## 3. Full student journey (run-of-show order)

| # | Step | Expected |
|---|---|---|
| 3.1 | Roadmap. | 5 topics: Arrays (active), Strings, Two Pointers, Sliding Window, Hash Maps (locked). Note about the 10-topic real roadmap is shown. |
| 3.2 | Assessment page. | Both assessments locked, each showing its unlock requirement. |
| 3.3 | Try `POST /demo/assessments/assessment_1/start` via curl as owner. | `403` with "This assessment is locked…". |
| 3.4 | Complete topics until Arrays and Strings are both completed. | Each completion shows "+50 XP"; real XP rises by the same amount. Assessment 1 unlocks. |
| 3.5 | Take Assessment 1 with the correct solutions (§5 covers integrity). | Passed; earned tier shown. |
| 3.6 | Roadmap → Two Pointers → Take Challenge Gate. Submit a wrong solution. | Real failing test results. |
| 3.7 | Solve all 3 questions. | "Mastery gate passed"; Two Pointers completed (+100 XP); Assessment 2 unlocks. |
| 3.8 | Take Assessment 2. | Passed. |
| 3.9 | Mock Interview with topic `Arrays`; then try topic `Graphs`. | Arrays starts the fixed question; Graphs is refused with "Demo interview topics are: Arrays, Strings, Hash Maps." |
| 3.10 | My Submissions. | The example submission shows a "Demo Educator" comment. |

## 4. The anti-pattern reorder actually fires

| # | Step | Expected |
|---|---|---|
| 4.1 | Reset Roadmap. Roadmap shows Hash Maps last. | ✓ |
| 4.2 | Practice → topic `Arrays`, `easy` → Generate until **First Repeated Reading**. Submit the Python **wrong** solution from `docs/demo.md`. | 1/5 tests pass; Code Analysis lists the linear membership check; "We moved Hash Maps earlier in your roadmap…" appears. |
| 4.3 | Open Roadmap. | Hash Maps is now **second**, directly after Arrays; Strings/Two Pointers/Sliding Window each moved down one. |
| 4.4 | Submit the Python **correct** solution. | 5/5 pass; no anti-patterns; roadmap unchanged. |
| 4.5 | Submit the JavaScript wrong solution. | Tests fail but no reorder (anti-pattern detection is Python-only). |
| 4.6 | **Regression, real mode:** Exit Demo; in real Practice submit any correct Python solution that uses a plain `for` loop. | No "linear membership check" warning (the detector fix). |

## 5. Proctoring genuinely detects a live tab switch

| # | Step | Expected |
|---|---|---|
| 5.1 | Start a demo assessment. | Inline "How to test integrity signals" guide is visible. |
| 5.2 | Switch to another tab and back. | Log feed shows "Tab switch", live integrity badge drops by 5. |
| 5.3 | Paste 30+ characters into the editor. | "Large paste" logged, badge drops by 8. |
| 5.4 | In Supabase: `select event_type from demo_proctoring_logs where attempt_id = '<attempt id>'`. | Rows for exactly the events triggered. |
| 5.5 | Trigger enough events to go below 60 (e.g. cover the camera repeatedly), submit correct solutions. | Result "Not Passed" with the low integrity score; `demo_assessment_attempts.status = 'flagged'`. |
| 5.6 | Send `POST /demo/assessments/<id>/submit` with an extra `"integrity_score": 100` in the body. | Score still computed from the logs; the client value is ignored. |
| 5.7 | Check the real `proctoring_logs` and `assessments` tables. | No new rows. |

## 6. The demo credential's verify link

| # | Step | Expected |
|---|---|---|
| 6.1 | Credentials → pick tier → Issue Demo Credential → View Certificate. | Certificate shows mibrahim-O2. |
| 6.2 | Copy Verification Link. | URL is `/demo/verify/<uuid>`, not `/verify/<uuid>`. |
| 6.3 | Open it in a private window (logged out). | "This is a demo credential" notice with a Join NeuroCode button; no scores or names. |
| 6.4 | Open `/verify/<same uuid>` (the real page). | "Credential not found". |
| 6.5 | Scan the QR code on the certificate. | Opens the demo notice page. |

## 7. Each reset clears only its own scope

Before this section, create data in every module: complete 2 topics, one practice submission, one discussion post, one
challenge question solved, one interview, one assessment attempt, one issued credential. After each reset, check the
listed page and confirm **everything else is still there**.

| Reset | Should clear | Must remain |
|---|---|---|
| Dashboard | XP drops by exactly the XP demo topics awarded; level recalculated. | Demo roadmap progress, streak, all other demo data. |
| Roadmap | Demo topics back to Arrays-only, Hash Maps last. | XP, challenge progress, submissions, attempts, credentials. |
| Practice | Discussion posts made by mibrahim-O2. | Seeded example comments, submissions. |
| Challenge Gate | Challenge solved state. | The Two Pointers roadmap node's completion. |
| Mock Interview | Demo interview sessions. | Everything else. |
| My Submissions | Graded demo submissions + comments; example submission re-created. | Discussion posts, dashboard heatmap from other data. |
| Assessment | Demo attempts and proctoring logs. | Issued demo credentials. |
| Credentials | Issued demo credentials. | Assessment attempts. |
| Cohort | Demo Student A/B/C roadmap/XP reset then restored to 4/2/7 completed topics; audit log shows `reset_full_student`. | All of the owner's demo data. |

For every row, also confirm the owner's **real** roadmap, submissions, assessments and credentials are unchanged.

## 8. Real account data is untouched by toggling

| # | Step | Expected |
|---|---|---|
| 8.1 | Toggle Demo Mode on, do nothing, toggle off. Compare with the §0.4 baseline. | Identical: XP, level, streak, real roadmap, submissions, credentials. |
| 8.2 | Toggle on, complete demo topics and take demo assessments, toggle off. | Real roadmap, submissions, assessments, credentials unchanged. XP is higher by exactly the demo-awarded amount (XP is real by design). |
| 8.3 | Toggle on → **Reset Dashboard** → toggle off. | XP and level back to the §0.4 baseline. |
| 8.4 | In Supabase, compare `users.preferences` before and after. | Only `demo_*` keys added/changed; every other preference identical. |
| 8.5 | Real Practice, real Dashboard, real Assessment page with Demo Mode off. | Behave exactly as before; no demo problems, demo credentials or demo roadmap visible. |

## 9. Demo Student A/B/C never appear in real views

Check each item **with Demo Mode off, and again with it on**, logged in as the owner and as an educator.

| # | Where | Expected |
|---|---|---|
| 9.1 | Roadmap page leaderboard (Demo Mode off). | No Demo Student A/B/C. |
| 9.2 | `GET /leaderboard/` | No `@example.com` accounts. |
| 9.3 | Educator Portal → Student Progress and Class Leaderboard (Demo Mode off). | No demo students. |
| 9.4 | `GET /admin/cohort-overview`, `/admin/analytics/leaderboard`, `/admin/analytics/skill-gaps`, `/admin/analytics/integrity-flags`, `/admin/users`, `/admin/credentials` | No demo cohort rows in any response. |
| 9.5 | Administration → User Management (Demo Mode off). | No demo students. |
| 9.6 | Promote Demo Student A to admin (Demo Mode on), then try to demote the only real admin. | Blocked: demo accounts don't count toward "at least one Administrator". Set Demo Student A back to student. |
| 9.7 | Student account: log in and view the leaderboard. | No demo students. |
| 9.8 | Demo Mode on → `GET /demo/cohort/students/<a real student's id>/timeline`. | `404`. |
