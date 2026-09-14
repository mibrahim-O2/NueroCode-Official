-- 029: Demo Mode — demo_submission_comments.
--
-- Teacher comments on demo submissions (the demo "My Submissions" feedback
-- thread). This is a separate table from the real submission_comments for
-- two reasons:
--   1. It references demo_submissions, so a demo comment can never attach to
--      a real student's submission, and a real comment can never attach to a
--      demo one.
--   2. The real table stores educator_id, a foreign key to a real educator
--      account. Demo comments store educator_name as plain text instead, so
--      no real educator's identity is ever attached to demo content.
--
-- Scoping: this table has no user_id column of its own. It is scoped through
-- its parent demo_submissions row (which is per-user), and ON DELETE CASCADE
-- means resetting a user's demo submissions removes their comments too.
create table if not exists demo_submission_comments (
  id uuid primary key default uuid_generate_v4(),
  demo_submission_id uuid not null references demo_submissions(id) on delete cascade,
  educator_name text not null,
  comment text not null,
  created_at timestamptz not null default now()
);

-- Serves "comments for this submission, oldest first".
create index if not exists idx_demo_submission_comments_submission
  on demo_submission_comments(demo_submission_id, created_at);

-- Same RLS convention as 008: service_role only, public REST API blocked.
alter table demo_submission_comments enable row level security;

-- Explicit grant alongside the table itself — see 019/022/025.
grant select, insert, update, delete on public.demo_submission_comments to service_role;
