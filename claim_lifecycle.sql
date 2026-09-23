-- SULOFT — Claim Lifecycle Migration
-- =============================================================================
-- Run this file in your Supabase SQL Editor AFTER supabase/schema.sql.
-- It is idempotent — safe to re-run.
--
-- Purpose:
--   1. State-machine guard: prevent illegal claim status transitions
--   2. Auto-update item status when a claim is approved/completed
--   3. Auto-create notifications for claimant and owner on status changes
--   4. Strengthen claims_insert_own RLS: prevent self-claiming
--   5. Guard item status transitions: prevent active → returned bypass
--
-- This migration does NOT:
--   • Drop any table
--   • Delete any data
--   • Remove any existing RLS policy without replacing it with a stronger one
--   • Change any column type
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. State-machine guard: prevent illegal claim status transitions
--    Allowed: pending → approved | rejected, approved → completed
--    Blocked: pending → completed, rejected → anything, completed → anything
-- -----------------------------------------------------------------------------

create or replace function public.guard_claim_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only enforce when status is actually changing
  if new.status = old.status then
    return new;
  end if;

  -- Allowed transitions
  if (old.status = 'pending'  and new.status in ('approved', 'rejected'))
  or (old.status = 'approved' and new.status = 'completed')
  then
    return new;
  end if;

  -- Everything else is illegal
  raise exception 'Invalid claim status transition: % to %',
    old.status, new.status
    using hint = 'Allowed: pending to approved, pending to rejected, approved to completed';
end;
$$;

drop trigger if exists claims_status_guard on public.claims;
create trigger claims_status_guard
  before update of status on public.claims
  for each row execute function public.guard_claim_status_transition();

-- -----------------------------------------------------------------------------
-- 2. Side-effects on claim status change: item state + notifications
-- -----------------------------------------------------------------------------

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
  -- Only act when status actually changed
  if new.status = old.status then
    return new;
  end if;

  -- Fetch the related item owner and title
  select i.user_id, i.title into v_owner, v_title
  from public.items i where i.id = new.item_id;
  if not found then
    return new;
  end if;

  -- APPROVED
  if new.status = 'approved' then
    -- Reserve the item
    update public.items
       set status = 'claimed', updated_at = now()
     where id = new.item_id and status = 'active';

    -- Reject all OTHER pending claims on the same item
    update public.claims
       set status = 'rejected', updated_at = now()
     where item_id = new.item_id
       and id <> new.id
       and status = 'pending';

    -- Notify the claimant
    insert into public.notifications (user_id, title, message, type)
    values (
      new.claimant_id,
      'Your claim has been approved',
      'Your claim for "' || v_title || '" was approved. Please arrange a safe on-campus handover with the item owner.',
      'success'
    );

  -- REJECTED
  elsif new.status = 'rejected' then
    insert into public.notifications (user_id, title, message, type)
    values (
      new.claimant_id,
      'Your claim has been rejected',
      'Your claim for "' || v_title || '" was rejected. The item remains available for others to claim.',
      'warning'
    );

  -- COMPLETED (item returned)
  elsif new.status = 'completed' then
    -- Mark the item as returned
    update public.items
       set status = 'returned', updated_at = now()
     where id = new.item_id;

    -- Notify the claimant
    insert into public.notifications (user_id, title, message, type)
    values (
      new.claimant_id,
      'Your item has been marked as returned',
      'The handover for "' || v_title || '" is complete. Thank you for using SULOFT!',
      'success'
    );

    -- Notify the item owner (if different from claimant)
    if v_owner is not null and v_owner <> new.claimant_id then
      insert into public.notifications (user_id, title, message, type)
      values (
        v_owner,
        'Your item has been returned',
        '"' || v_title || '" has been marked as returned and the claim is now completed.',
        'success'
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_claim_status_change on public.claims;
create trigger on_claim_status_change
  after update of status on public.claims
  for each row execute function public.on_claim_status_change();

-- -----------------------------------------------------------------------------
-- 3. Guard: prevent marking an item as 'returned' directly without a
--    completed claim. The return flow must go through the claim completion.
--    Allowed: active → claimed, active → removed, claimed → returned/removed/active
--    Blocked: active → returned, returned → anything
-- -----------------------------------------------------------------------------

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

-- -----------------------------------------------------------------------------
-- 4. Strengthen claims INSERT policy: prevent self-claiming
--    Original: claimant_id = auth.uid()
--    New: claimant_id = auth.uid() AND item owner is NOT auth.uid()
-- -----------------------------------------------------------------------------

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

-- =============================================================================
-- End of migration. You must run this in your Supabase SQL Editor.
-- =============================================================================
