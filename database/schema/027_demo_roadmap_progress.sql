-- 027: Demo Mode — demo_roadmap_progress.
--
-- The owner's fixed 5-topic demo roadmap. This is a separate table from the
-- real roadmap_nodes so that seeding, completing, reordering or resetting
-- the demo roadmap can never touch the owner's real roadmap rows — and so
-- nothing that reads roadmap_nodes (assessment cluster unlocks, dashboard
-- charts, the educator timeline, recommendations, spaced review) can ever
-- pick up demo progress by mistake.
--
-- The columns deliberately mirror roadmap_nodes, so the SAME repository
-- functions (seed / start / complete / promote) run against either table
-- unchanged, instead of a forked copy of the progression logic.
create table if not exists demo_roadmap_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  topic text not null,
  difficulty text not null check (difficulty in ('beginner','intermediate','advanced')),
  position integer not null,
  status text not null default 'locked' check (status in ('locked','unlocked','in_progress','completed')),
  xp_earned integer not null default 0,
  unlocked_at timestamptz,
  completed_at timestamptz
);

create index if not exists idx_demo_roadmap_progress_user_id on demo_roadmap_progress(user_id);
-- Same (user_id, position) uniqueness as roadmap_nodes — promote_roadmap_topic's
-- park-at-minus-one / shift-descending reorder was written around this constraint.
create unique index if not exists idx_demo_roadmap_progress_user_position on demo_roadmap_progress(user_id, position);
-- Demo routes address a node by topic name (/demo/roadmap/{topic}/...), so a
-- topic can appear at most once per user.
create unique index if not exists idx_demo_roadmap_progress_user_topic on demo_roadmap_progress(user_id, topic);

-- Same RLS convention as 008: the backend uses service_role (bypasses RLS),
-- and Supabase's public REST API stays blocked from reading this table.
alter table demo_roadmap_progress enable row level security;

-- Explicit grant in the SAME migration as the table. interview_sessions,
-- submission_comments, problem_discussions, roadmap_challenges and
-- admin_audit_logs all shipped without one and failed at runtime with
-- "permission denied" until 019/022/025 fixed them.
grant select, insert, update, delete on public.demo_roadmap_progress to service_role;
