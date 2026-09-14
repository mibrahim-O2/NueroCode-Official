-- 032: Demo Mode — demo_assessment_attempts.
--
-- Attempts at the two fixed demo assessments. This is a separate table from
-- the real assessments table, which several real systems read:
--   * get_available_clusters reads assessments to decide which real clusters
--     count as "passed",
--   * credentials.assessment_id is a foreign key to assessments,
--   * the admin "integrity flags" analytics and the educator cohort overview
--     count flagged rows in assessments.
-- Keeping demo attempts here means none of those can ever see a demo attempt,
-- a demo integrity flag, or a demo pass.
--
-- assessment_key is "assessment_1" or "assessment_2" from
-- backend/app/demo/demo_content.py. `unlocked` records that the attempt was
-- started only after that assessment's unlock_rule was satisfied (checked
-- server-side on the start endpoint).
--
-- integrity_score is always computed server-side from demo_proctoring_logs
-- with the same penalty weights the real assessment_service uses — the client
-- never supplies it.
create table if not exists demo_assessment_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  assessment_key text not null,
  unlocked boolean not null default false,
  status text not null default 'in_progress' check (status in ('in_progress','completed','flagged')),
  assessment_score numeric(5,2),
  integrity_score numeric(5,2),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Serves "this user's attempts at this assessment" (unlock + pass checks).
create index if not exists idx_demo_assessment_attempts_user_key
  on demo_assessment_attempts(user_id, assessment_key);

-- Same RLS convention as 008: service_role only, public REST API blocked.
alter table demo_assessment_attempts enable row level security;

-- Explicit grant alongside the table itself — see 019/022/025.
grant select, insert, update, delete on public.demo_assessment_attempts to service_role;
