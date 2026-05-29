-- =============================================================================
-- RBAC — Role-Based Access Control
-- Custom auth: profiles = hotel_management_users
-- Run after schema.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Profiles view (alias for application users)
-- -----------------------------------------------------------------------------
create or replace view public.hotel_management_profiles as
select
  id,
  full_name,
  email,
  role,
  is_active,
  created_at,
  updated_at
from public.hotel_management_users;

comment on view public.hotel_management_profiles is
  'User profiles for RBAC — backed by hotel_management_users (custom auth, not Supabase Auth)';

-- -----------------------------------------------------------------------------
-- 2. Normalize role: fnb -> fnb_manager
-- -----------------------------------------------------------------------------
alter table public.hotel_management_users
  drop constraint if exists hotel_management_users_role_check;

update public.hotel_management_users set role = 'fnb_manager' where role = 'fnb';

alter table public.hotel_management_users
  add constraint hotel_management_users_role_check
  check (role in ('admin', 'front_desk', 'housekeeping', 'fnb_manager', 'accounts', 'maintenance_staff'));

-- -----------------------------------------------------------------------------
-- 3. Permissions table
-- -----------------------------------------------------------------------------
drop table if exists public.hotel_management_permissions cascade;

create table public.hotel_management_permissions (
  id          uuid primary key default gen_random_uuid(),
  role        text not null,
  module      text not null,
  can_view    boolean not null default false,
  can_create  boolean not null default false,
  can_update  boolean not null default false,
  can_delete  boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (role, module)
);

comment on table public.hotel_management_permissions is
  'Module-level CRUD permissions per application role';

alter table public.hotel_management_permissions enable row level security;

-- -----------------------------------------------------------------------------
-- 4. Request context (set by API before user-scoped queries)
-- -----------------------------------------------------------------------------
create or replace function public.set_request_context(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform set_config('app.user_id', p_user_id::text, true);
  perform set_config('app.role', p_role, true);
end;
$$;

-- -----------------------------------------------------------------------------
-- 5. get_my_role()
-- -----------------------------------------------------------------------------
create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    nullif(current_setting('app.role', true), ''),
    (select role from public.hotel_management_users where id = nullif(current_setting('app.user_id', true), '')::uuid),
    'anonymous'
  );
$$;

-- -----------------------------------------------------------------------------
-- 6. has_permission(module_name, action_name)
-- action_name: view | create | update | delete
-- -----------------------------------------------------------------------------
create or replace function public.has_permission(module_name text, action_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  r text;
  allowed boolean;
begin
  r := public.get_my_role();

  if r = 'admin' then
    return true;
  end if;

  select case lower(action_name)
    when 'view' then p.can_view
    when 'create' then p.can_create
    when 'update' then p.can_update
    when 'delete' then p.can_delete
    else false
  end into allowed
  from public.hotel_management_permissions p
  where p.role = r and p.module = module_name;

  return coalesce(allowed, false);
end;
$$;

-- -----------------------------------------------------------------------------
-- 6b. Controlled maintenance updates for maintenance_staff
-- -----------------------------------------------------------------------------
create or replace function public.update_maintenance_status(
  request_id uuid,
  new_status text,
  note text default null,
  material text default null,
  resolution text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r text;
  uid uuid;
  current_status text;
  assigned uuid;
begin
  r := public.get_my_role();
  uid := nullif(current_setting('app.user_id', true), '')::uuid;

  if uid is null then
    raise exception 'Unauthorized';
  end if;

  select status, assigned_to into current_status, assigned
  from public.hotel_management_maintenance_requests
  where id = request_id;

  if not found then
    raise exception 'Not found';
  end if;

  -- Only maintenance_staff is allowed to use this RPC.
  if r <> 'maintenance_staff' then
    raise exception 'Forbidden';
  end if;

  if assigned is distinct from uid then
    raise exception 'Forbidden';
  end if;

  -- Allowed transitions: assigned -> in_progress -> resolved
  if current_status = 'assigned' and new_status <> 'in_progress' then
    raise exception 'Invalid transition';
  end if;
  if current_status = 'in_progress' and new_status <> 'resolved' then
    raise exception 'Invalid transition';
  end if;
  if current_status not in ('assigned', 'in_progress') then
    raise exception 'Invalid transition';
  end if;

  update public.hotel_management_maintenance_requests
  set
    status = new_status,
    work_note = coalesce(note, work_note),
    material_required = coalesce(material, material_required),
    resolution_note = coalesce(resolution, resolution_note),
    started_at = case when new_status = 'in_progress' then now() else started_at end,
    resolved_at = case when new_status = 'resolved' then now() else resolved_at end,
    updated_at = now()
  where id = request_id;

  -- Never set room available here. Caller handles room status workflow.
end;
$$;

create or replace function public.update_maintenance_note(
  request_id uuid,
  note text default null,
  material text default null,
  resolution text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r text;
  uid uuid;
  assigned uuid;
begin
  r := public.get_my_role();
  uid := nullif(current_setting('app.user_id', true), '')::uuid;

  if uid is null then
    raise exception 'Unauthorized';
  end if;

  if r <> 'maintenance_staff' then
    raise exception 'Forbidden';
  end if;

  select assigned_to into assigned
  from public.hotel_management_maintenance_requests
  where id = request_id;

  if not found then
    raise exception 'Not found';
  end if;

  if assigned is distinct from uid then
    raise exception 'Forbidden';
  end if;

  update public.hotel_management_maintenance_requests
  set
    work_note = coalesce(note, work_note),
    material_required = coalesce(material, material_required),
    resolution_note = coalesce(resolution, resolution_note),
    updated_at = now()
  where id = request_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- 7. Seed default permissions
-- -----------------------------------------------------------------------------
insert into public.hotel_management_permissions (role, module, can_view, can_create, can_update, can_delete)
values
  -- Admin: full access (explicit; get_my_role admin bypasses checks)
  ('admin', 'dashboard', true, true, true, true),
  ('admin', 'rooms', true, true, true, true),
  ('admin', 'reservations', true, true, true, true),
  ('admin', 'checkin_checkout', true, true, true, true),
  ('admin', 'housekeeping', true, true, true, true),
  ('admin', 'maintenance', true, true, true, true),
  ('admin', 'fnb_pos', true, true, true, true),
  ('admin', 'billing', true, true, true, true),
  ('admin', 'reports', true, true, true, true),
  ('admin', 'settings', true, true, true, true),
  ('admin', 'user_management', true, true, true, true),

  -- Front Desk
  ('front_desk', 'dashboard', true, false, false, false),
  ('front_desk', 'rooms', true, false, false, false),
  ('front_desk', 'reservations', true, true, true, false),
  ('front_desk', 'checkin_checkout', true, true, true, false),
  ('front_desk', 'housekeeping', false, false, false, false),
  ('front_desk', 'maintenance', true, true, false, false),
  ('front_desk', 'fnb_pos', false, false, false, false),
  ('front_desk', 'billing', false, false, false, false),
  ('front_desk', 'reports', false, false, false, false),
  ('front_desk', 'settings', false, false, false, false),
  ('front_desk', 'user_management', false, false, false, false),

  -- Housekeeping
  ('housekeeping', 'dashboard', true, false, false, false),
  ('housekeeping', 'rooms', true, false, false, false),
  ('housekeeping', 'reservations', false, false, false, false),
  ('housekeeping', 'checkin_checkout', false, false, false, false),
  ('housekeeping', 'housekeeping', true, false, true, false),
  ('housekeeping', 'maintenance', true, true, false, false),
  ('housekeeping', 'fnb_pos', false, false, false, false),
  ('housekeeping', 'billing', false, false, false, false),
  ('housekeeping', 'reports', false, false, false, false),
  ('housekeeping', 'settings', false, false, false, false),
  ('housekeeping', 'user_management', false, false, false, false),

  -- Maintenance Staff
  ('maintenance_staff', 'dashboard', true, false, false, false),
  ('maintenance_staff', 'rooms', true, false, false, false),
  ('maintenance_staff', 'maintenance', true, false, true, false),

  -- F&B Manager
  ('fnb_manager', 'dashboard', true, false, false, false),
  ('fnb_manager', 'rooms', false, false, false, false),
  ('fnb_manager', 'reservations', false, false, false, false),
  ('fnb_manager', 'checkin_checkout', false, false, false, false),
  ('fnb_manager', 'housekeeping', false, false, false, false),
  ('fnb_manager', 'fnb_pos', true, true, true, false),
  ('fnb_manager', 'billing', false, false, false, false),
  ('fnb_manager', 'reports', false, false, false, false),
  ('fnb_manager', 'settings', false, false, false, false),
  ('fnb_manager', 'user_management', false, false, false, false),

  -- Accounts
  ('accounts', 'dashboard', true, false, false, false),
  ('accounts', 'rooms', false, false, false, false),
  ('accounts', 'reservations', false, false, false, false),
  ('accounts', 'checkin_checkout', false, false, false, false),
  ('accounts', 'housekeeping', false, false, false, false),
  ('accounts', 'fnb_pos', false, false, false, false),
  ('accounts', 'billing', true, true, true, false),
  ('accounts', 'reports', true, false, false, false),
  ('accounts', 'settings', false, false, false, false),
  ('accounts', 'user_management', false, false, false, false)
on conflict (role, module) do update set
  can_view = excluded.can_view,
  can_create = excluded.can_create,
  can_update = excluded.can_update,
  can_delete = excluded.can_delete;

-- -----------------------------------------------------------------------------
-- 8. Demo users (password123 via bcrypt in seed / app)
-- Fixed UUIDs match src/app/api/auth/login/route.ts for assignments.
-- -----------------------------------------------------------------------------
insert into public.hotel_management_users (id, email, password_hash, full_name, role)
values
  ('00000000-0000-0000-0000-000000000011', 'admin@iimdemo.com', crypt('password123', gen_salt('bf', 10)), 'Demo Admin', 'admin'),
  ('00000000-0000-0000-0000-000000000012', 'frontdesk@iimdemo.com', crypt('password123', gen_salt('bf', 10)), 'Demo Front Desk', 'front_desk'),
  ('00000000-0000-0000-0000-000000000013', 'housekeeping@iimdemo.com', crypt('password123', gen_salt('bf', 10)), 'Demo Housekeeping', 'housekeeping'),
  ('00000000-0000-0000-0000-000000000016', 'housekeeping1@iimdemo.com', crypt('password123', gen_salt('bf', 10)), 'Housekeeping Staff 1', 'housekeeping'),
  ('00000000-0000-0000-0000-000000000017', 'housekeeping2@iimdemo.com', crypt('password123', gen_salt('bf', 10)), 'Housekeeping Staff 2', 'housekeeping'),
  ('00000000-0000-0000-0000-000000000018', 'maintenance1@iimdemo.com', crypt('password123', gen_salt('bf', 10)), 'Maintenance Staff 1', 'maintenance_staff'),
  ('00000000-0000-0000-0000-000000000014', 'fnb@iimdemo.com', crypt('password123', gen_salt('bf', 10)), 'Demo F&B Manager', 'fnb_manager'),
  ('00000000-0000-0000-0000-000000000015', 'accounts@iimdemo.com', crypt('password123', gen_salt('bf', 10)), 'Demo Accounts', 'accounts')
on conflict (email) do update set
  full_name = excluded.full_name,
  role = excluded.role,
  password_hash = excluded.password_hash,
  is_active = true;

-- -----------------------------------------------------------------------------
-- 9. RLS — profiles / users
-- -----------------------------------------------------------------------------
drop policy if exists "users_select_own_or_admin" on public.hotel_management_users;
create policy "users_select_own_or_admin"
  on public.hotel_management_users for select
  using (
    public.get_my_role() = 'admin'
    or id = nullif(current_setting('app.user_id', true), '')::uuid
  );

drop policy if exists "users_admin_all" on public.hotel_management_users;
create policy "users_admin_all"
  on public.hotel_management_users for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- -----------------------------------------------------------------------------
-- 10. RLS — permissions (read all authenticated context; admin writes)
-- -----------------------------------------------------------------------------
drop policy if exists "permissions_select" on public.hotel_management_permissions;
create policy "permissions_select"
  on public.hotel_management_permissions for select
  using (current_setting('app.user_id', true) is not null and current_setting('app.user_id', true) <> '');

drop policy if exists "permissions_admin_write" on public.hotel_management_permissions;
create policy "permissions_admin_write"
  on public.hotel_management_permissions for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- -----------------------------------------------------------------------------
-- 11. RLS — business tables (defense in depth when using user-scoped client)
-- -----------------------------------------------------------------------------
-- Rooms
drop policy if exists "rooms_select" on public.hotel_management_rooms;
create policy "rooms_select" on public.hotel_management_rooms for select
  using (public.has_permission('rooms', 'view'));

drop policy if exists "rooms_insert" on public.hotel_management_rooms;
create policy "rooms_insert" on public.hotel_management_rooms for insert
  with check (public.has_permission('rooms', 'create'));

drop policy if exists "rooms_update" on public.hotel_management_rooms;
create policy "rooms_update" on public.hotel_management_rooms for update
  using (public.has_permission('rooms', 'update') and public.get_my_role() <> 'maintenance_staff');

drop policy if exists "rooms_delete" on public.hotel_management_rooms;
create policy "rooms_delete" on public.hotel_management_rooms for delete
  using (public.has_permission('rooms', 'delete'));

-- Reservations
drop policy if exists "reservations_select" on public.hotel_management_reservations;
create policy "reservations_select" on public.hotel_management_reservations for select
  using (public.has_permission('reservations', 'view'));

drop policy if exists "reservations_insert" on public.hotel_management_reservations;
create policy "reservations_insert" on public.hotel_management_reservations for insert
  with check (public.has_permission('reservations', 'create'));

drop policy if exists "reservations_update" on public.hotel_management_reservations;
create policy "reservations_update" on public.hotel_management_reservations for update
  using (public.has_permission('reservations', 'update'));

drop policy if exists "reservations_delete" on public.hotel_management_reservations;
create policy "reservations_delete" on public.hotel_management_reservations for delete
  using (public.has_permission('reservations', 'delete'));

-- Check-ins
drop policy if exists "checkins_select" on public.hotel_management_checkins;
create policy "checkins_select" on public.hotel_management_checkins for select
  using (public.has_permission('checkin_checkout', 'view'));

drop policy if exists "checkins_write" on public.hotel_management_checkins;
create policy "checkins_write" on public.hotel_management_checkins for all
  using (public.has_permission('checkin_checkout', 'update') or public.has_permission('checkin_checkout', 'create'))
  with check (public.has_permission('checkin_checkout', 'update') or public.has_permission('checkin_checkout', 'create'));

-- Housekeeping tasks — extended columns (safe to re-run)
alter table public.hotel_management_housekeeping_tasks
  add column if not exists task_type text default 'cleaning',
  add column if not exists due_date timestamptz,
  add column if not exists created_by uuid references public.hotel_management_users(id) on delete set null;

create index if not exists idx_hm_hk_assigned_to
  on public.hotel_management_housekeeping_tasks (assigned_to);
create index if not exists idx_hm_hk_status
  on public.hotel_management_housekeeping_tasks (status);

-- Housekeeping tasks
drop policy if exists "hk_select" on public.hotel_management_housekeeping_tasks;
create policy "hk_select" on public.hotel_management_housekeeping_tasks for select
  using (public.has_permission('housekeeping', 'view'));

drop policy if exists "hk_write" on public.hotel_management_housekeeping_tasks;
create policy "hk_write" on public.hotel_management_housekeeping_tasks for all
  using (public.has_permission('housekeeping', 'update') or public.has_permission('housekeeping', 'create'))
  with check (public.has_permission('housekeeping', 'update') or public.has_permission('housekeeping', 'create'));

-- Maintenance
-- Make maintenance workflow columns idempotent (safe to re-run).
alter table public.hotel_management_maintenance_requests
  add column if not exists assigned_to uuid references public.hotel_management_users(id) on delete set null,
  add column if not exists issue_type text default 'other',
  add column if not exists material_required text,
  add column if not exists resolution_note text,
  add column if not exists work_note text,
  add column if not exists reported_at timestamptz default now(),
  add column if not exists started_at timestamptz,
  add column if not exists resolved_at timestamptz,
  add column if not exists closed_at timestamptz;

alter table public.hotel_management_maintenance_requests
  drop constraint if exists hotel_management_maintenance_requests_status_check;

alter table public.hotel_management_maintenance_requests
  add constraint hotel_management_maintenance_requests_status_check
  check (status in ('open', 'assigned', 'in_progress', 'resolved', 'closed'));

create index if not exists idx_hm_maint_assigned_to
  on public.hotel_management_maintenance_requests (assigned_to);
create index if not exists idx_hm_maint_status
  on public.hotel_management_maintenance_requests (status);

drop policy if exists "maint_select" on public.hotel_management_maintenance_requests;
create policy "maint_select" on public.hotel_management_maintenance_requests for select
  using (
    public.has_permission('maintenance', 'view')
    and (
      public.get_my_role() <> 'maintenance_staff'
      or assigned_to = nullif(current_setting('app.user_id', true), '')::uuid
    )
  );

drop policy if exists "maint_insert" on public.hotel_management_maintenance_requests;
create policy "maint_insert" on public.hotel_management_maintenance_requests for insert
  with check (public.has_permission('maintenance', 'create'));

drop policy if exists "maint_update" on public.hotel_management_maintenance_requests;
create policy "maint_update" on public.hotel_management_maintenance_requests for update
  using (
    public.has_permission('maintenance', 'update')
    and public.get_my_role() <> 'maintenance_staff'
  )
  with check (
    public.has_permission('maintenance', 'update')
    and public.get_my_role() <> 'maintenance_staff'
  );

drop policy if exists "maint_delete" on public.hotel_management_maintenance_requests;
create policy "maint_delete" on public.hotel_management_maintenance_requests for delete
  using (public.get_my_role() = 'admin');

-- F&B
drop policy if exists "fnb_items_select" on public.hotel_management_fnb_items;
create policy "fnb_items_select" on public.hotel_management_fnb_items for select
  using (public.has_permission('fnb_pos', 'view'));

drop policy if exists "fnb_orders_select" on public.hotel_management_fnb_orders;
create policy "fnb_orders_select" on public.hotel_management_fnb_orders for select
  using (public.has_permission('fnb_pos', 'view'));

drop policy if exists "fnb_orders_write" on public.hotel_management_fnb_orders;
create policy "fnb_orders_write" on public.hotel_management_fnb_orders for all
  using (public.has_permission('fnb_pos', 'create') or public.has_permission('fnb_pos', 'update'))
  with check (public.has_permission('fnb_pos', 'create') or public.has_permission('fnb_pos', 'update'));

-- Invoices / billing
drop policy if exists "invoices_select" on public.hotel_management_invoices;
create policy "invoices_select" on public.hotel_management_invoices for select
  using (public.has_permission('billing', 'view'));

drop policy if exists "invoices_insert" on public.hotel_management_invoices;
create policy "invoices_insert" on public.hotel_management_invoices for insert
  with check (public.has_permission('billing', 'create'));

drop policy if exists "invoices_update" on public.hotel_management_invoices;
create policy "invoices_update" on public.hotel_management_invoices for update
  using (public.has_permission('billing', 'update'));

drop policy if exists "invoices_delete" on public.hotel_management_invoices;
create policy "invoices_delete" on public.hotel_management_invoices for delete
  using (public.has_permission('billing', 'delete'));

drop policy if exists "invoice_items_select" on public.hotel_management_invoice_items;
create policy "invoice_items_select" on public.hotel_management_invoice_items for select
  using (public.has_permission('billing', 'view'));

drop policy if exists "payments_select" on public.hotel_management_payments;
create policy "payments_select" on public.hotel_management_payments for select
  using (public.has_permission('billing', 'view'));

drop policy if exists "payments_write" on public.hotel_management_payments;
create policy "payments_write" on public.hotel_management_payments for all
  using (public.has_permission('billing', 'create') or public.has_permission('billing', 'update'))
  with check (public.has_permission('billing', 'create') or public.has_permission('billing', 'update'));

-- Guests (needed for reservations / billing modules)
drop policy if exists "guests_select" on public.hotel_management_guests;
create policy "guests_select" on public.hotel_management_guests for select
  using (
    public.has_permission('reservations', 'view')
    or public.has_permission('checkin_checkout', 'view')
    or public.has_permission('billing', 'view')
    or public.has_permission('fnb_pos', 'view')
  );

drop policy if exists "guests_write" on public.hotel_management_guests;
create policy "guests_write" on public.hotel_management_guests for all
  using (
    public.has_permission('reservations', 'create')
    or public.has_permission('reservations', 'update')
    or public.has_permission('checkin_checkout', 'create')
  )
  with check (
    public.has_permission('reservations', 'create')
    or public.has_permission('reservations', 'update')
    or public.has_permission('checkin_checkout', 'create')
  );

-- Room types / rate plans (settings / read for operations)
drop policy if exists "room_types_select" on public.hotel_management_room_types;
create policy "room_types_select" on public.hotel_management_room_types for select
  using (
    public.has_permission('rooms', 'view')
    or public.has_permission('reservations', 'view')
    or public.has_permission('settings', 'view')
  );

drop policy if exists "rate_plans_select" on public.hotel_management_rate_plans;
create policy "rate_plans_select" on public.hotel_management_rate_plans for select
  using (
    public.has_permission('reservations', 'view')
    or public.has_permission('settings', 'view')
  );
