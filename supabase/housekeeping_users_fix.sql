-- Add housekeeping1 / housekeeping2 demo logins (safe to re-run)
-- UUIDs must be valid hex (0-9, a-f only).
insert into public.hotel_management_users (id, email, password_hash, full_name, role)
values
  ('00000000-0000-0000-0000-000000000016', 'housekeeping1@iimdemo.com', crypt('password123', gen_salt('bf', 10)), 'Housekeeping Staff 1', 'housekeeping'),
  ('00000000-0000-0000-0000-000000000017', 'housekeeping2@iimdemo.com', crypt('password123', gen_salt('bf', 10)), 'Housekeeping Staff 2', 'housekeeping'),
  ('00000000-0000-0000-0000-000000000018', 'maintenance1@iimdemo.com', crypt('password123', gen_salt('bf', 10)), 'Maintenance Staff 1', 'maintenance_staff')
on conflict (email) do update set
  full_name = excluded.full_name,
  role = excluded.role,
  password_hash = excluded.password_hash,
  is_active = true;
