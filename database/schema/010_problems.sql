create table if not exists problems (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  topic text not null,
  difficulty text not null check (difficulty in ('easy','medium','hard')),
  title text not null,
  description text not null,
  examples jsonb not null,
  constraints jsonb not null,
  expected_complexity text,
  canonical_solution text not null,
  test_cases jsonb not null,
  validated boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_problems_user_topic on problems(user_id, topic);