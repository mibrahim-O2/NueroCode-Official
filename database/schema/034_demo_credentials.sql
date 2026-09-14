-- 034: Demo Mode — demo_credentials.
--
-- Credentials issued from Demo Mode. This is a separate table from the real
-- credentials table for one critical reason: the real public
-- /verify/{verify_uuid} route looks up the credentials table, and anyone with
-- a link can open it. A demo credential must never be verifiable as a genuine
-- NeuroCode credential. Because demo credentials only ever live here, the real
-- verify route structurally cannot resolve one. Their QR codes and links point
-- at the separate /demo/verify/{uuid} page instead, which always says
-- "this is a demo credential".
--
-- Issuing is presenter-triggered for demo purposes (any tier can be chosen),
-- so there is no assessment_id foreign key here, unlike the real table.
-- topics_mastered is text[] rather than jsonb — it is always a plain list of
-- demo roadmap topic names.
create table if not exists demo_credentials (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  badge_level text not null check (badge_level in ('bronze','silver','gold','platinum')),
  topics_mastered text[] not null default '{}',
  assessment_score numeric(5,2),
  integrity_score numeric(5,2),
  -- Still a real random UUID (same generator as the real table), so the demo
  -- QR/link flow looks and behaves exactly like the real one.
  verify_uuid uuid not null default uuid_generate_v4() unique,
  created_at timestamptz not null default now()
);

-- Serves the demo Credentials page (per user, newest first). verify_uuid
-- already has its own index from the unique constraint.
create index if not exists idx_demo_credentials_user_created on demo_credentials(user_id, created_at desc);

-- Same RLS convention as 008: service_role only, public REST API blocked.
alter table demo_credentials enable row level security;

-- Explicit grant alongside the table itself — see 019/022/025.
grant select, insert, update, delete on public.demo_credentials to service_role;
