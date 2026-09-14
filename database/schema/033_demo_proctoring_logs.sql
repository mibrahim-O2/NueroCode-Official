-- 033: Demo Mode — demo_proctoring_logs.
--
-- Integrity events (tab_switch, paste, camera_alert, keystroke_alert)
-- detected during a demo assessment attempt. This is a separate table from
-- the real proctoring_logs because the real table's assessment_id is a
-- foreign key to the REAL assessments table: a demo attempt can't (and must
-- not) have a real assessments row, and the educator/admin violation
-- summaries read proctoring_logs directly.
--
-- The detectors that produce these events are the exact same frontend hooks
-- and backend camera/keystroke checks the real assessment uses. The demo
-- submit endpoint recomputes integrity_score from THIS table server-side,
-- using the same penalty weights as the real assessment_service.
--
-- Scoping: no user_id column of its own. It is scoped through its parent
-- demo_assessment_attempts row (which is per-user), and ON DELETE CASCADE
-- removes a user's logs when their demo attempts are reset.
create table if not exists demo_proctoring_logs (
  id uuid primary key default uuid_generate_v4(),
  attempt_id uuid not null references demo_assessment_attempts(id) on delete cascade,
  event_type text not null,
  severity text not null default 'low' check (severity in ('low','medium','high','critical')),
  created_at timestamptz not null default now()
);

-- Serves "all logs for this attempt" — the server-side integrity score query.
create index if not exists idx_demo_proctoring_logs_attempt on demo_proctoring_logs(attempt_id);

-- Same RLS convention as 008: service_role only, public REST API blocked.
alter table demo_proctoring_logs enable row level security;

-- Explicit grant alongside the table itself — see 019/022/025.
grant select, insert, update, delete on public.demo_proctoring_logs to service_role;
