create table if not exists roadmap_nodes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  topic text not null,
  difficulty text not null check (difficulty in ('beginner','intermediate','advanced')),
  status text not null default 'locked' check (status in ('locked','unlocked','in_progress','completed')),
  position integer not null,
  xp_earned integer not null default 0,
  unlocked_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_roadmap_nodes_user_id on roadmap_nodes(user_id);
create unique index if not exists idx_roadmap_nodes_user_position on roadmap_nodes(user_id, position);