-- Housekeeping task columns used by the app API (safe to re-run)
alter table public.hotel_management_housekeeping_tasks
  add column if not exists task_type text default 'cleaning',
  add column if not exists due_date timestamptz,
  add column if not exists created_by uuid references public.hotel_management_users(id) on delete set null;

create index if not exists idx_hm_hk_assigned_to
  on public.hotel_management_housekeeping_tasks (assigned_to);
create index if not exists idx_hm_hk_status
  on public.hotel_management_housekeeping_tasks (status);
