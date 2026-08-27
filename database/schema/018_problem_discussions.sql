create table if not exists problem_discussions (
  id uuid primary key default uuid_generate_v4(),
  problem_id uuid not null references problems(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  comment text not null,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

alter table problem_discussions enable row level security;
create index if not exists idx_problem_discussions_problem on problem_discussions(problem_id, created_at);