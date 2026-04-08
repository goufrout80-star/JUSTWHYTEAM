-- ============================================================
-- JUST WHY TEAM: Full Database Migration
-- Run this in Supabase SQL Editor
-- ============================================================

create extension if not exists "uuid-ossp";

-- 1. PROFILES (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  display_name text,
  email text,
  roles text[] default '{}',
  avatar_color text default '#534AB7',
  is_super_admin boolean default false,
  two_factor_enabled boolean default false,
  two_factor_secret text,
  must_change_password boolean default true,
  banned boolean default false,
  is_impersonating uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- 2. WORKSPACE (single row)
create table public.workspace (
  id int primary key default 1,
  name text default 'Just Why Team',
  logo_url text,
  primary_color text default '#534AB7',
  updated_at timestamptz default now()
);
insert into public.workspace (id, name) values (1, 'Just Why Team');

-- 3. INVITE TOKENS (one-time registration links)
create table public.invite_tokens (
  id uuid default uuid_generate_v4() primary key,
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  created_by uuid references public.profiles(id),
  used boolean default false,
  used_by uuid references public.profiles(id),
  expires_at timestamptz default now() + interval '7 days',
  created_at timestamptz default now()
);

-- 4. PROJECTS
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  version text default 'v1.0.0',
  deadline date,
  owner_id uuid references public.profiles(id),
  color text default '#534AB7',
  progress int default 0,
  created_at timestamptz default now()
);

-- 5. PROJECT MEMBERS
create table public.project_members (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  permission text default 'contributor',
  joined_at timestamptz default now(),
  unique(project_id, user_id)
);

-- 6. PROJECT INVITE LINKS (shareable)
create table public.project_invite_links (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade,
  token text unique not null default encode(gen_random_bytes(16), 'hex'),
  created_by uuid references public.profiles(id),
  permission text default 'contributor',
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- 7. TASKS
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  description text,
  assigned_to uuid references public.profiles(id),
  created_by uuid references public.profiles(id),
  priority text default 'medium',
  status text default 'pending',
  type text default 'required',
  version text,
  deadline date,
  timer_seconds int default 0,
  timer_running boolean default false,
  timer_started_at timestamptz,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- 8. CHAT MESSAGES
create table public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id),
  content text not null,
  created_at timestamptz default now()
);

-- 9. ANNOUNCEMENTS
create table public.announcements (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id),
  content text not null,
  created_at timestamptz default now()
);

-- 10. ANNOUNCEMENT REPLIES
create table public.announcement_replies (
  id uuid default uuid_generate_v4() primary key,
  announcement_id uuid references public.announcements(id) on delete cascade,
  user_id uuid references public.profiles(id),
  content text not null,
  created_at timestamptz default now()
);

-- 11. ANNOUNCEMENT LIKES
create table public.announcement_likes (
  id uuid default uuid_generate_v4() primary key,
  announcement_id uuid references public.announcements(id) on delete cascade,
  user_id uuid references public.profiles(id),
  unique(announcement_id, user_id)
);

-- 12. TIME SESSIONS
create table public.time_sessions (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references public.tasks(id) on delete cascade,
  user_id uuid references public.profiles(id),
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds int
);

-- 13. NOTIFICATIONS
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  type text not null,
  title text not null,
  body text,
  related_id uuid,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- 14. ACTIVITY LOGS
create table public.activity_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  project_id uuid references public.projects(id),
  action text not null,
  metadata jsonb default '{}',
  ip_address text,
  created_at timestamptz default now()
);

-- 15. VERIFICATION CODES (OTP for reset, verify, 2fa_fallback)
create table public.verification_codes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  email text not null,
  code text not null,
  type text not null, -- 'reset' | 'verify' | '2fa_fallback'
  used boolean default false,
  expires_at timestamptz default now() + interval '10 minutes',
  created_at timestamptz default now()
);

-- 16. ERROR LOGS
create table public.errors_log (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  page text,
  error_message text,
  stack_trace text,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.workspace enable row level security;
alter table public.invite_tokens enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_invite_links enable row level security;
alter table public.tasks enable row level security;
alter table public.chat_messages enable row level security;
alter table public.announcements enable row level security;
alter table public.announcement_replies enable row level security;
alter table public.announcement_likes enable row level security;
alter table public.time_sessions enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_logs enable row level security;
alter table public.errors_log enable row level security;
alter table public.verification_codes enable row level security;

-- Helper: resolve username → email for login (runs before auth, bypasses RLS)
create or replace function public.get_email_by_username(p_username text)
returns text
language sql
security definer
stable
as $$
  select email from public.profiles where username = p_username limit 1;
$$;

-- Helper: check super-admin without triggering RLS on profiles (security definer bypasses RLS)
create or replace function public.is_super_admin()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (select is_super_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- PROFILES
create policy "own profile" on public.profiles for select using (auth.uid() = id);
create policy "super admin sees all profiles" on public.profiles for select using (
  public.is_super_admin()
);
create policy "user updates own profile" on public.profiles for update using (auth.uid() = id);
create policy "super admin updates any profile" on public.profiles for update using (
  public.is_super_admin()
);
create policy "trigger inserts profile" on public.profiles for insert with check (true);

-- WORKSPACE
create policy "anyone reads workspace" on public.workspace for select using (true);
create policy "super admin updates workspace" on public.workspace for update using (
  exists (select 1 from public.profiles where id = auth.uid() and is_super_admin = true)
);

-- INVITE TOKENS
create policy "super admin manages tokens" on public.invite_tokens for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_super_admin = true)
);
create policy "anyone reads valid token" on public.invite_tokens for select using (true);
create policy "anyone can mark token used" on public.invite_tokens for update using (true);

-- PROJECTS
create policy "members see project" on public.projects for select using (
  exists (select 1 from public.project_members where project_id = projects.id and user_id = auth.uid())
  or exists (select 1 from public.profiles where id = auth.uid() and is_super_admin = true)
);
create policy "auth users create projects" on public.projects for insert with check (auth.uid() = owner_id);
create policy "owner updates project" on public.projects for update using (
  owner_id = auth.uid()
  or exists (select 1 from public.profiles where id = auth.uid() and is_super_admin = true)
);
create policy "owner deletes project" on public.projects for delete using (
  owner_id = auth.uid()
  or exists (select 1 from public.profiles where id = auth.uid() and is_super_admin = true)
);

-- PROJECT MEMBERS
create policy "members see members" on public.project_members for select using (
  exists (select 1 from public.project_members pm where pm.project_id = public.project_members.project_id and pm.user_id = auth.uid())
  or exists (select 1 from public.profiles where id = auth.uid() and is_super_admin = true)
);
create policy "auth users insert membership" on public.project_members for insert with check (true);
create policy "admin removes members" on public.project_members for delete using (
  exists (select 1 from public.projects where id = project_id and owner_id = auth.uid())
  or user_id = auth.uid()
  or exists (select 1 from public.profiles where id = auth.uid() and is_super_admin = true)
);
create policy "admin updates members" on public.project_members for update using (
  exists (select 1 from public.projects where id = project_id and owner_id = auth.uid())
  or exists (select 1 from public.profiles where id = auth.uid() and is_super_admin = true)
);

-- PROJECT INVITE LINKS
create policy "members manage invite links" on public.project_invite_links for all using (
  exists (select 1 from public.project_members where project_id = project_invite_links.project_id and user_id = auth.uid())
  or exists (select 1 from public.profiles where id = auth.uid() and is_super_admin = true)
);
create policy "anyone reads invite link" on public.project_invite_links for select using (true);

-- TASKS (project members only)
create policy "members see tasks" on public.tasks for select using (
  exists (select 1 from public.project_members where project_id = tasks.project_id and user_id = auth.uid())
  or exists (select 1 from public.profiles where id = auth.uid() and is_super_admin = true)
);
create policy "members create tasks" on public.tasks for insert with check (
  exists (select 1 from public.project_members where project_id = tasks.project_id and user_id = auth.uid())
);
create policy "members update tasks" on public.tasks for update using (
  exists (select 1 from public.project_members where project_id = tasks.project_id and user_id = auth.uid())
);
create policy "members delete tasks" on public.tasks for delete using (
  created_by = auth.uid()
  or exists (select 1 from public.project_members where project_id = tasks.project_id and user_id = auth.uid() and permission = 'admin')
  or exists (select 1 from public.profiles where id = auth.uid() and is_super_admin = true)
);

-- CHAT MESSAGES
create policy "members see chat" on public.chat_messages for select using (
  exists (select 1 from public.project_members where project_id = chat_messages.project_id and user_id = auth.uid())
  or exists (select 1 from public.profiles where id = auth.uid() and is_super_admin = true)
);
create policy "members send chat" on public.chat_messages for insert with check (
  exists (select 1 from public.project_members where project_id = chat_messages.project_id and user_id = auth.uid())
);

-- ANNOUNCEMENTS
create policy "members see announcements" on public.announcements for select using (
  exists (select 1 from public.project_members where project_id = announcements.project_id and user_id = auth.uid())
  or exists (select 1 from public.profiles where id = auth.uid() and is_super_admin = true)
);
create policy "members post announcements" on public.announcements for insert with check (
  exists (select 1 from public.project_members where project_id = announcements.project_id and user_id = auth.uid())
);
create policy "author edits announcements" on public.announcements for update using (user_id = auth.uid());
create policy "author deletes announcements" on public.announcements for delete using (user_id = auth.uid());

-- ANNOUNCEMENT REPLIES
create policy "members see replies" on public.announcement_replies for select using (
  exists (
    select 1 from public.announcements a
    join public.project_members pm on pm.project_id = a.project_id
    where a.id = announcement_id and pm.user_id = auth.uid()
  )
);
create policy "members post replies" on public.announcement_replies for insert with check (
  exists (
    select 1 from public.announcements a
    join public.project_members pm on pm.project_id = a.project_id
    where a.id = announcement_id and pm.user_id = auth.uid()
  )
);
create policy "author deletes replies" on public.announcement_replies for delete using (user_id = auth.uid());

-- ANNOUNCEMENT LIKES
create policy "members see likes" on public.announcement_likes for select using (
  exists (
    select 1 from public.announcements a
    join public.project_members pm on pm.project_id = a.project_id
    where a.id = announcement_id and pm.user_id = auth.uid()
  )
);
create policy "user toggles likes" on public.announcement_likes for insert with check (user_id = auth.uid());
create policy "user removes likes" on public.announcement_likes for delete using (user_id = auth.uid());

-- TIME SESSIONS
create policy "user manages own sessions" on public.time_sessions for all using (user_id = auth.uid());
create policy "members see sessions" on public.time_sessions for select using (
  exists (
    select 1 from public.tasks t
    join public.project_members pm on pm.project_id = t.project_id
    where t.id = task_id and pm.user_id = auth.uid()
  )
);

-- NOTIFICATIONS
create policy "own notifications" on public.notifications for select using (user_id = auth.uid());
create policy "insert notifications" on public.notifications for insert with check (true);
create policy "update own notifications" on public.notifications for update using (user_id = auth.uid());
create policy "delete own notifications" on public.notifications for delete using (user_id = auth.uid());

-- ACTIVITY LOGS
create policy "users insert logs" on public.activity_logs for insert with check (true);
create policy "super admin sees logs" on public.activity_logs for select using (
  exists (select 1 from public.profiles where id = auth.uid() and is_super_admin = true)
);

-- ERROR LOGS
create policy "users insert errors" on public.errors_log for insert with check (true);
create policy "super admin sees errors" on public.errors_log for select using (
  exists (select 1 from public.profiles where id = auth.uid() and is_super_admin = true)
);

-- VERIFICATION CODES (anyone can insert, only own or service-role can select/update)
create policy "anyone inserts verification code" on public.verification_codes for insert with check (true);
create policy "own verification code" on public.verification_codes for select using (
  email = (select email from public.profiles where id = auth.uid())
  or auth.uid() is null
);
create policy "mark code used" on public.verification_codes for update using (true);

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, email, must_change_password)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.email,
    true
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- REALTIME
-- ============================================================
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.announcements;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.activity_logs;

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_project_members_user on public.project_members(user_id);
create index idx_project_members_project on public.project_members(project_id);
create index idx_tasks_project on public.tasks(project_id);
create index idx_tasks_assigned on public.tasks(assigned_to);
create index idx_chat_project on public.chat_messages(project_id);
create index idx_announcements_project on public.announcements(project_id);
create index idx_activity_user on public.activity_logs(user_id);
create index idx_activity_project on public.activity_logs(project_id);
create index idx_notifications_user on public.notifications(user_id);
create index idx_invite_tokens_token on public.invite_tokens(token);
create index idx_project_invite_token on public.project_invite_links(token);
create index idx_verification_codes_email on public.verification_codes(email);
create index idx_verification_codes_type on public.verification_codes(type);
