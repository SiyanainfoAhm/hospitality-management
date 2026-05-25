-- =============================================================================
-- HOSPITALITY MANAGEMENT SYSTEM — Supabase PostgreSQL Schema
-- IIM Nagpur Institutional Guest House (82 rooms)
-- Custom Authentication (no Supabase Auth dependency)
-- =============================================================================

-- =============================================================================
-- 0. DROP EXISTING TABLES (reverse dependency order)
-- =============================================================================

-- Drop old tables (without prefix) from previous schema run
drop table if exists public.audit_logs cascade;
drop table if exists public.payments cascade;
drop table if exists public.invoice_items cascade;
drop table if exists public.invoices cascade;
drop table if exists public.fnb_order_items cascade;
drop table if exists public.fnb_orders cascade;
drop table if exists public.fnb_items cascade;
drop table if exists public.fnb_categories cascade;
drop table if exists public.maintenance_requests cascade;
drop table if exists public.housekeeping_tasks cascade;
drop table if exists public.checkins cascade;
drop table if exists public.reservation_addons cascade;
drop table if exists public.reservations cascade;
drop table if exists public.guests cascade;
drop table if exists public.seasons cascade;
drop table if exists public.rate_plans cascade;
drop table if exists public.rooms cascade;
drop table if exists public.room_types cascade;
drop table if exists public.sessions cascade;
drop table if exists public.users cascade;
drop table if exists public.profiles cascade;

-- Drop new prefixed tables (in case of re-run)
drop table if exists public.hotel_management_audit_logs cascade;
drop table if exists public.hotel_management_payments cascade;
drop table if exists public.hotel_management_invoice_items cascade;
drop table if exists public.hotel_management_invoices cascade;
drop table if exists public.hotel_management_fnb_order_items cascade;
drop table if exists public.hotel_management_fnb_orders cascade;
drop table if exists public.hotel_management_fnb_items cascade;
drop table if exists public.hotel_management_fnb_categories cascade;
drop table if exists public.hotel_management_maintenance_requests cascade;
drop table if exists public.hotel_management_housekeeping_tasks cascade;
drop table if exists public.hotel_management_checkins cascade;
drop table if exists public.hotel_management_reservation_addons cascade;
drop table if exists public.hotel_management_reservations cascade;
drop table if exists public.hotel_management_guests cascade;
drop table if exists public.hotel_management_seasons cascade;
drop table if exists public.hotel_management_rate_plans cascade;
drop table if exists public.hotel_management_rooms cascade;
drop table if exists public.hotel_management_room_types cascade;
drop table if exists public.hotel_management_sessions cascade;
drop table if exists public.hotel_management_users cascade;

-- =============================================================================
-- 1. EXTENSIONS
-- =============================================================================

create extension if not exists "pgcrypto";

-- =============================================================================
-- 2. HELPER FUNCTIONS
-- =============================================================================

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.hash_password(raw_password text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  return crypt(raw_password, gen_salt('bf', 10));
end;
$$;

create or replace function public.verify_password(raw_password text, hashed_password text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  return hashed_password = crypt(raw_password, hashed_password);
end;
$$;

-- =============================================================================
-- 3. TABLES — created in dependency order
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 3.1  hotel_management_users
-- ---------------------------------------------------------------------------
create table public.hotel_management_users (
  id              uuid primary key default gen_random_uuid(),
  email           text unique not null,
  password_hash   text not null,
  full_name       text,
  role            text not null default 'front_desk'
                  check (role in ('admin', 'front_desk', 'housekeeping', 'fnb', 'accounts')),
  avatar_url      text,
  is_active       boolean not null default true,
  last_login_at   timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table  public.hotel_management_users              is 'Application users with credentials — custom auth';
comment on column public.hotel_management_users.role         is 'Application role governing UI permissions';
comment on column public.hotel_management_users.password_hash is 'bcrypt hash via pgcrypto';

-- ---------------------------------------------------------------------------
-- 3.2  hotel_management_sessions
-- ---------------------------------------------------------------------------
create table public.hotel_management_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.hotel_management_users on delete cascade,
  token_hash    text not null,
  expires_at    timestamptz not null,
  ip_address    text,
  user_agent    text,
  created_at    timestamptz not null default now()
);

comment on table public.hotel_management_sessions is 'Active login sessions — tokens verified on each request';

-- ---------------------------------------------------------------------------
-- 3.3  hotel_management_room_types
-- ---------------------------------------------------------------------------
create table public.hotel_management_room_types (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  base_rate     numeric not null default 0
                check (base_rate >= 0),
  max_occupancy int not null default 2
                check (max_occupancy > 0),
  amenities     text[] default '{}',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on column public.hotel_management_room_types.base_rate is 'Default rack rate before seasonal multipliers';

-- ---------------------------------------------------------------------------
-- 3.4  hotel_management_rooms
-- ---------------------------------------------------------------------------
create table public.hotel_management_rooms (
  id            uuid primary key default gen_random_uuid(),
  room_number   text unique not null,
  floor         int not null,
  room_type_id  uuid not null references public.hotel_management_room_types on delete restrict,
  status        text not null default 'available'
                check (status in (
                  'available', 'reserved', 'checked_in', 'checked_out',
                  'dirty', 'clean', 'under_repair', 'blocked'
                )),
  is_active     boolean not null default true,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on column public.hotel_management_rooms.status is 'Operational status tracked by front-desk and housekeeping';

-- ---------------------------------------------------------------------------
-- 3.5  hotel_management_rate_plans
-- ---------------------------------------------------------------------------
create table public.hotel_management_rate_plans (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  room_type_id  uuid not null references public.hotel_management_room_types on delete cascade,
  rate          numeric not null default 0
                check (rate >= 0),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3.6  hotel_management_seasons
-- ---------------------------------------------------------------------------
create table public.hotel_management_seasons (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  start_date  date not null,
  end_date    date not null,
  multiplier  numeric not null default 1.0
              check (multiplier > 0),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint hotel_management_seasons_date_range check (end_date >= start_date)
);

comment on column public.hotel_management_seasons.multiplier is 'Applied to base_rate during this season (1.0 = no change)';

-- ---------------------------------------------------------------------------
-- 3.7  hotel_management_guests
-- ---------------------------------------------------------------------------
create table public.hotel_management_guests (
  id              uuid primary key default gen_random_uuid(),
  full_name       text not null,
  mobile          text,
  email           text,
  id_proof_type   text,
  id_proof_number text,
  address         text,
  company_name    text,
  gst_number      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3.8  hotel_management_reservations
-- ---------------------------------------------------------------------------
create table public.hotel_management_reservations (
  id              uuid primary key default gen_random_uuid(),
  booking_code    text unique not null,
  guest_id        uuid not null references public.hotel_management_guests on delete restrict,
  room_id         uuid references public.hotel_management_rooms on delete set null,
  check_in_date   date not null,
  check_out_date  date not null,
  adults          int not null default 1 check (adults > 0),
  children        int not null default 0 check (children >= 0),
  rate_plan_id    uuid references public.hotel_management_rate_plans on delete set null,
  status          text not null default 'confirmed'
                  check (status in (
                    'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'
                  )),
  deposit_amount  numeric not null default 0 check (deposit_amount >= 0),
  total_amount    numeric not null default 0 check (total_amount >= 0),
  source          text not null default 'direct',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint hotel_management_reservations_date_range check (check_out_date > check_in_date)
);

comment on column public.hotel_management_reservations.booking_code is 'Human-readable unique booking reference';
comment on column public.hotel_management_reservations.source       is 'Booking channel: direct, website, ota, corporate, etc.';

-- ---------------------------------------------------------------------------
-- 3.9  hotel_management_reservation_addons
-- ---------------------------------------------------------------------------
create table public.hotel_management_reservation_addons (
  id              uuid primary key default gen_random_uuid(),
  reservation_id  uuid not null references public.hotel_management_reservations on delete cascade,
  addon_name      text not null,
  quantity        int not null default 1 check (quantity > 0),
  unit_price      numeric not null default 0 check (unit_price >= 0),
  total_price     numeric not null default 0 check (total_price >= 0),
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3.10 hotel_management_checkins
-- ---------------------------------------------------------------------------
create table public.hotel_management_checkins (
  id              uuid primary key default gen_random_uuid(),
  reservation_id  uuid not null references public.hotel_management_reservations on delete cascade,
  room_id         uuid not null references public.hotel_management_rooms on delete restrict,
  checked_in_at   timestamptz not null default now(),
  checked_out_at  timestamptz,
  checked_in_by   uuid references public.hotel_management_users on delete set null,
  checked_out_by  uuid references public.hotel_management_users on delete set null,
  notes           text
);

-- ---------------------------------------------------------------------------
-- 3.11 hotel_management_housekeeping_tasks
-- ---------------------------------------------------------------------------
create table public.hotel_management_housekeeping_tasks (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid not null references public.hotel_management_rooms on delete cascade,
  assigned_to   uuid references public.hotel_management_users on delete set null,
  status        text not null default 'dirty'
                check (status in (
                  'dirty', 'assigned', 'cleaning', 'clean', 'inspected', 'under_repair'
                )),
  priority      text not null default 'normal'
                check (priority in ('low', 'normal', 'high', 'urgent')),
  notes         text,
  started_at    timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3.12 hotel_management_maintenance_requests
-- ---------------------------------------------------------------------------
create table public.hotel_management_maintenance_requests (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid not null references public.hotel_management_rooms on delete cascade,
  reported_by   uuid references public.hotel_management_users on delete set null,
  title         text not null,
  description   text,
  priority      text not null default 'normal'
                check (priority in ('low', 'normal', 'high', 'urgent')),
  status        text not null default 'open'
                check (status in ('open', 'in_progress', 'resolved', 'closed')),
  resolved_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3.13 hotel_management_fnb_categories
-- ---------------------------------------------------------------------------
create table public.hotel_management_fnb_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3.14 hotel_management_fnb_items
-- ---------------------------------------------------------------------------
create table public.hotel_management_fnb_items (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid not null references public.hotel_management_fnb_categories on delete cascade,
  name          text not null,
  description   text,
  price         numeric not null default 0 check (price >= 0),
  is_veg        boolean not null default true,
  is_available  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3.15 hotel_management_fnb_orders
-- ---------------------------------------------------------------------------
create table public.hotel_management_fnb_orders (
  id              uuid primary key default gen_random_uuid(),
  order_code      text unique not null,
  room_id         uuid references public.hotel_management_rooms on delete set null,
  guest_id        uuid references public.hotel_management_guests on delete set null,
  order_type      text not null default 'room_service'
                  check (order_type in ('room_service', 'restaurant', 'takeaway')),
  status          text not null default 'pending'
                  check (status in ('pending', 'preparing', 'served', 'completed', 'cancelled')),
  subtotal        numeric not null default 0,
  tax_amount      numeric not null default 0,
  total_amount    numeric not null default 0,
  posted_to_room  boolean not null default false,
  notes           text,
  created_by      uuid references public.hotel_management_users on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on column public.hotel_management_fnb_orders.posted_to_room is 'True when the charge has been posted to the room folio';

-- ---------------------------------------------------------------------------
-- 3.16 hotel_management_fnb_order_items
-- ---------------------------------------------------------------------------
create table public.hotel_management_fnb_order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.hotel_management_fnb_orders on delete cascade,
  item_id     uuid references public.hotel_management_fnb_items on delete set null,
  item_name   text not null,
  quantity    int not null default 1 check (quantity > 0),
  unit_price  numeric not null default 0,
  total_price numeric not null default 0
);

comment on column public.hotel_management_fnb_order_items.item_name is 'Snapshot of item name at time of order (survives menu changes)';

-- ---------------------------------------------------------------------------
-- 3.17 hotel_management_invoices
-- ---------------------------------------------------------------------------
create table public.hotel_management_invoices (
  id                uuid primary key default gen_random_uuid(),
  invoice_number    text unique not null,
  reservation_id    uuid references public.hotel_management_reservations on delete set null,
  guest_id          uuid not null references public.hotel_management_guests on delete restrict,
  subtotal          numeric not null default 0,
  discount_amount   numeric not null default 0 check (discount_amount >= 0),
  tax_amount        numeric not null default 0,
  total_amount      numeric not null default 0,
  paid_amount       numeric not null default 0,
  balance_amount    numeric not null default 0,
  status            text not null default 'draft'
                    check (status in ('draft', 'issued', 'paid', 'partially_paid', 'cancelled')),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3.18 hotel_management_invoice_items
-- ---------------------------------------------------------------------------
create table public.hotel_management_invoice_items (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid not null references public.hotel_management_invoices on delete cascade,
  description text not null,
  category    text not null
              check (category in (
                'room_tariff', 'extra_bed', 'fnb', 'late_checkout',
                'addon', 'discount', 'tax'
              )),
  quantity    int not null default 1 check (quantity > 0),
  unit_price  numeric not null default 0,
  total_price numeric not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3.19 hotel_management_payments
-- ---------------------------------------------------------------------------
create table public.hotel_management_payments (
  id                uuid primary key default gen_random_uuid(),
  invoice_id        uuid not null references public.hotel_management_invoices on delete cascade,
  amount            numeric not null check (amount > 0),
  payment_mode      text not null
                    check (payment_mode in (
                      'cash', 'upi', 'card', 'bank_transfer', 'bill_to_company'
                    )),
  reference_number  text,
  notes             text,
  paid_at           timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3.20 hotel_management_audit_logs — immutable append-only log
-- ---------------------------------------------------------------------------
create table public.hotel_management_audit_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.hotel_management_users on delete set null,
  action      text not null,
  table_name  text not null,
  record_id   uuid,
  old_data    jsonb,
  new_data    jsonb,
  created_at  timestamptz not null default now()
);

comment on table public.hotel_management_audit_logs is 'Immutable audit trail — rows must never be updated or deleted';

-- =============================================================================
-- 4. INDEXES
-- =============================================================================

create index idx_hm_sessions_user_id           on public.hotel_management_sessions (user_id);
create index idx_hm_sessions_expires_at        on public.hotel_management_sessions (expires_at);

create index idx_hm_rooms_status               on public.hotel_management_rooms (status);
create index idx_hm_rooms_room_type_id         on public.hotel_management_rooms (room_type_id);

create index idx_hm_reservations_status        on public.hotel_management_reservations (status);
create index idx_hm_reservations_check_in      on public.hotel_management_reservations (check_in_date);
create index idx_hm_reservations_check_out     on public.hotel_management_reservations (check_out_date);
create index idx_hm_reservations_guest_id      on public.hotel_management_reservations (guest_id);
create index idx_hm_reservations_booking_code  on public.hotel_management_reservations (booking_code);

create index idx_hm_checkins_reservation_id    on public.hotel_management_checkins (reservation_id);

create index idx_hm_housekeeping_status        on public.hotel_management_housekeeping_tasks (status);
create index idx_hm_housekeeping_room_id       on public.hotel_management_housekeeping_tasks (room_id);

create index idx_hm_maintenance_status         on public.hotel_management_maintenance_requests (status);
create index idx_hm_maintenance_room_id        on public.hotel_management_maintenance_requests (room_id);

create index idx_hm_fnb_orders_status          on public.hotel_management_fnb_orders (status);
create index idx_hm_fnb_orders_room_id         on public.hotel_management_fnb_orders (room_id);

create index idx_hm_fnb_order_items_order_id   on public.hotel_management_fnb_order_items (order_id);

create index idx_hm_invoices_status            on public.hotel_management_invoices (status);
create index idx_hm_invoices_reservation_id    on public.hotel_management_invoices (reservation_id);
create index idx_hm_invoices_guest_id          on public.hotel_management_invoices (guest_id);

create index idx_hm_payments_invoice_id        on public.hotel_management_payments (invoice_id);

create index idx_hm_audit_logs_table_record    on public.hotel_management_audit_logs (table_name, record_id);
create index idx_hm_audit_logs_user_id         on public.hotel_management_audit_logs (user_id);
create index idx_hm_audit_logs_created_at      on public.hotel_management_audit_logs (created_at);

-- =============================================================================
-- 5. TRIGGERS — auto-update updated_at
-- =============================================================================

create trigger set_updated_at before update on public.hotel_management_users
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.hotel_management_room_types
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.hotel_management_rooms
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.hotel_management_rate_plans
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.hotel_management_seasons
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.hotel_management_guests
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.hotel_management_reservations
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.hotel_management_housekeeping_tasks
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.hotel_management_maintenance_requests
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.hotel_management_fnb_categories
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.hotel_management_fnb_items
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.hotel_management_fnb_orders
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.hotel_management_invoices
  for each row execute function public.handle_updated_at();

-- =============================================================================
-- 6. ROW LEVEL SECURITY
-- =============================================================================
-- With custom auth, the app uses the Supabase service_role key from the server.
-- Service role bypasses RLS entirely. RLS is enabled as defense-in-depth:
-- if the anon key ever leaks, data stays protected.

alter table public.hotel_management_users               enable row level security;
alter table public.hotel_management_sessions            enable row level security;
alter table public.hotel_management_room_types          enable row level security;
alter table public.hotel_management_rooms               enable row level security;
alter table public.hotel_management_rate_plans          enable row level security;
alter table public.hotel_management_seasons             enable row level security;
alter table public.hotel_management_guests              enable row level security;
alter table public.hotel_management_reservations        enable row level security;
alter table public.hotel_management_reservation_addons  enable row level security;
alter table public.hotel_management_checkins            enable row level security;
alter table public.hotel_management_housekeeping_tasks  enable row level security;
alter table public.hotel_management_maintenance_requests enable row level security;
alter table public.hotel_management_fnb_categories      enable row level security;
alter table public.hotel_management_fnb_items           enable row level security;
alter table public.hotel_management_fnb_orders          enable row level security;
alter table public.hotel_management_fnb_order_items     enable row level security;
alter table public.hotel_management_invoices            enable row level security;
alter table public.hotel_management_invoice_items       enable row level security;
alter table public.hotel_management_payments            enable row level security;
alter table public.hotel_management_audit_logs          enable row level security;

-- =============================================================================
-- 7. SEED DEFAULT USERS
-- =============================================================================

insert into public.hotel_management_users (email, password_hash, full_name, role)
values (
  'admin@iimn.ac.in',
  crypt('admin123', gen_salt('bf', 10)),
  'System Administrator',
  'admin'
)
on conflict (email) do nothing;

insert into public.hotel_management_users (email, password_hash, full_name, role)
values
  ('frontdesk@iimn.ac.in', crypt('desk123', gen_salt('bf', 10)), 'Front Desk Staff', 'front_desk'),
  ('hk@iimn.ac.in', crypt('hk123', gen_salt('bf', 10)), 'Housekeeping Staff', 'housekeeping'),
  ('fnb@iimn.ac.in', crypt('fnb123', gen_salt('bf', 10)), 'F&B Manager', 'fnb'),
  ('accounts@iimn.ac.in', crypt('acc123', gen_salt('bf', 10)), 'Accounts Staff', 'accounts')
on conflict (email) do nothing;
