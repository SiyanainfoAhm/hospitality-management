-- =============================================================================
-- HOSPITALITY MANAGEMENT SYSTEM — Seed Data
-- IIM Nagpur Institutional Guest House (82 rooms)
-- Safe to re-run: skips rows that already exist (ON CONFLICT DO NOTHING).
-- =============================================================================

-- =============================================================================
-- 1. ROOM TYPES
-- =============================================================================

INSERT INTO hotel_management_room_types (id, name, description, base_rate, max_occupancy, amenities) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Standard Single', 'Comfortable single room with essential amenities', 2500, 1, ARRAY['AC', 'TV', 'WiFi', 'Desk', 'Wardrobe']),
  ('a1000000-0000-0000-0000-000000000002', 'Deluxe Double', 'Spacious double room with premium amenities', 3500, 2, ARRAY['AC', 'TV', 'WiFi', 'Desk', 'Wardrobe', 'Mini Bar', 'Sofa', 'Coffee Maker']),
  ('a1000000-0000-0000-0000-000000000003', 'Suite', 'Luxurious suite with separate living area', 6000, 3, ARRAY['AC', 'TV', 'WiFi', 'Desk', 'Wardrobe', 'Mini Bar', 'Sofa', 'Living Area', 'Bathtub', 'Coffee Maker']),
  ('a1000000-0000-0000-0000-000000000004', 'Executive Suite', 'Premium executive suite with all luxury amenities', 8500, 4, ARRAY['AC', 'TV', 'WiFi', 'Desk', 'Wardrobe', 'Mini Bar', 'Sofa', 'Living Area', 'Bathtub', 'Kitchen', 'Balcony', 'Coffee Maker'])
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. ROOMS (82 total across 4 floors)
-- =============================================================================

-- Floor 1: Rooms 101-120 (20 rooms: 12 Standard, 6 Deluxe, 2 Suite)
INSERT INTO hotel_management_rooms (room_number, floor, room_type_id, status) VALUES
  ('101', 1, 'a1000000-0000-0000-0000-000000000001', 'available'),
  ('102', 1, 'a1000000-0000-0000-0000-000000000001', 'available'),
  ('103', 1, 'a1000000-0000-0000-0000-000000000001', 'checked_in'),
  ('104', 1, 'a1000000-0000-0000-0000-000000000001', 'available'),
  ('105', 1, 'a1000000-0000-0000-0000-000000000001', 'reserved'),
  ('106', 1, 'a1000000-0000-0000-0000-000000000001', 'available'),
  ('107', 1, 'a1000000-0000-0000-0000-000000000001', 'clean'),
  ('108', 1, 'a1000000-0000-0000-0000-000000000001', 'checked_in'),
  ('109', 1, 'a1000000-0000-0000-0000-000000000001', 'available'),
  ('110', 1, 'a1000000-0000-0000-0000-000000000001', 'dirty'),
  ('111', 1, 'a1000000-0000-0000-0000-000000000001', 'available'),
  ('112', 1, 'a1000000-0000-0000-0000-000000000001', 'available'),
  ('113', 1, 'a1000000-0000-0000-0000-000000000002', 'checked_in'),
  ('114', 1, 'a1000000-0000-0000-0000-000000000002', 'available'),
  ('115', 1, 'a1000000-0000-0000-0000-000000000002', 'reserved'),
  ('116', 1, 'a1000000-0000-0000-0000-000000000002', 'available'),
  ('117', 1, 'a1000000-0000-0000-0000-000000000002', 'clean'),
  ('118', 1, 'a1000000-0000-0000-0000-000000000002', 'available'),
  ('119', 1, 'a1000000-0000-0000-0000-000000000003', 'checked_in'),
  ('120', 1, 'a1000000-0000-0000-0000-000000000003', 'available')
ON CONFLICT (room_number) DO NOTHING;

-- Floor 2: Rooms 201-222 (22 rooms: 10 Standard, 8 Deluxe, 3 Suite, 1 Executive)
INSERT INTO hotel_management_rooms (room_number, floor, room_type_id, status) VALUES
  ('201', 2, 'a1000000-0000-0000-0000-000000000001', 'available'),
  ('202', 2, 'a1000000-0000-0000-0000-000000000001', 'dirty'),
  ('203', 2, 'a1000000-0000-0000-0000-000000000001', 'available'),
  ('204', 2, 'a1000000-0000-0000-0000-000000000001', 'checked_in'),
  ('205', 2, 'a1000000-0000-0000-0000-000000000001', 'available'),
  ('206', 2, 'a1000000-0000-0000-0000-000000000001', 'reserved'),
  ('207', 2, 'a1000000-0000-0000-0000-000000000001', 'available'),
  ('208', 2, 'a1000000-0000-0000-0000-000000000001', 'clean'),
  ('209', 2, 'a1000000-0000-0000-0000-000000000001', 'available'),
  ('210', 2, 'a1000000-0000-0000-0000-000000000001', 'checked_out'),
  ('211', 2, 'a1000000-0000-0000-0000-000000000002', 'checked_in'),
  ('212', 2, 'a1000000-0000-0000-0000-000000000002', 'available'),
  ('213', 2, 'a1000000-0000-0000-0000-000000000002', 'reserved'),
  ('214', 2, 'a1000000-0000-0000-0000-000000000002', 'available'),
  ('215', 2, 'a1000000-0000-0000-0000-000000000002', 'dirty'),
  ('216', 2, 'a1000000-0000-0000-0000-000000000002', 'available'),
  ('217', 2, 'a1000000-0000-0000-0000-000000000002', 'available'),
  ('218', 2, 'a1000000-0000-0000-0000-000000000002', 'clean'),
  ('219', 2, 'a1000000-0000-0000-0000-000000000003', 'available'),
  ('220', 2, 'a1000000-0000-0000-0000-000000000003', 'checked_in'),
  ('221', 2, 'a1000000-0000-0000-0000-000000000003', 'reserved'),
  ('222', 2, 'a1000000-0000-0000-0000-000000000004', 'available')
ON CONFLICT (room_number) DO NOTHING;

-- Floor 3: Rooms 301-320 (20 rooms: 8 Standard, 8 Deluxe, 3 Suite, 1 Executive)
INSERT INTO hotel_management_rooms (room_number, floor, room_type_id, status) VALUES
  ('301', 3, 'a1000000-0000-0000-0000-000000000001', 'available'),
  ('302', 3, 'a1000000-0000-0000-0000-000000000001', 'checked_in'),
  ('303', 3, 'a1000000-0000-0000-0000-000000000001', 'available'),
  ('304', 3, 'a1000000-0000-0000-0000-000000000001', 'under_repair'),
  ('305', 3, 'a1000000-0000-0000-0000-000000000001', 'available'),
  ('306', 3, 'a1000000-0000-0000-0000-000000000001', 'available'),
  ('307', 3, 'a1000000-0000-0000-0000-000000000001', 'dirty'),
  ('308', 3, 'a1000000-0000-0000-0000-000000000001', 'available'),
  ('309', 3, 'a1000000-0000-0000-0000-000000000002', 'checked_in'),
  ('310', 3, 'a1000000-0000-0000-0000-000000000002', 'available'),
  ('311', 3, 'a1000000-0000-0000-0000-000000000002', 'reserved'),
  ('312', 3, 'a1000000-0000-0000-0000-000000000002', 'available'),
  ('313', 3, 'a1000000-0000-0000-0000-000000000002', 'available'),
  ('314', 3, 'a1000000-0000-0000-0000-000000000002', 'checked_out'),
  ('315', 3, 'a1000000-0000-0000-0000-000000000002', 'clean'),
  ('316', 3, 'a1000000-0000-0000-0000-000000000002', 'available'),
  ('317', 3, 'a1000000-0000-0000-0000-000000000003', 'available'),
  ('318', 3, 'a1000000-0000-0000-0000-000000000003', 'checked_in'),
  ('319', 3, 'a1000000-0000-0000-0000-000000000003', 'reserved'),
  ('320', 3, 'a1000000-0000-0000-0000-000000000004', 'blocked')
ON CONFLICT (room_number) DO NOTHING;

-- Floor 4: Rooms 401-420 (20 rooms: 8 Standard, 6 Deluxe, 4 Suite, 2 Executive)
INSERT INTO hotel_management_rooms (room_number, floor, room_type_id, status) VALUES
  ('401', 4, 'a1000000-0000-0000-0000-000000000001', 'available'),
  ('402', 4, 'a1000000-0000-0000-0000-000000000001', 'available'),
  ('403', 4, 'a1000000-0000-0000-0000-000000000001', 'dirty'),
  ('404', 4, 'a1000000-0000-0000-0000-000000000001', 'available'),
  ('405', 4, 'a1000000-0000-0000-0000-000000000001', 'checked_out'),
  ('406', 4, 'a1000000-0000-0000-0000-000000000001', 'available'),
  ('407', 4, 'a1000000-0000-0000-0000-000000000001', 'available'),
  ('408', 4, 'a1000000-0000-0000-0000-000000000001', 'under_repair'),
  ('409', 4, 'a1000000-0000-0000-0000-000000000002', 'available'),
  ('410', 4, 'a1000000-0000-0000-0000-000000000002', 'checked_in'),
  ('411', 4, 'a1000000-0000-0000-0000-000000000002', 'available'),
  ('412', 4, 'a1000000-0000-0000-0000-000000000002', 'reserved'),
  ('413', 4, 'a1000000-0000-0000-0000-000000000002', 'available'),
  ('414', 4, 'a1000000-0000-0000-0000-000000000002', 'clean'),
  ('415', 4, 'a1000000-0000-0000-0000-000000000003', 'available'),
  ('416', 4, 'a1000000-0000-0000-0000-000000000003', 'checked_out'),
  ('417', 4, 'a1000000-0000-0000-0000-000000000003', 'available'),
  ('418', 4, 'a1000000-0000-0000-0000-000000000003', 'available'),
  ('419', 4, 'a1000000-0000-0000-0000-000000000004', 'blocked'),
  ('420', 4, 'a1000000-0000-0000-0000-000000000004', 'available')
ON CONFLICT (room_number) DO NOTHING;

-- =============================================================================
-- 3. RATE PLANS
-- =============================================================================

INSERT INTO hotel_management_rate_plans (id, name, description, room_type_id, rate) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Rack Rate - Standard', 'Standard published rate', 'a1000000-0000-0000-0000-000000000001', 2500),
  ('b1000000-0000-0000-0000-000000000002', 'Rack Rate - Deluxe', 'Standard published rate', 'a1000000-0000-0000-0000-000000000002', 3500),
  ('b1000000-0000-0000-0000-000000000003', 'Rack Rate - Suite', 'Standard published rate', 'a1000000-0000-0000-0000-000000000003', 6000),
  ('b1000000-0000-0000-0000-000000000004', 'Rack Rate - Executive', 'Standard published rate', 'a1000000-0000-0000-0000-000000000004', 8500),
  ('b1000000-0000-0000-0000-000000000005', 'Corporate Rate - Standard', '20% discount for corporate bookings', 'a1000000-0000-0000-0000-000000000001', 2000),
  ('b1000000-0000-0000-0000-000000000006', 'Corporate Rate - Deluxe', '20% discount for corporate bookings', 'a1000000-0000-0000-0000-000000000002', 2800),
  ('b1000000-0000-0000-0000-000000000007', 'Government Rate - Standard', '30% discount for government officials', 'a1000000-0000-0000-0000-000000000001', 1750),
  ('b1000000-0000-0000-0000-000000000008', 'Government Rate - Deluxe', '30% discount for government officials', 'a1000000-0000-0000-0000-000000000002', 2450),
  ('b1000000-0000-0000-0000-000000000009', 'Long Stay - Standard', '25% discount for 7+ night stays', 'a1000000-0000-0000-0000-000000000001', 1875),
  ('b1000000-0000-0000-0000-000000000010', 'Special Event Rate', '20% premium during events', 'a1000000-0000-0000-0000-000000000003', 7200)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 4. SEASONS
-- =============================================================================

INSERT INTO hotel_management_seasons (id, name, start_date, end_date, multiplier) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Peak Season', '2026-10-01', '2027-02-28', 1.3),
  ('c1000000-0000-0000-0000-000000000002', 'Off Season', '2026-06-01', '2026-09-30', 0.8),
  ('c1000000-0000-0000-0000-000000000003', 'Regular Season', '2026-03-01', '2026-05-31', 1.0)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 5. GUESTS (20 sample guests with Indian names)
-- =============================================================================

INSERT INTO hotel_management_guests (id, full_name, mobile, email, id_proof_type, id_proof_number, address, company_name, gst_number) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Dr. Rajesh Kumar', '+91 98765 43210', 'rajesh.kumar@iitb.ac.in', 'aadhaar', '4567 8901 2345', 'IIT Bombay, Powai, Mumbai 400076', 'IIT Bombay', NULL),
  ('d1000000-0000-0000-0000-000000000002', 'Prof. Meera Sharma', '+91 87654 32109', 'meera.sharma@du.ac.in', 'pan', 'ABCPS1234H', 'Delhi University, North Campus, Delhi 110007', 'Delhi University', NULL),
  ('d1000000-0000-0000-0000-000000000003', 'Mr. Ankit Patel', '+91 76543 21098', 'ankit.patel@tcs.com', 'aadhaar', '5678 9012 3456', 'TCS Campus, Hinjewadi, Pune 411057', 'Tata Consultancy Services', '27AAACT1234F1ZH'),
  ('d1000000-0000-0000-0000-000000000004', 'Ms. Priya Singh', '+91 65432 10987', 'priya.singh@gov.in', 'passport', 'J8765432', 'Ministry of Education, Shastri Bhavan, New Delhi', 'Govt. of India', NULL),
  ('d1000000-0000-0000-0000-000000000005', 'Dr. Arun Verma', '+91 54321 09876', 'arun.verma@aiims.edu', 'aadhaar', '6789 0123 4567', 'AIIMS Delhi, Ansari Nagar, New Delhi 110029', 'AIIMS Delhi', NULL),
  ('d1000000-0000-0000-0000-000000000006', 'Prof. Kavita Nair', '+91 43210 98765', 'kavita.nair@iimk.ac.in', 'pan', 'DEFPN5678K', 'IIM Kozhikode, Kunnamangalam, Kerala 673570', 'IIM Kozhikode', NULL),
  ('d1000000-0000-0000-0000-000000000007', 'Mr. Vikram Desai', '+91 32109 87654', 'vikram.desai@infosys.com', 'driving_license', 'MH14 20230045678', 'Infosys Ltd, Electronic City, Bangalore 560100', 'Infosys Limited', '29AABCI1234F1Z5'),
  ('d1000000-0000-0000-0000-000000000008', 'Ms. Sunita Rao', '+91 21098 76543', 'sunita.rao@wipro.com', 'aadhaar', '7890 1234 5678', 'Wipro Campus, Sarjapur Road, Bangalore 560035', 'Wipro Ltd', '29AABCW1234F1ZH'),
  ('d1000000-0000-0000-0000-000000000009', 'Dr. Ramesh Iyer', '+91 10987 65432', 'ramesh.iyer@iisc.ac.in', 'pan', 'GHIRI9012L', 'IISc Bangalore, CV Raman Avenue, Bangalore 560012', 'IISc Bangalore', NULL),
  ('d1000000-0000-0000-0000-000000000010', 'Prof. Deepa Menon', '+91 98712 34567', 'deepa.menon@iimb.ac.in', 'aadhaar', '8901 2345 6789', 'IIM Bangalore, Bannerghatta Road, Bangalore 560076', 'IIM Bangalore', NULL),
  ('d1000000-0000-0000-0000-000000000011', 'Mr. Suresh Menon', '+91 88899 77766', 'suresh.menon@mahindra.com', 'driving_license', 'MH01 20220089012', 'Mahindra Towers, Worli, Mumbai 400018', 'Mahindra & Mahindra', '27AABCM1234F1ZH'),
  ('d1000000-0000-0000-0000-000000000012', 'Dr. Anita Joshi', '+91 77788 66655', 'anita.joshi@ncl.res.in', 'aadhaar', '9012 3456 7890', 'NCL Pune, Dr. Homi Bhabha Road, Pune 411008', 'National Chemical Laboratory', NULL),
  ('d1000000-0000-0000-0000-000000000013', 'Prof. Mohan Das', '+91 66677 55544', 'mohan.das@jnu.ac.in', 'pan', 'JKLMD3456N', 'JNU, New Mehrauli Road, New Delhi 110067', 'JNU Delhi', NULL),
  ('d1000000-0000-0000-0000-000000000014', 'Ms. Rekha Gupta', '+91 55544 33322', 'rekha.gupta@rbi.org.in', 'passport', 'K1234567', 'RBI Mumbai, Fort, Mumbai 400001', 'Reserve Bank of India', NULL),
  ('d1000000-0000-0000-0000-000000000015', 'Mr. Kiran Shah', '+91 44433 22211', 'kiran.shah@reliance.com', 'aadhaar', '0123 4567 8901', 'Reliance Corporate Park, Navi Mumbai 400710', 'Reliance Industries', '27AABCR1234F1ZH'),
  ('d1000000-0000-0000-0000-000000000016', 'Dr. Neha Kapoor', '+91 33322 11100', 'neha.kapoor@pgimer.edu.in', 'pan', 'MNOPK7890Q', 'PGIMER Chandigarh, Sector 12, Chandigarh 160012', 'PGIMER', NULL),
  ('d1000000-0000-0000-0000-000000000017', 'Mr. Arvind Reddy', '+91 99988 77766', 'arvind.reddy@isro.gov.in', 'aadhaar', '1234 5678 9012', 'ISRO HQ, Antariksh Bhavan, Bangalore 560094', 'ISRO', NULL),
  ('d1000000-0000-0000-0000-000000000018', 'Prof. Shalini Gupta', '+91 88877 66655', 'shalini.gupta@iitd.ac.in', 'driving_license', 'DL01 20210056789', 'IIT Delhi, Hauz Khas, New Delhi 110016', 'IIT Delhi', NULL),
  ('d1000000-0000-0000-0000-000000000019', 'Mr. Prakash Jain', '+91 77766 55544', 'prakash.jain@icici.com', 'pan', 'QRSPJ1234R', 'ICICI Bank Ltd, BKC, Mumbai 400051', 'ICICI Bank', '27AABCI5678F1ZH'),
  ('d1000000-0000-0000-0000-000000000020', 'Dr. Lakshmi Iyer', '+91 66655 44433', 'lakshmi.iyer@tifr.res.in', 'aadhaar', '2345 6789 0123', 'TIFR, Homi Bhabha Road, Mumbai 400005', 'TIFR Mumbai', NULL)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 6. RESERVATIONS (15 with mixed statuses)
-- =============================================================================

INSERT INTO hotel_management_reservations (id, booking_code, guest_id, room_id, check_in_date, check_out_date, adults, children, rate_plan_id, status, deposit_amount, total_amount, source, notes) VALUES
  ('e1000000-0000-0000-0000-000000000001', 'BK-2026-0001', 'd1000000-0000-0000-0000-000000000001', (SELECT id FROM hotel_management_rooms WHERE room_number='301'), '2026-05-25', '2026-05-28', 2, 0, 'b1000000-0000-0000-0000-000000000003', 'confirmed', 5000, 18000, 'direct', 'Conference speaker'),
  ('e1000000-0000-0000-0000-000000000002', 'BK-2026-0002', 'd1000000-0000-0000-0000-000000000002', (SELECT id FROM hotel_management_rooms WHERE room_number='211'), '2026-05-24', '2026-05-27', 1, 0, 'b1000000-0000-0000-0000-000000000006', 'checked_in', 3000, 8400, 'email', NULL),
  ('e1000000-0000-0000-0000-000000000003', 'BK-2026-0003', 'd1000000-0000-0000-0000-000000000003', (SELECT id FROM hotel_management_rooms WHERE room_number='410'), '2026-05-23', '2026-05-26', 2, 1, 'b1000000-0000-0000-0000-000000000004', 'checked_in', 8000, 25500, 'corporate', 'TCS team visit'),
  ('e1000000-0000-0000-0000-000000000004', 'BK-2026-0004', 'd1000000-0000-0000-0000-000000000004', (SELECT id FROM hotel_management_rooms WHERE room_number='108'), '2026-05-25', '2026-05-26', 1, 0, 'b1000000-0000-0000-0000-000000000007', 'confirmed', 1000, 1750, 'government', 'Ministry official'),
  ('e1000000-0000-0000-0000-000000000005', 'BK-2026-0005', 'd1000000-0000-0000-0000-000000000005', (SELECT id FROM hotel_management_rooms WHERE room_number='318'), '2026-05-22', '2026-05-25', 2, 0, 'b1000000-0000-0000-0000-000000000003', 'checked_out', 5000, 18000, 'direct', NULL),
  ('e1000000-0000-0000-0000-000000000006', 'BK-2026-0006', 'd1000000-0000-0000-0000-000000000006', (SELECT id FROM hotel_management_rooms WHERE room_number='220'), '2026-05-20', '2026-05-23', 1, 1, 'b1000000-0000-0000-0000-000000000002', 'checked_out', 3500, 10500, 'direct', NULL),
  ('e1000000-0000-0000-0000-000000000007', 'BK-2026-0007', 'd1000000-0000-0000-0000-000000000007', (SELECT id FROM hotel_management_rooms WHERE room_number='412'), '2026-05-26', '2026-05-29', 2, 0, 'b1000000-0000-0000-0000-000000000004', 'confirmed', 8500, 25500, 'corporate', 'Infosys delegation'),
  ('e1000000-0000-0000-0000-000000000008', 'BK-2026-0008', 'd1000000-0000-0000-0000-000000000008', (SELECT id FROM hotel_management_rooms WHERE room_number='103'), '2026-05-24', '2026-05-25', 1, 0, 'b1000000-0000-0000-0000-000000000005', 'cancelled', 0, 2000, 'email', 'Cancelled due to schedule change'),
  ('e1000000-0000-0000-0000-000000000009', 'BK-2026-0009', 'd1000000-0000-0000-0000-000000000009', (SELECT id FROM hotel_management_rooms WHERE room_number='309'), '2026-05-25', '2026-05-28', 1, 0, 'b1000000-0000-0000-0000-000000000003', 'confirmed', 6000, 18000, 'direct', 'IISc research collaboration'),
  ('e1000000-0000-0000-0000-000000000010', 'BK-2026-0010', 'd1000000-0000-0000-0000-000000000010', (SELECT id FROM hotel_management_rooms WHERE room_number='213'), '2026-05-23', '2026-05-24', 1, 0, 'b1000000-0000-0000-0000-000000000006', 'no_show', 0, 2800, 'phone', NULL),
  ('e1000000-0000-0000-0000-000000000011', 'BK-2026-0011', 'd1000000-0000-0000-0000-000000000011', (SELECT id FROM hotel_management_rooms WHERE room_number='204'), '2026-05-24', '2026-05-27', 1, 0, 'b1000000-0000-0000-0000-000000000005', 'checked_in', 2000, 6000, 'corporate', NULL),
  ('e1000000-0000-0000-0000-000000000012', 'BK-2026-0012', 'd1000000-0000-0000-0000-000000000012', (SELECT id FROM hotel_management_rooms WHERE room_number='119'), '2026-05-23', '2026-05-27', 1, 0, 'b1000000-0000-0000-0000-000000000003', 'checked_in', 6000, 24000, 'direct', 'Extended research visit'),
  ('e1000000-0000-0000-0000-000000000013', 'BK-2026-0013', 'd1000000-0000-0000-0000-000000000013', (SELECT id FROM hotel_management_rooms WHERE room_number='113'), '2026-05-24', '2026-05-26', 2, 0, 'b1000000-0000-0000-0000-000000000008', 'checked_in', 2450, 4900, 'government', NULL),
  ('e1000000-0000-0000-0000-000000000014', 'BK-2026-0014', 'd1000000-0000-0000-0000-000000000014', (SELECT id FROM hotel_management_rooms WHERE room_number='302'), '2026-05-24', '2026-05-26', 1, 0, 'b1000000-0000-0000-0000-000000000007', 'checked_in', 1750, 3500, 'government', 'RBI inspection visit'),
  ('e1000000-0000-0000-0000-000000000015', 'BK-2026-0015', 'd1000000-0000-0000-0000-000000000015', (SELECT id FROM hotel_management_rooms WHERE room_number='105'), '2026-05-26', '2026-05-28', 1, 0, 'b1000000-0000-0000-0000-000000000005', 'confirmed', 2000, 4000, 'corporate', NULL)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 7. CHECKINS
-- =============================================================================

INSERT INTO hotel_management_checkins (id, reservation_id, room_id, checked_in_at, checked_out_at) VALUES
  ('f1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000002', (SELECT id FROM hotel_management_rooms WHERE room_number='211'), '2026-05-24 14:30:00', NULL),
  ('f1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000003', (SELECT id FROM hotel_management_rooms WHERE room_number='410'), '2026-05-23 15:00:00', NULL),
  ('f1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000005', (SELECT id FROM hotel_management_rooms WHERE room_number='318'), '2026-05-22 13:45:00', '2026-05-25 11:00:00'),
  ('f1000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000006', (SELECT id FROM hotel_management_rooms WHERE room_number='220'), '2026-05-20 14:00:00', '2026-05-23 10:30:00'),
  ('f1000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000011', (SELECT id FROM hotel_management_rooms WHERE room_number='204'), '2026-05-24 16:15:00', NULL),
  ('f1000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000012', (SELECT id FROM hotel_management_rooms WHERE room_number='119'), '2026-05-23 14:00:00', NULL),
  ('f1000000-0000-0000-0000-000000000007', 'e1000000-0000-0000-0000-000000000013', (SELECT id FROM hotel_management_rooms WHERE room_number='113'), '2026-05-24 13:30:00', NULL),
  ('f1000000-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000014', (SELECT id FROM hotel_management_rooms WHERE room_number='302'), '2026-05-24 15:45:00', NULL)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 8. HOUSEKEEPING TASKS (12 tasks)
-- =============================================================================

INSERT INTO hotel_management_housekeeping_tasks (id, room_id, status, priority, notes, started_at, completed_at) VALUES
  ('a7000000-0000-0000-0000-000000000001', (SELECT id FROM hotel_management_rooms WHERE room_number='110'), 'dirty', 'high', 'Guest checked out - deep clean required', NULL, NULL),
  ('a7000000-0000-0000-0000-000000000002', (SELECT id FROM hotel_management_rooms WHERE room_number='202'), 'dirty', 'normal', 'Regular daily cleaning', NULL, NULL),
  ('a7000000-0000-0000-0000-000000000003', (SELECT id FROM hotel_management_rooms WHERE room_number='215'), 'dirty', 'urgent', 'VIP guest arriving at 14:00', NULL, NULL),
  ('a7000000-0000-0000-0000-000000000004', (SELECT id FROM hotel_management_rooms WHERE room_number='403'), 'dirty', 'normal', 'Checkout cleaning', NULL, NULL),
  ('a7000000-0000-0000-0000-000000000005', (SELECT id FROM hotel_management_rooms WHERE room_number='307'), 'assigned', 'normal', 'Standard turnover', '2026-05-25 09:00:00', NULL),
  ('a7000000-0000-0000-0000-000000000006', (SELECT id FROM hotel_management_rooms WHERE room_number='210'), 'assigned', 'high', 'Extra bed removal needed', '2026-05-25 09:15:00', NULL),
  ('a7000000-0000-0000-0000-000000000007', (SELECT id FROM hotel_management_rooms WHERE room_number='107'), 'clean', 'normal', 'Completed', '2026-05-25 08:00:00', '2026-05-25 08:45:00'),
  ('a7000000-0000-0000-0000-000000000008', (SELECT id FROM hotel_management_rooms WHERE room_number='208'), 'clean', 'normal', 'Ready for inspection', '2026-05-25 07:30:00', '2026-05-25 08:15:00'),
  ('a7000000-0000-0000-0000-000000000009', (SELECT id FROM hotel_management_rooms WHERE room_number='218'), 'clean', 'normal', 'Completed', '2026-05-25 08:30:00', '2026-05-25 09:10:00'),
  ('a7000000-0000-0000-0000-000000000010', (SELECT id FROM hotel_management_rooms WHERE room_number='315'), 'inspected', 'normal', 'Passed inspection', '2026-05-25 07:00:00', '2026-05-25 07:40:00'),
  ('a7000000-0000-0000-0000-000000000011', (SELECT id FROM hotel_management_rooms WHERE room_number='414'), 'inspected', 'normal', 'All good', '2026-05-25 07:15:00', '2026-05-25 07:55:00'),
  ('a7000000-0000-0000-0000-000000000012', (SELECT id FROM hotel_management_rooms WHERE room_number='304'), 'under_repair', 'high', 'AC unit malfunction - technician scheduled', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 9. F&B CATEGORIES
-- =============================================================================

INSERT INTO hotel_management_fnb_categories (id, name, sort_order) VALUES
  ('a8000000-0000-0000-0000-000000000001', 'Beverages', 1),
  ('a8000000-0000-0000-0000-000000000002', 'Breakfast', 2),
  ('a8000000-0000-0000-0000-000000000003', 'Main Course', 3),
  ('a8000000-0000-0000-0000-000000000004', 'Snacks', 4),
  ('a8000000-0000-0000-0000-000000000005', 'Desserts', 5)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 10. F&B ITEMS (20 items)
-- =============================================================================

INSERT INTO hotel_management_fnb_items (id, category_id, name, description, price, is_veg, is_available) VALUES
  ('a9000000-0000-0000-0000-000000000001', 'a8000000-0000-0000-0000-000000000001', 'Tea', 'Indian masala tea', 40, true, true),
  ('a9000000-0000-0000-0000-000000000002', 'a8000000-0000-0000-0000-000000000001', 'Coffee', 'Filter coffee / Americano', 60, true, true),
  ('a9000000-0000-0000-0000-000000000003', 'a8000000-0000-0000-0000-000000000001', 'Fresh Juice', 'Orange / Watermelon / Mixed fruit', 80, true, true),
  ('a9000000-0000-0000-0000-000000000004', 'a8000000-0000-0000-0000-000000000001', 'Lassi', 'Sweet / Salted / Mango', 70, true, true),
  ('a9000000-0000-0000-0000-000000000005', 'a8000000-0000-0000-0000-000000000001', 'Water Bottle', 'Packaged drinking water 1L', 30, true, true),
  ('a9000000-0000-0000-0000-000000000006', 'a8000000-0000-0000-0000-000000000002', 'Masala Dosa', 'Crispy dosa with potato filling and chutneys', 120, true, true),
  ('a9000000-0000-0000-0000-000000000007', 'a8000000-0000-0000-0000-000000000002', 'Poha', 'Maharashtrian style flattened rice', 80, true, true),
  ('a9000000-0000-0000-0000-000000000008', 'a8000000-0000-0000-0000-000000000002', 'Idli Sambar', 'Soft idlis with sambar and chutney (4 pcs)', 90, true, true),
  ('a9000000-0000-0000-0000-000000000009', 'a8000000-0000-0000-0000-000000000002', 'Aloo Paratha', 'Stuffed paratha with curd and pickle', 100, true, true),
  ('a9000000-0000-0000-0000-000000000010', 'a8000000-0000-0000-0000-000000000003', 'Paneer Butter Masala', 'Rich and creamy paneer curry', 250, true, true),
  ('a9000000-0000-0000-0000-000000000011', 'a8000000-0000-0000-0000-000000000003', 'Dal Makhani', 'Slow-cooked black lentils in butter gravy', 200, true, true),
  ('a9000000-0000-0000-0000-000000000012', 'a8000000-0000-0000-0000-000000000003', 'Chicken Biryani', 'Hyderabadi style dum biryani with raita', 300, false, true),
  ('a9000000-0000-0000-0000-000000000013', 'a8000000-0000-0000-0000-000000000003', 'Veg Thali', 'Complete meal: dal, sabzi, roti, rice, salad, sweet', 220, true, true),
  ('a9000000-0000-0000-0000-000000000014', 'a8000000-0000-0000-0000-000000000003', 'Non-Veg Thali', 'Complete meal with chicken curry, dal, roti, rice', 320, false, true),
  ('a9000000-0000-0000-0000-000000000015', 'a8000000-0000-0000-0000-000000000004', 'Samosa (2 pcs)', 'Crispy samosas with mint chutney', 40, true, true),
  ('a9000000-0000-0000-0000-000000000016', 'a8000000-0000-0000-0000-000000000004', 'Club Sandwich', 'Triple-decker with fries', 120, true, true),
  ('a9000000-0000-0000-0000-000000000017', 'a8000000-0000-0000-0000-000000000004', 'Pakoda', 'Mixed vegetable fritters with chutney', 60, true, true),
  ('a9000000-0000-0000-0000-000000000018', 'a8000000-0000-0000-0000-000000000004', 'French Fries', 'Crispy fries with ketchup', 100, true, true),
  ('a9000000-0000-0000-0000-000000000019', 'a8000000-0000-0000-0000-000000000005', 'Gulab Jamun (2 pcs)', 'Soft milk dumplings in sugar syrup', 80, true, true),
  ('a9000000-0000-0000-0000-000000000020', 'a8000000-0000-0000-0000-000000000005', 'Ice Cream', 'Vanilla / Chocolate / Mango (2 scoops)', 100, true, true)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 11. F&B ORDERS (8 orders)
-- =============================================================================

INSERT INTO hotel_management_fnb_orders (id, order_code, room_id, guest_id, order_type, status, subtotal, tax_amount, total_amount, posted_to_room, notes) VALUES
  ('ab000000-0000-0000-0000-000000000001', 'ORD-2026-0001', (SELECT id FROM hotel_management_rooms WHERE room_number='211'), 'd1000000-0000-0000-0000-000000000002', 'room_service', 'served', 370, 19, 389, true, 'Room 211 - breakfast'),
  ('ab000000-0000-0000-0000-000000000002', 'ORD-2026-0002', (SELECT id FROM hotel_management_rooms WHERE room_number='410'), 'd1000000-0000-0000-0000-000000000003', 'room_service', 'completed', 620, 31, 651, true, 'Room 410 - lunch'),
  ('ab000000-0000-0000-0000-000000000003', 'ORD-2026-0003', NULL, NULL, 'restaurant', 'completed', 540, 27, 567, false, 'Walk-in customer - table 5'),
  ('ab000000-0000-0000-0000-000000000004', 'ORD-2026-0004', (SELECT id FROM hotel_management_rooms WHERE room_number='119'), 'd1000000-0000-0000-0000-000000000012', 'room_service', 'preparing', 450, 23, 473, true, NULL),
  ('ab000000-0000-0000-0000-000000000005', 'ORD-2026-0005', (SELECT id FROM hotel_management_rooms WHERE room_number='302'), 'd1000000-0000-0000-0000-000000000014', 'room_service', 'served', 160, 8, 168, true, NULL),
  ('ab000000-0000-0000-0000-000000000006', 'ORD-2026-0006', NULL, NULL, 'restaurant', 'completed', 880, 44, 924, false, 'Group lunch - table 2'),
  ('ab000000-0000-0000-0000-000000000007', 'ORD-2026-0007', (SELECT id FROM hotel_management_rooms WHERE room_number='204'), 'd1000000-0000-0000-0000-000000000011', 'room_service', 'pending', 200, 10, 210, false, NULL),
  ('ab000000-0000-0000-0000-000000000008', 'ORD-2026-0008', (SELECT id FROM hotel_management_rooms WHERE room_number='113'), 'd1000000-0000-0000-0000-000000000013', 'room_service', 'served', 340, 17, 357, true, NULL)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 12. F&B ORDER ITEMS
-- =============================================================================

INSERT INTO hotel_management_fnb_order_items (id, order_id, item_id, item_name, quantity, unit_price, total_price) VALUES
  ('ac000000-0000-0000-0000-000000000001', 'ab000000-0000-0000-0000-000000000001', 'a9000000-0000-0000-0000-000000000006', 'Masala Dosa', 1, 120, 120),
  ('ac000000-0000-0000-0000-000000000002', 'ab000000-0000-0000-0000-000000000001', 'a9000000-0000-0000-0000-000000000002', 'Coffee', 2, 60, 120),
  ('ac000000-0000-0000-0000-000000000003', 'ab000000-0000-0000-0000-000000000001', 'a9000000-0000-0000-0000-000000000003', 'Fresh Juice', 1, 80, 80),
  ('ac000000-0000-0000-0000-000000000004', 'ab000000-0000-0000-0000-000000000002', 'a9000000-0000-0000-0000-000000000012', 'Chicken Biryani', 1, 300, 300),
  ('ac000000-0000-0000-0000-000000000005', 'ab000000-0000-0000-0000-000000000002', 'a9000000-0000-0000-0000-000000000014', 'Non-Veg Thali', 1, 320, 320),
  ('ac000000-0000-0000-0000-000000000006', 'ab000000-0000-0000-0000-000000000003', 'a9000000-0000-0000-0000-000000000013', 'Veg Thali', 2, 220, 440),
  ('ac000000-0000-0000-0000-000000000007', 'ab000000-0000-0000-0000-000000000003', 'a9000000-0000-0000-0000-000000000018', 'French Fries', 1, 100, 100),
  ('ac000000-0000-0000-0000-000000000008', 'ab000000-0000-0000-0000-000000000004', 'a9000000-0000-0000-0000-000000000010', 'Paneer Butter Masala', 1, 250, 250),
  ('ac000000-0000-0000-0000-000000000009', 'ab000000-0000-0000-0000-000000000004', 'a9000000-0000-0000-0000-000000000011', 'Dal Makhani', 1, 200, 200),
  ('ac000000-0000-0000-0000-000000000010', 'ab000000-0000-0000-0000-000000000005', 'a9000000-0000-0000-0000-000000000001', 'Tea', 2, 40, 80),
  ('ac000000-0000-0000-0000-000000000011', 'ab000000-0000-0000-0000-000000000005', 'a9000000-0000-0000-0000-000000000019', 'Gulab Jamun (2 pcs)', 1, 80, 80),
  ('ac000000-0000-0000-0000-000000000012', 'ab000000-0000-0000-0000-000000000007', 'a9000000-0000-0000-0000-000000000002', 'Coffee', 1, 60, 60),
  ('ac000000-0000-0000-0000-000000000013', 'ab000000-0000-0000-0000-000000000007', 'a9000000-0000-0000-0000-000000000015', 'Samosa (2 pcs)', 2, 40, 80),
  ('ac000000-0000-0000-0000-000000000014', 'ab000000-0000-0000-0000-000000000007', 'a9000000-0000-0000-0000-000000000017', 'Pakoda', 1, 60, 60),
  ('ac000000-0000-0000-0000-000000000015', 'ab000000-0000-0000-0000-000000000008', 'a9000000-0000-0000-0000-000000000009', 'Aloo Paratha', 2, 100, 200),
  ('ac000000-0000-0000-0000-000000000016', 'ab000000-0000-0000-0000-000000000008', 'a9000000-0000-0000-0000-000000000004', 'Lassi', 2, 70, 140)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 13. INVOICES (8 invoices)
-- =============================================================================

INSERT INTO hotel_management_invoices (id, invoice_number, reservation_id, guest_id, subtotal, discount_amount, tax_amount, total_amount, paid_amount, balance_amount, status) VALUES
  ('ad000000-0000-0000-0000-000000000001', 'INV-2026-0001', 'e1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000005', 19450, 0, 3501, 22951, 22951, 0, 'paid'),
  ('ad000000-0000-0000-0000-000000000002', 'INV-2026-0002', 'e1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000006', 11700, 500, 2016, 13216, 10000, 3216, 'partially_paid'),
  ('ad000000-0000-0000-0000-000000000003', 'INV-2026-0003', 'e1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', 8789, 0, 1582, 10371, 0, 10371, 'issued'),
  ('ad000000-0000-0000-0000-000000000004', 'INV-2026-0004', 'e1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000003', 26151, 1000, 4527, 29678, 29678, 0, 'paid'),
  ('ad000000-0000-0000-0000-000000000005', 'INV-2026-0005', 'e1000000-0000-0000-0000-000000000011', 'd1000000-0000-0000-0000-000000000011', 6210, 0, 1118, 7328, 5000, 2328, 'partially_paid'),
  ('ad000000-0000-0000-0000-000000000006', 'INV-2026-0006', 'e1000000-0000-0000-0000-000000000012', 'd1000000-0000-0000-0000-000000000012', 24473, 2000, 4045, 26518, 26518, 0, 'paid'),
  ('ad000000-0000-0000-0000-000000000007', 'INV-2026-0007', 'e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 18000, 0, 3240, 21240, 0, 21240, 'draft'),
  ('ad000000-0000-0000-0000-000000000008', 'INV-2026-0008', 'e1000000-0000-0000-0000-000000000013', 'd1000000-0000-0000-0000-000000000013', 5257, 0, 946, 6203, 0, 6203, 'issued')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 14. INVOICE ITEMS
-- =============================================================================

INSERT INTO hotel_management_invoice_items (id, invoice_id, description, category, quantity, unit_price, total_price) VALUES
  ('ae000000-0000-0000-0000-000000000001', 'ad000000-0000-0000-0000-000000000001', 'Room Tariff - Suite (3 nights)', 'room_tariff', 3, 6000, 18000),
  ('ae000000-0000-0000-0000-000000000002', 'ad000000-0000-0000-0000-000000000001', 'F&B Charges', 'fnb', 1, 1450, 1450),
  ('ae000000-0000-0000-0000-000000000003', 'ad000000-0000-0000-0000-000000000002', 'Room Tariff - Deluxe (3 nights)', 'room_tariff', 3, 3500, 10500),
  ('ae000000-0000-0000-0000-000000000004', 'ad000000-0000-0000-0000-000000000002', 'Extra Bed', 'extra_bed', 3, 400, 1200),
  ('ae000000-0000-0000-0000-000000000005', 'ad000000-0000-0000-0000-000000000003', 'Room Tariff - Deluxe Corporate (3 nights)', 'room_tariff', 3, 2800, 8400),
  ('ae000000-0000-0000-0000-000000000006', 'ad000000-0000-0000-0000-000000000003', 'Room Service', 'fnb', 1, 389, 389),
  ('ae000000-0000-0000-0000-000000000007', 'ad000000-0000-0000-0000-000000000004', 'Room Tariff - Executive (3 nights)', 'room_tariff', 3, 8500, 25500),
  ('ae000000-0000-0000-0000-000000000008', 'ad000000-0000-0000-0000-000000000004', 'F&B Charges', 'fnb', 1, 651, 651),
  ('ae000000-0000-0000-0000-000000000009', 'ad000000-0000-0000-0000-000000000005', 'Room Tariff - Standard Corporate (3 nights)', 'room_tariff', 3, 2000, 6000),
  ('ae000000-0000-0000-0000-000000000010', 'ad000000-0000-0000-0000-000000000005', 'Room Service', 'fnb', 1, 210, 210),
  ('ae000000-0000-0000-0000-000000000011', 'ad000000-0000-0000-0000-000000000006', 'Room Tariff - Suite (4 nights)', 'room_tariff', 4, 6000, 24000),
  ('ae000000-0000-0000-0000-000000000012', 'ad000000-0000-0000-0000-000000000006', 'Room Service', 'fnb', 1, 473, 473),
  ('ae000000-0000-0000-0000-000000000013', 'ad000000-0000-0000-0000-000000000007', 'Room Tariff - Suite (3 nights)', 'room_tariff', 3, 6000, 18000),
  ('ae000000-0000-0000-0000-000000000014', 'ad000000-0000-0000-0000-000000000008', 'Room Tariff - Deluxe Govt (2 nights)', 'room_tariff', 2, 2450, 4900),
  ('ae000000-0000-0000-0000-000000000015', 'ad000000-0000-0000-0000-000000000008', 'Room Service', 'fnb', 1, 357, 357)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 15. PAYMENTS (10 payments)
-- =============================================================================

INSERT INTO hotel_management_payments (id, invoice_id, amount, payment_mode, reference_number, notes, paid_at) VALUES
  ('af000000-0000-0000-0000-000000000001', 'ad000000-0000-0000-0000-000000000001', 5000, 'cash', NULL, 'Advance deposit', '2026-05-22 14:00:00'),
  ('af000000-0000-0000-0000-000000000002', 'ad000000-0000-0000-0000-000000000001', 17951, 'card', 'TXN-HDFC-78945612', 'Final settlement at checkout', '2026-05-25 11:15:00'),
  ('af000000-0000-0000-0000-000000000003', 'ad000000-0000-0000-0000-000000000002', 3500, 'upi', 'UPI-GPay-456789', 'Deposit', '2026-05-20 14:30:00'),
  ('af000000-0000-0000-0000-000000000004', 'ad000000-0000-0000-0000-000000000002', 6500, 'upi', 'UPI-PhonePe-123456', 'Partial payment', '2026-05-23 10:45:00'),
  ('af000000-0000-0000-0000-000000000005', 'ad000000-0000-0000-0000-000000000004', 8000, 'bank_transfer', 'NEFT-TCS-2026052301', 'Corporate advance', '2026-05-23 09:00:00'),
  ('af000000-0000-0000-0000-000000000006', 'ad000000-0000-0000-0000-000000000004', 21678, 'card', 'TXN-ICICI-32165498', 'Settlement', '2026-05-26 10:00:00'),
  ('af000000-0000-0000-0000-000000000007', 'ad000000-0000-0000-0000-000000000005', 2000, 'cash', NULL, 'Deposit at check-in', '2026-05-24 16:30:00'),
  ('af000000-0000-0000-0000-000000000008', 'ad000000-0000-0000-0000-000000000005', 3000, 'upi', 'UPI-GPay-789012', 'Partial payment', '2026-05-25 09:00:00'),
  ('af000000-0000-0000-0000-000000000009', 'ad000000-0000-0000-0000-000000000006', 6000, 'bank_transfer', 'NEFT-NCL-2026052301', 'Institutional advance', '2026-05-23 10:00:00'),
  ('af000000-0000-0000-0000-000000000010', 'ad000000-0000-0000-0000-000000000006', 20518, 'card', 'TXN-SBI-65432198', 'Final settlement', '2026-05-27 11:00:00')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SEED COMPLETE
-- Run supabase/rbac.sql after this for role permissions and demo RBAC users.
-- =============================================================================
