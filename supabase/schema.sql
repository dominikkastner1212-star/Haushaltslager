create extension if not exists pgcrypto;

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Mein Haushalt',
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table if not exists public.pantry_states (
  household_id uuid primary key references public.households(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.pantry_states enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.households to authenticated;
grant select, insert, update, delete on public.household_members to authenticated;
grant select, insert, update, delete on public.pantry_states to authenticated;

drop policy if exists "households_select_own" on public.households;
drop policy if exists "households_insert_own" on public.households;
drop policy if exists "households_update_own" on public.households;
drop policy if exists "households_delete_own" on public.households;

create policy "households_select_own"
on public.households for select
to authenticated
using (owner_id = (select auth.uid()));

create policy "households_insert_own"
on public.households for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy "households_update_own"
on public.households for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "households_delete_own"
on public.households for delete
to authenticated
using (owner_id = (select auth.uid()));

drop policy if exists "household_members_select_own" on public.household_members;
drop policy if exists "household_members_insert_owned_household" on public.household_members;
drop policy if exists "household_members_update_owned_household" on public.household_members;
drop policy if exists "household_members_delete_owned_household" on public.household_members;

create policy "household_members_select_own"
on public.household_members for select
to authenticated
using (user_id = (select auth.uid()));

create policy "household_members_insert_owned_household"
on public.household_members for insert
to authenticated
with check (
  exists (
    select 1
    from public.households h
    where h.id = household_members.household_id
      and h.owner_id = (select auth.uid())
  )
);

create policy "household_members_update_owned_household"
on public.household_members for update
to authenticated
using (
  exists (
    select 1
    from public.households h
    where h.id = household_members.household_id
      and h.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.households h
    where h.id = household_members.household_id
      and h.owner_id = (select auth.uid())
  )
);

create policy "household_members_delete_owned_household"
on public.household_members for delete
to authenticated
using (
  exists (
    select 1
    from public.households h
    where h.id = household_members.household_id
      and h.owner_id = (select auth.uid())
  )
);

drop policy if exists "pantry_states_select_member" on public.pantry_states;
drop policy if exists "pantry_states_insert_member" on public.pantry_states;
drop policy if exists "pantry_states_update_member" on public.pantry_states;
drop policy if exists "pantry_states_delete_member" on public.pantry_states;

create policy "pantry_states_select_member"
on public.pantry_states for select
to authenticated
using (
  exists (
    select 1
    from public.household_members hm
    where hm.household_id = pantry_states.household_id
      and hm.user_id = (select auth.uid())
  )
);

create policy "pantry_states_insert_member"
on public.pantry_states for insert
to authenticated
with check (
  exists (
    select 1
    from public.household_members hm
    where hm.household_id = pantry_states.household_id
      and hm.user_id = (select auth.uid())
  )
);

create policy "pantry_states_update_member"
on public.pantry_states for update
to authenticated
using (
  exists (
    select 1
    from public.household_members hm
    where hm.household_id = pantry_states.household_id
      and hm.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.household_members hm
    where hm.household_id = pantry_states.household_id
      and hm.user_id = (select auth.uid())
  )
);

create policy "pantry_states_delete_member"
on public.pantry_states for delete
to authenticated
using (
  exists (
    select 1
    from public.household_members hm
    where hm.household_id = pantry_states.household_id
      and hm.user_id = (select auth.uid())
  )
);
