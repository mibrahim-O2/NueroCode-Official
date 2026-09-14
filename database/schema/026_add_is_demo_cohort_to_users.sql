-- 026: Demo Mode — permanent demo-cohort flag on users.
--
-- Demo Mode's Educator/Admin view shows a cohort made of three fixed,
-- clearly fictional accounts: Demo Student A, Demo Student B and Demo
-- Student C. Those are REAL users rows on purpose — the real admin
-- role-change dropdown and the six real per-student reset actions must work
-- on them unmodified, and those actions only operate on real users rows.
--
-- This flag is what keeps those three accounts out of everything real. Every
-- real-facing listing or aggregate (leaderboard, cohort overview, admin user
-- list, admin analytics, admin credentials list, admin count) filters on
-- is_demo_cohort = false UNCONDITIONALLY — whether Demo Mode is currently on
-- or off — so a demo account can never leak into a real-facing view.
--
-- Only demo_service ever sets this to true, when it creates those three
-- accounts. No real login path writes it, so it stays false for every real
-- user, existing and future.
alter table users add column if not exists is_demo_cohort boolean not null default false;

-- Partial index: the demo cohort is at most three rows, and the /demo/cohort/*
-- lookups are the only queries that select them positively.
create index if not exists idx_users_is_demo_cohort on users(is_demo_cohort) where is_demo_cohort;

-- No new grant needed: this only adds a column to the existing users table,
-- which service_role already has full access to.
