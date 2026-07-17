-- Enable Row Level Security on every table.
-- The backend exclusively connects using the Supabase service_role key, which
-- bypasses RLS entirely. No policies are defined for the anon/authenticated
-- roles below — this intentionally blocks Supabase's auto-generated public
-- REST API from exposing any table directly. All access must go through
-- the FastAPI backend, per SYSTEM_ARCHITECTURE.md's stateless-backend rule.

alter table users enable row level security;
alter table roadmap_nodes enable row level security;
alter table submissions enable row level security;
alter table assessments enable row level security;
alter table credentials enable row level security;
alter table proctoring_logs enable row level security;
alter table learning_analytics enable row level security;