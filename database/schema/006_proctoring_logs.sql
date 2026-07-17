create table if not exists proctoring_logs (
  id uuid primary key default uuid_generate_v4(),
  assessment_id uuid not null references assessments(id) on delete cascade,
  event_type text not null,
  severity text not null default 'low' check (severity in ('low','medium','high','critical')),
  metadata jsonb,
  "timestamp" timestamptz not null default now()
);

create index if not exists idx_proctoring_logs_assessment_id on proctoring_logs(assessment_id);