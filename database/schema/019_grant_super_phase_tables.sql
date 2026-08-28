-- Migration 016-018 created these tables and enabled RLS, but did not
-- explicitly grant the backend's service_role permission to read/write
-- them — Supabase's automatic default-privilege behavior did not apply
-- here for some reason (unlike every earlier migration), so it's being
-- granted explicitly instead of relying on that happening implicitly.
grant select, insert, update, delete on public.interview_sessions to service_role;
grant select, insert, update, delete on public.submission_comments to service_role;
grant select, insert, update, delete on public.problem_discussions to service_role;