create table if not exists learning_analytics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade unique,
  weak_topics jsonb default '[]',
  strong_topics jsonb default '[]',
  learning_speed text,
  consistency_score numeric(5,2),
  recommended_next_topic text,
  updated_at timestamptz not null default now()
);

create index if not exists idx_learning_analytics_user_id on learning_analytics(user_id);