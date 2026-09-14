-- 031: Demo Mode — demo_interview_sessions.
--
-- Mock Interview sessions run while Demo Mode is on. This is a separate
-- table from the real interview_sessions so a demo interview never appears
-- in the owner's real interview history (GET /interviews/mine), and a real
-- session can never be graded against fixed demo content.
--
-- topic is the key of one of the three fixed MOCK_INTERVIEW_TOPICS in
-- backend/app/demo/demo_content.py. The question itself is not stored:
-- unlike the real table (which has to store its AI-generated question), demo
-- questions are fixed content, looked up by topic at grading time.
-- Grading still runs through the real execution_service.run_submission.
create table if not exists demo_interview_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  topic text not null,
  status text not null default 'in_progress' check (status in ('in_progress','completed')),
  execution_result jsonb,
  time_taken_seconds integer,
  created_at timestamptz not null default now()
);

-- Serves per-user session lookups, newest first.
create index if not exists idx_demo_interview_sessions_user_created
  on demo_interview_sessions(user_id, created_at desc);

-- Same RLS convention as 008: service_role only, public REST API blocked.
alter table demo_interview_sessions enable row level security;

-- Explicit grant alongside the table itself — interview_sessions shipped
-- without one and needed 019 to fix "permission denied".
grant select, insert, update, delete on public.demo_interview_sessions to service_role;
