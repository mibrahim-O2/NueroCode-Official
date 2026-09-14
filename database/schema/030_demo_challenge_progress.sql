-- 030: Demo Mode — demo_challenge_progress.
--
-- Progress through the fixed demo Challenge Gate. This is a separate table
-- from the real roadmap_challenges for two reasons:
--   1. roadmap_challenges.node_id is a foreign key to the REAL roadmap_nodes
--      table. The demo gate belongs to a demo_roadmap_progress topic, so it
--      needs its own key space (node_key) that can never point at a real node.
--   2. roadmap_challenges stores an AI-generated question pool per row. Demo
--      questions are fixed content in backend/app/demo/demo_content.py, so
--      only progress (which questions are solved) is stored here.
--
-- node_key is the demo roadmap topic the gate belongs to (e.g. "Two Pointers").
-- Grading still runs through the real execution_service.run_submission.
create table if not exists demo_challenge_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  node_key text not null,
  solved_indices int[] not null default '{}',
  status text not null default 'in_progress' check (status in ('in_progress','passed')),
  -- One gate session per user per demo node, same as roadmap_challenges.
  -- The unique constraint also serves as the (user_id, node_key) lookup index.
  constraint unique_demo_challenge_user_node unique (user_id, node_key)
);

-- Same RLS convention as 008: service_role only, public REST API blocked.
alter table demo_challenge_progress enable row level security;

-- Explicit grant alongside the table itself — roadmap_challenges shipped
-- without one and needed 022 to fix "permission denied".
grant select, insert, update, delete on public.demo_challenge_progress to service_role;
