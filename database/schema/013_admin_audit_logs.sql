create table if not exists admin_audit_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid not null references users(id) on delete cascade,
  admin_name text not null,
  target_user_id uuid not null references users(id) on delete cascade,
  target_user_name text not null,
  action text not null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_audit_logs_target on admin_audit_logs(target_user_id);
create index if not exists idx_admin_audit_logs_created on admin_audit_logs(created_at desc);