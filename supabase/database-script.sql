-- Enable UUID extension (if not enabled)
create extension if not exists "pgcrypto";


-----------------------------
-- DROP TABLES (for re-run)
-----------------------------
drop table if exists prompt_versions cascade;
drop table if exists prompts cascade;
drop table if exists packs cascade;
drop table if exists users cascade;


-----------------------------
-- USERS TABLE
-----------------------------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  created_at timestamptz default now()
);


-----------------------------
-- PACKS TABLE
-----------------------------
create table public.packs (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  description text null,
  number_prompts numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint packs_pkey primary key (id),
  constraint packs_user_id_fkey foreign key (user_id) references users (id) on delete cascade
);


-----------------------------
-- PROMPTS TABLE
-----------------------------
create table public.prompts (
  id uuid not null default gen_random_uuid(),
  pack_id uuid not null,
  user_id uuid not null,
  title text null,
  content text not null,
  rating integer null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  number_versions numeric not null default 0,
  constraint prompts_pkey primary key (id),
  constraint prompts_pack_id_fkey foreign key (pack_id) references packs (id) on delete cascade,
  constraint prompts_user_id_fkey foreign key (user_id) references users (id) on delete cascade,
  constraint prompts_rating_check check (rating >= 1 and rating <= 10)
);


-----------------------------
-- PROMPT VERSIONS TABLE
-----------------------------
create table public.prompt_versions (
  id uuid not null default gen_random_uuid(),
  prompt_id uuid not null,
  user_id uuid not null,
  content text not null,
  rating integer null,
  is_accepted boolean null default false,
  created_at timestamptz not null default now(),
  constraint prompt_versions_pkey primary key (id),
  constraint prompt_versions_prompt_id_fkey foreign key (prompt_id) references prompts (id) on delete cascade,
  constraint prompt_versions_user_id_fkey foreign key (user_id) references users (id) on delete cascade,
  constraint prompt_versions_rating_check check (rating >= 1 and rating <= 10)
);


-----------------------------
-- TRIGGERS & FUNCTIONS
-----------------------------


-- Attach trigger to Supabase auth.users
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, username)
  values (new.id, new.raw_user_meta_data->>'username'); -- optional username from signup metadata
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure handle_new_user();


-- Update updated_at on row change
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger on packs
create trigger set_timestamp_packs
before update on packs
for each row
execute procedure update_updated_at_column();

-- Trigger on prompts
create trigger set_timestamp_prompts
before update on prompts
for each row
execute procedure update_updated_at_column();


-- Auto update number_versions in prompts
create or replace function update_prompt_version_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update prompts set number_versions = number_versions + 1 where id = new.prompt_id;
  elsif tg_op = 'DELETE' then
    update prompts set number_versions = number_versions - 1 where id = old.prompt_id;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger update_prompt_versions_count
after insert or delete on prompt_versions
for each row
execute function update_prompt_version_count();


-- Auto update number_prompts in packs
create or replace function update_pack_prompt_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update packs set number_prompts = number_prompts + 1 where id = new.pack_id;
  elsif tg_op = 'DELETE' then
    update packs set number_prompts = number_prompts - 1 where id = old.pack_id;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger update_packs_prompt_count
after insert or delete on prompts
for each row
execute function update_pack_prompt_count();


-----------------------------
-- RLS POLICIES
-----------------------------

-- Enable RLS
alter table users enable row level security;
alter table packs enable row level security;
alter table prompts enable row level security;
alter table prompt_versions enable row level security;

-- USERS policies
create policy "Users can view their own profile" on users
for select using (auth.uid() = id);

create policy "Users can update their own profile" on users
for update using (auth.uid() = id);

-- PACKS policies
create policy "Users can manage their packs" on packs
for all using (auth.uid() = user_id);

-- PROMPTS policies
create policy "Users can manage their prompts" on prompts
for all using (auth.uid() = user_id);

-- PROMPT VERSIONS policies
create policy "Users can manage versions they own" on prompt_versions
for all using (auth.uid() = user_id);
