-- NeuroCode: users table (SYSTEM_ARCHITECTURE.md §4.1)
-- Prerequisite for Phase 3 (Authentication). Additional tables land in Phase 4.

create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  firebase_uid text unique not null,
  name text not null,
  email text unique not null,
  avatar_url text,
  role text not null default 'student' check (role in ('student', 'educator', 'admin')),
  xp integer not null default 0,
  level integer not null default 1,
  streak integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_firebase_uid on users(firebase_uid);
create index if not exists idx_users_email on users(email);