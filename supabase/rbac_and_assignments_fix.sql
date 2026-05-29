-- =============================================================================
-- RBAC & assignments fix — safe migration (no data drop)
-- Run after schema.sql and rbac.sql
-- =============================================================================

-- 1. Role constraint: add maintenance_staff, keep fnb_manager
ALTER TABLE public.hotel_management_users
  DROP CONSTRAINT IF EXISTS hotel_management_users_role_check;

UPDATE public.hotel_management_users SET role = 'fnb_manager' WHERE role = 'fnb';

ALTER TABLE public.hotel_management_users
  ADD CONSTRAINT hotel_management_users_role_check
  CHECK (role IN (
    'admin', 'front_desk', 'housekeeping', 'fnb_manager',
    'accounts', 'maintenance_staff'
  ));

-- 2. Housekeeping tasks — assignment fields
ALTER TABLE public.hotel_management_housekeeping_tasks
  ADD COLUMN IF NOT EXISTS task_type text DEFAULT 'cleaning',
  ADD COLUMN IF NOT EXISTS due_date timestamptz,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.hotel_management_users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_hm_hk_assigned_to
  ON public.hotel_management_housekeeping_tasks (assigned_to);
CREATE INDEX IF NOT EXISTS idx_hm_hk_status
  ON public.hotel_management_housekeeping_tasks (status);

-- 3. Maintenance requests — assignment fields
ALTER TABLE public.hotel_management_maintenance_requests
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.hotel_management_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS issue_type text DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS material_required text,
  ADD COLUMN IF NOT EXISTS resolution_note text,
  ADD COLUMN IF NOT EXISTS work_note text,
  ADD COLUMN IF NOT EXISTS reported_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz;

-- Extend status check (add assigned if missing)
ALTER TABLE public.hotel_management_maintenance_requests
  DROP CONSTRAINT IF EXISTS hotel_management_maintenance_requests_status_check;

ALTER TABLE public.hotel_management_maintenance_requests
  ADD CONSTRAINT hotel_management_maintenance_requests_status_check
  CHECK (status IN ('open', 'assigned', 'in_progress', 'resolved', 'closed'));

CREATE INDEX IF NOT EXISTS idx_hm_maint_assigned_to
  ON public.hotel_management_maintenance_requests (assigned_to);
CREATE INDEX IF NOT EXISTS idx_hm_maint_status
  ON public.hotel_management_maintenance_requests (status);

CREATE INDEX IF NOT EXISTS idx_hm_rooms_status
  ON public.hotel_management_rooms (status);

-- 3b. Room status workflow states (maintenance + inspection)
ALTER TABLE public.hotel_management_rooms
  DROP CONSTRAINT IF EXISTS hotel_management_rooms_status_check;

ALTER TABLE public.hotel_management_rooms
  ADD CONSTRAINT hotel_management_rooms_status_check
  CHECK (status IN (
    'available', 'reserved', 'checked_in', 'checked_out',
    'dirty', 'clean', 'under_repair', 'blocked',
    'maintenance_resolved', 'cleaning_required', 'needs_inspection'
  ));

-- 4. Demo users (fixed UUIDs for assignments)
INSERT INTO public.hotel_management_users (id, email, password_hash, full_name, role)
VALUES
  ('00000000-0000-0000-0000-000000000016', 'housekeeping1@iimdemo.com', crypt('password123', gen_salt('bf', 10)), 'Housekeeping Staff 1', 'housekeeping'),
  ('00000000-0000-0000-0000-000000000017', 'housekeeping2@iimdemo.com', crypt('password123', gen_salt('bf', 10)), 'Housekeeping Staff 2', 'housekeeping'),
  ('00000000-0000-0000-0000-000000000018', 'maintenance1@iimdemo.com', crypt('password123', gen_salt('bf', 10)), 'Maintenance Staff 1', 'maintenance_staff')
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = true;

-- Update primary demo housekeeping email to housekeeping1
UPDATE public.hotel_management_users
SET email = 'housekeeping@iimdemo.com', full_name = 'Demo Housekeeping (legacy)'
WHERE email = 'housekeeping@iimdemo.com' AND id NOT IN (
  '00000000-0000-0000-0000-000000000016',
  '00000000-0000-0000-0000-000000000017'
);

-- 5. Assign demo tasks (by room number)
UPDATE public.hotel_management_housekeeping_tasks t
SET
  assigned_to = '00000000-0000-0000-0000-000000000016',
  status = 'assigned',
  task_type = 'cleaning',
  priority = 'high',
  notes = 'Guest checked out - deep clean required'
FROM public.hotel_management_rooms r
WHERE t.room_id = r.id AND r.room_number = '110';

UPDATE public.hotel_management_housekeeping_tasks t
SET
  assigned_to = '00000000-0000-0000-0000-000000000016',
  status = 'assigned',
  task_type = 'linen_change',
  priority = 'urgent'
FROM public.hotel_management_rooms r
WHERE t.room_id = r.id AND r.room_number = '215';

UPDATE public.hotel_management_housekeeping_tasks t
SET
  assigned_to = '00000000-0000-0000-0000-000000000017',
  status = 'assigned',
  task_type = 'deep_cleaning',
  priority = 'normal'
FROM public.hotel_management_rooms r
WHERE t.room_id = r.id AND r.room_number = '307';

UPDATE public.hotel_management_housekeeping_tasks t
SET
  assigned_to = '00000000-0000-0000-0000-000000000017',
  status = 'clean',
  task_type = 'inspection',
  priority = 'normal'
FROM public.hotel_management_rooms r
WHERE t.room_id = r.id AND r.room_number = '403';

-- Remove static under-repair housekeeping tasks (use live maintenance requests instead)
delete from public.hotel_management_housekeeping_tasks
where status = 'under_repair';

-- Optional: remove demo maintenance rows that conflict with real reports
delete from public.hotel_management_maintenance_requests
where id in (
  'c3000000-0000-0000-0000-000000000001',
  'c3000000-0000-0000-0000-000000000002'
);

-- 6. Permissions table sync for maintenance_staff (if using DB permissions)
INSERT INTO public.hotel_management_permissions (role, module, can_view, can_create, can_update, can_delete)
VALUES
  ('maintenance_staff', 'dashboard', true, false, false, false),
  ('maintenance_staff', 'rooms', true, false, false, false),
  ('maintenance_staff', 'maintenance', true, false, true, false)
ON CONFLICT (role, module) DO UPDATE SET
  can_view = EXCLUDED.can_view,
  can_update = EXCLUDED.can_update;

-- Hide billing from fnb_manager in DB permissions (if table exists)
UPDATE public.hotel_management_permissions
SET can_view = false, can_create = false, can_update = false, can_delete = false
WHERE role = 'fnb_manager' AND module = 'billing';
