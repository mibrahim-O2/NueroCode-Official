-- Phase 4 defined submissions.difficulty against the roadmap vocabulary
-- (beginner/intermediate/advanced), but submissions are always populated
-- from problems.difficulty (Phase 7), which uses easy/medium/hard. This
-- realigns the constraint with the vocabulary submissions actually receives.

alter table submissions drop constraint if exists submissions_difficulty_check;
alter table submissions add constraint submissions_difficulty_check
  check (difficulty in ('easy','medium','hard'));