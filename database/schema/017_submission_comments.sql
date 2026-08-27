create table if not exists submission_comments (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid not null references submissions(id) on delete cascade,
  educator_id uuid not null references users(id) on delete cascade,
  comment text not null,
  created_at timestamptz not null default now()
);

alter table submission_comments enable row level security;
create index if not exists idx_submission_comments_submission on submission_comments(submission_id);