-- 028: Demo Mode — demo_submissions.
--
-- Graded Practice submissions made while Demo Mode is on. This is a separate
-- table from the real submissions table so a demo run can never write to, or
-- be confused with, real student data. Real features that read submissions —
-- dashboard heatmap and charts, challenge-gate readiness counts, Official
-- Solutions, spaced review, recommendations, the educator timeline — cannot
-- see a single demo attempt.
--
-- problem_key is a stable string identifier into
-- backend/app/demo/demo_content.py (e.g. "easy-running-total"). It is NOT a
-- foreign key to the real problems table: fixed demo problems are never rows
-- in problems at all, so no real problem-scoped feature can reach them.
--
-- Grading still runs through the real execution_service.run_submission and
-- the real Tree-sitter analyzer; only where the result is stored differs.
create table if not exists demo_submissions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  problem_key text not null,
  language text not null,
  source_code text not null,
  execution_result jsonb,
  complexity text,
  created_at timestamptz not null default now()
);

-- Serves the demo "My Submissions" list (newest first, per user).
create index if not exists idx_demo_submissions_user_created on demo_submissions(user_id, created_at desc);

-- Same RLS convention as 008: service_role only, public REST API blocked.
alter table demo_submissions enable row level security;

-- Explicit grant alongside the table itself — see 019/022/025 for the three
-- times a missing grant caused "permission denied" at runtime.
grant select, insert, update, delete on public.demo_submissions to service_role;
