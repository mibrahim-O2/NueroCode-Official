create table if not exists credentials (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  assessment_id uuid not null references assessments(id) on delete cascade,
  verify_uuid uuid not null default uuid_generate_v4() unique,
  badge_level text not null check (badge_level in ('bronze','silver','gold','platinum')),
  topics_mastered jsonb not null default '[]',
  assessment_score numeric(5,2),
  integrity_score numeric(5,2),
  qr_code text,
  created_at timestamptz not null default now()
);

create index if not exists idx_credentials_verify_uuid on credentials(verify_uuid);
create index if not exists idx_credentials_user_id on credentials(user_id);