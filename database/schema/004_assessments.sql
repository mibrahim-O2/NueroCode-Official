create table if not exists assessments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  topic_cluster text not null,
  generated_question jsonb not null,
  submitted_code text,
  execution_result jsonb,
  assessment_score numeric(5,2),
  integrity_score numeric(5,2),
  duration integer,
  status text not null default 'in_progress' check (status in ('in_progress','completed','flagged','abandoned')),
  created_at timestamptz not null default now()
);

create index if not exists idx_assessments_user_id on assessments(user_id);