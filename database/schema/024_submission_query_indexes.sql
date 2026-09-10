create index if not exists idx_submissions_user_topic_created
  on public.submissions(user_id, topic, created_at desc);
create index if not exists idx_submissions_user_created
  on public.submissions(user_id, created_at desc);
