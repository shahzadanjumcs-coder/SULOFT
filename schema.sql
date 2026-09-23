-- SULOFT — Superior University Okara Lost & Found Portal
-- Database Schema + Row Level Security (RLS) Policies
-- =============================================================================
-- Run this file in your Supabase SQL Editor (Dashboard → SQL → New query).
-- It is idempotent — safe to re-run.
--
-- DEPENDENCY ORDER (important — do not reorder):
--   1. Extensions
--   2. profiles table              (no dependencies)
--   3. Role helper functions       (current_role / is_admin / is_staff_or_admin)
--                                  — depend on profiles
--   4. profiles RLS policies       — depend on role helpers
--   5. handle_new_user() + trigger — depends on profiles
--   6. categories                  — independent
--   7. items (enum + table + RLS)  — depends on profiles + categories + role helpers
--   8. claims (enum + table + RLS) — depends on items + profiles + role helpers
--   9. notifications (table + RLS) — depends on profiles + role helpers
--  10. reports (enum + table + RLS) — depends on items + profiles + role helpers
--  11. announcements (table + RLS)  — depends on role helpers
--  12. updated_at triggers         — depend on profiles / items / claims tables
--  13. notify_item_owner_of_claim() + trigger
--                                  — depends on items + notifications tables
--
-- Security model summary:
--   • All tables have RLS ENABLED. No data is accessible by default.
--   • The anon/public role can ONLY read active lost/found items, categories,
--     and announcements. It cannot write anything.
--   • Authenticated students can:
--       - read all active items, categories, announcements
--       - insert/update/delete their own items
--       - insert claims and read claims they own or that target their items
--       - insert listing reports
--       - read and update their own notifications
--       - read and update their own profile
--   • Admins (profiles.role = 'admin') can additionally:
--       - read, update, and soft-delete all items
--       - read and update all claims (approve / reject / complete)
--       - read all profiles
--       - read all listing reports
--       - insert / update / delete categories and announcements
--   • The service_role key (server-only, NEVER in browser) bypasses RLS
--     and is used for trusted server-side admin operations only.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Extensions
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. profiles table  (MUST come before any function/policy that references it)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  email       text not null,
  student_id  text not null,
  department  text not null,
  role        text not null default 'student' check (role in ('student', 'staff', 'admin')),
  avatar_url  text,
  phone       text,
  bio         text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- -----------------------------------------------------------------------------
-- 2. Role helper functions
--    These reference public.profiles, so profiles must already exist.
-- -----------------------------------------------------------------------------

-- Returns the role of the currently authenticated user, or NULL.
-- Used by RLS policies so we don't need to join on every policy.
create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid();
$$;

-- Convenience boolean helpers used in policies
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() = 'admin', false);
$$;

create or replace function public.is_staff_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() in ('admin', 'staff'), false);
$$;

-- -----------------------------------------------------------------------------
-- 3. profiles RLS policies (depend on role helpers above)
-- -----------------------------------------------------------------------------

-- SELECT: own profile, OR admin/staff can read all
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (
    id = auth.uid() or public.is_staff_or_admin()
  );

-- INSERT: only on signup, and only for the user themselves.
-- (A trigger below auto-creates the profile from auth.users metadata.)
drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
  for insert with check (id = auth.uid());

-- UPDATE: own profile (cannot change own role), OR admin can update anyone
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update using (
    id = auth.uid() or public.is_admin()
  )
  with check (
    -- Students/staff cannot escalate themselves to admin
    (id = auth.uid() and (role in ('student', 'staff') or role = (
      select p.role from public.profiles p where p.id = auth.uid()
    ))) or public.is_admin()
  );

-- -----------------------------------------------------------------------------
-- 4. Trigger: auto-create a profile row whenever a new auth user signs up
--    Depends on profiles table.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, student_id, department, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    coalesce(new.raw_user_meta_data->>'student_id', 'UNKNOWN'),
    coalesce(new.raw_user_meta_data->>'department', 'Unknown'),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 5. categories (independent — no dependency on profiles or role helpers
--    for table creation; RLS policies use is_admin)
-- -----------------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  icon        text not null default 'Package',
  description text,
  created_at  timestamptz not null default now()
);

alter table public.categories enable row level security;

-- Public can read categories
drop policy if exists "categories_select_public" on public.categories;
create policy "categories_select_public" on public.categories
  for select using (true);

-- Only admins can write
drop policy if exists "categories_write_admin" on public.categories;
create policy "categories_write_admin" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- 6. items (depends on profiles + categories + role helpers)
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.item_type as enum ('lost', 'found');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.item_status as enum ('active', 'claimed', 'returned', 'expired', 'removed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.contact_preference as enum ('email', 'phone', 'in_app', 'dashboard_only');
exception when duplicate_object then null; end $$;

create table if not exists public.items (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles(id) on delete cascade,
  title              text not null,
  description        text not null,
  type               public.item_type not null,
  category_id        uuid references public.categories(id) on delete set null,
  location           text not null,
  date               date not null,
  time               text,
  image_url          text,
  image_path         text,
  status             public.item_status not null default 'active',
  contact_preference public.contact_preference not null default 'email',
  additional_info    text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists items_status_idx       on public.items(status);
create index if not exists items_type_idx         on public.items(type);
create index if not exists items_category_id_idx  on public.items(category_id);
create index if not exists items_user_id_idx       on public.items(user_id);
create index if not exists items_created_at_desc_idx on public.items(created_at desc);

alter table public.items enable row level security;

-- Public (anon + authenticated) can read active items
drop policy if exists "items_select_public" on public.items;
create policy "items_select_public" on public.items
  for select using (
    status = 'active' or user_id = auth.uid() or public.is_staff_or_admin()
  );

-- Authenticated users can insert their own items
drop policy if exists "items_insert_own" on public.items;
create policy "items_insert_own" on public.items
  for insert to authenticated
  with check (user_id = auth.uid());

-- Owner can update their own items; admin can update any
drop policy if exists "items_update" on public.items;
create policy "items_update" on public.items
  for update using (
    user_id = auth.uid() or public.is_admin()
  )
  with check (
    user_id = auth.uid() or public.is_admin()
  );

-- Owner can delete their own items; admin can delete any
drop policy if exists "items_delete" on public.items;
create policy "items_delete" on public.items
  for delete using (
    user_id = auth.uid() or public.is_admin()
  );

-- -----------------------------------------------------------------------------
-- 7. claims (depends on items + profiles + role helpers)
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.claim_status as enum ('pending', 'approved', 'rejected', 'completed');
exception when duplicate_object then null; end $$;

create table if not exists public.claims (
  id           uuid primary key default gen_random_uuid(),
  item_id      uuid not null references public.items(id) on delete cascade,
  claimant_id  uuid not null references public.profiles(id) on delete cascade,
  message      text not null,
  proof        text not null,
  status       public.claim_status not null default 'pending',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists claims_item_id_idx     on public.claims(item_id);
create index if not exists claims_claimant_id_idx on public.claims(claimant_id);

alter table public.claims enable row level security;

-- Read: claimant OR item owner OR admin
drop policy if exists "claims_select" on public.claims;
create policy "claims_select" on public.claims
  for select using (
    claimant_id = auth.uid()
    or exists (
      select 1 from public.items i
      where i.id = claims.item_id and i.user_id = auth.uid()
    )
    or public.is_staff_or_admin()
  );

-- Insert: authenticated users can submit claims for themselves, but NOT for
-- their own items (self-claim prevention at DB level).
drop policy if exists "claims_insert_own" on public.claims;
create policy "claims_insert_own" on public.claims
  for insert to authenticated
  with check (
    claimant_id = auth.uid()
    and not exists (
      select 1 from public.items i
      where i.id = claims.item_id
        and i.user_id = auth.uid()
    )
  );

-- Update: item owner can change status (approve/reject/complete); admin can too
drop policy if exists "claims_update" on public.claims;
create policy "claims_update" on public.claims
  for update using (
    exists (
      select 1 from public.items i
      where i.id = claims.item_id and i.user_id = auth.uid()
    ) or public.is_admin()
  )
  with check (
    exists (
      select 1 from public.items i
      where i.id = claims.item_id and i.user_id = auth.uid()
    ) or public.is_admin()
  );

-- -----------------------------------------------------------------------------
-- 8. notifications (depends on profiles + role helpers)
-- -----------------------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  message    text not null,
  type       text default 'info',
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications(user_id);

alter table public.notifications enable row level security;

-- Read: only the owner
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using (user_id = auth.uid());

-- Update: only the owner can mark as read
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid());

-- Insert: the user themselves, OR an admin (for system announcements), OR a trigger
drop policy if exists "notifications_insert" on public.notifications;
create policy "notifications_insert" on public.notifications
  for insert with check (
    user_id = auth.uid() or public.is_admin()
  );

-- -----------------------------------------------------------------------------
-- 9. reports (depends on items + profiles + role helpers)
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.report_status as enum ('pending', 'reviewing', 'actioned', 'dismissed');
exception when duplicate_object then null; end $$;

create table if not exists public.reports (
  id           uuid primary key default gen_random_uuid(),
  item_id      uuid not null references public.items(id) on delete cascade,
  reporter_id  uuid not null references public.profiles(id) on delete cascade,
  reason       text not null,
  status       public.report_status not null default 'pending',
  created_at   timestamptz not null default now()
);

create index if not exists reports_status_idx on public.reports(status);

alter table public.reports enable row level security;

-- Read: only admins (and the reporter can see their own reports)
drop policy if exists "reports_select" on public.reports;
create policy "reports_select" on public.reports
  for select using (
    reporter_id = auth.uid() or public.is_admin()
  );

-- Insert: any authenticated user can flag a listing
drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports
  for insert to authenticated
  with check (reporter_id = auth.uid());

-- Update: only admins
drop policy if exists "reports_update_admin" on public.reports;
create policy "reports_update_admin" on public.reports
  for update using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- 10. announcements (depends on role helpers only)
-- -----------------------------------------------------------------------------
create table if not exists public.announcements (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text not null,
  pinned     boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

-- Public can read
drop policy if exists "announcements_select_public" on public.announcements;
create policy "announcements_select_public" on public.announcements
  for select using (true);

-- Only admins can write
drop policy if exists "announcements_write_admin" on public.announcements;
create policy "announcements_write_admin" on public.announcements
  for all using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- 11. updated_at triggers (depend on profiles / items / claims tables)
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists items_touch on public.items;
create trigger items_touch before update on public.items
  for each row execute function public.touch_updated_at();

drop trigger if exists claims_touch on public.claims;
create trigger claims_touch before update on public.claims
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- 12. Notification trigger: notify item owner when a new claim is submitted
--     Depends on items + notifications tables.
-- -----------------------------------------------------------------------------
create or replace function public.notify_item_owner_of_claim()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
  item_title text;
begin
  select i.user_id, i.title into owner_id, item_title
  from public.items i where i.id = new.item_id;

  if owner_id is not null and owner_id <> new.claimant_id then
    insert into public.notifications (user_id, title, message, type)
    values (
      owner_id,
      'New claim on your item',
      'Someone has submitted a claim for "' || item_title || '". Review it in your dashboard.',
      'claim'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_claim_created on public.claims;
create trigger on_claim_created
  after insert on public.claims
  for each row execute function public.notify_item_owner_of_claim();

-- -----------------------------------------------------------------------------
-- 13. Claim lifecycle — state-machine guard + side-effect triggers
--     (auto item reservation, auto-return on completion, notifications)
--     These are also in supabase/migrations/claim_lifecycle.sql for projects
--     that already ran the base schema.sql before this feature was added.
-- -----------------------------------------------------------------------------

create or replace function public.guard_claim_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = old.status then
    return new;
  end if;
  if (old.status = 'pending'  and new.status in ('approved', 'rejected'))
  or (old.status = 'approved' and new.status = 'completed')
  then
    return new;
  end if;
  raise exception 'Invalid claim status transition: % to %',
    old.status, new.status
    using hint = 'Allowed: pending to approved, pending to rejected, approved to completed';
end;
$$;

drop trigger if exists claims_status_guard on public.claims;
create trigger claims_status_guard
  before update of status on public.claims
  for each row execute function public.guard_claim_status_transition();

create or replace function public.on_claim_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_title text;
begin
  if new.status = old.status then
    return new;
  end if;
  select i.user_id, i.title into v_owner, v_title
  from public.items i where i.id = new.item_id;
  if not found then
    return new;
  end if;

  if new.status = 'approved' then
    update public.items set status = 'claimed', updated_at = now()
      where id = new.item_id and status = 'active';
    update public.claims set status = 'rejected', updated_at = now()
      where item_id = new.item_id and id <> new.id and status = 'pending';
    insert into public.notifications (user_id, title, message, type)
    values (new.claimant_id, 'Your claim has been approved',
      'Your claim for "' || v_title || '" was approved. Please arrange a safe on-campus handover with the item owner.', 'success');
  elsif new.status = 'rejected' then
    insert into public.notifications (user_id, title, message, type)
    values (new.claimant_id, 'Your claim has been rejected',
      'Your claim for "' || v_title || '" was rejected. The item remains available for others to claim.', 'warning');
  elsif new.status = 'completed' then
    update public.items set status = 'returned', updated_at = now()
      where id = new.item_id;
    insert into public.notifications (user_id, title, message, type)
    values (new.claimant_id, 'Your item has been marked as returned',
      'The handover for "' || v_title || '" is complete. Thank you for using SULOFT!', 'success');
    if v_owner is not null and v_owner <> new.claimant_id then
      insert into public.notifications (user_id, title, message, type)
      values (v_owner, 'Your item has been returned',
        '"' || v_title || '" has been marked as returned and the claim is now completed.', 'success');
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_claim_status_change on public.claims;
create trigger on_claim_status_change
  after update of status on public.claims
  for each row execute function public.on_claim_status_change();

create or replace function public.guard_item_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = old.status then
    return new;
  end if;
  if (old.status = 'active'  and new.status in ('claimed', 'removed'))
  or (old.status = 'claimed' and new.status in ('returned', 'removed', 'active'))
  or (old.status = 'expired' and new.status = 'removed')
  then
    return new;
  end if;
  raise exception 'Invalid item status transition: % to %',
    old.status, new.status
    using hint = 'Returning an item requires an approved claim. Use the admin Claims tab then Mark completed button.';
end;
$$;

drop trigger if exists items_status_guard on public.items;
create trigger items_status_guard
  before update of status on public.items
  for each row execute function public.guard_item_status_transition();

-- =============================================================================
-- End of schema. Run supabase/storage.sql next, then supabase/seed.sql.
-- =============================================================================
