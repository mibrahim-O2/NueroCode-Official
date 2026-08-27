create table if not exists interview_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  topic text not null,
  difficulty text not null,
  question jsonb not null,
  language text,
  source_code text,
  execution_result jsonb,
  complexity text,
  time_limit_seconds int not null default 1800,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  status text not null default 'in_progress', -- in_progress | completed | expired
  created_at timestamptz not null default now()
);

alter table interview_sessions enable row level security;
create index if not exists idx_interview_sessions_user on interview_sessions(user_id, created_at desc);