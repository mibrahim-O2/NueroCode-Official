-- 035: Demo Mode — demo_discussion_comments.
--
-- The "How others solved this" peer discussion thread on fixed demo Practice
-- problems. This is a separate table from the real problem_discussions for
-- two reasons:
--   1. problem_discussions.problem_id is a foreign key to the REAL problems
--      table. Demo problems are never rows there, so they are keyed by the
--      same stable problem_key string used in demo_submissions.
--   2. The real table resolves each author's display name from the users
--      table at read time. Demo comments store user_name as text instead, so
--      a comment posted by the owner shows the demo persona name, not the
--      owner's real name.
--
-- One example comment per practice problem is seeded on first activation,
-- authored by the fictional demo cohort accounts.
create table if not exists demo_discussion_comments (
  id uuid primary key default uuid_generate_v4(),
  problem_key text not null,
  user_id uuid not null references users(id) on delete cascade,
  user_name text not null,
  comment text not null,
  created_at timestamptz not null default now()
);

-- Serves "the thread for this problem, oldest first".
create index if not exists idx_demo_discussion_comments_problem
  on demo_discussion_comments(problem_key, created_at);
-- Serves per-user scoped deletes (the demo Practice reset).
create index if not exists idx_demo_discussion_comments_user on demo_discussion_comments(user_id);

-- Same RLS convention as 008: service_role only, public REST API blocked.
alter table demo_discussion_comments enable row level security;

-- Explicit grant alongside the table itself — problem_discussions shipped
-- without one and needed 019 to fix "permission denied".
grant select, insert, update, delete on public.demo_discussion_comments to service_role;
