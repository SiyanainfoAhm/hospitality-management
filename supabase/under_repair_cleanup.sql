-- Clean up static under-repair data that duplicates live maintenance requests.
-- Safe to re-run.

-- Housekeeping tasks should not use under_repair; that column reads from maintenance_requests.
delete from public.hotel_management_housekeeping_tasks
where status = 'under_repair';

-- Remove seeded demo maintenance tickets for rooms 304/408 (if present).
delete from public.hotel_management_maintenance_requests
where id in (
  'c3000000-0000-0000-0000-000000000001',
  'c3000000-0000-0000-0000-000000000002'
);
