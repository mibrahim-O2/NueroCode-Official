create table if not exists submissions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  language text not null,
  topic text not null,
  difficulty text not null check (difficulty in ('beginner','intermediate','advanced')),
  source_code text not null,
  execution_result jsonb,
  complexity text,
  detected_patterns jsonb,
  ai_feedback text,
  created_at timestamptz not null default now()
);

create index if not exists idx_submissions_user_id on submissions(user_id);
create index if not exists idx_submissions_topic on submissions(topic);