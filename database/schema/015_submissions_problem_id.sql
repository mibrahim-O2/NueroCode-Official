-- Nullable so existing rows (submitted before this phase) remain valid.
alter table submissions
  add column if not exists problem_id uuid references problems(id) on delete set null;

create index if not exists idx_submissions_problem_id on submissions(problem_id);