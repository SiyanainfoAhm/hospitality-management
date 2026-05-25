export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "front_desk" | "housekeeping" | "fnb" | "accounts";
  avatar_url: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

/** @deprecated Use User instead — profiles table merged into users */
export type Profile = User;

export interface RoomType {
  id: string;
  name: string;
  description: string;
  base_rate: number;
  max_occupancy: number;
  amenities: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  room_number: string;
  floor: number;
  room_type_id: string;
  status: RoomStatus;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  room_type?: RoomType;
}

export type RoomStatus =
  | "available"
  | "reserved"
  | "checked_in"
  | "checked_out"
  | "dirty"
  | "clean"
  | "under_repair"
  | "blocked";

export interface RatePlan {
  id: string;
  name: string;
  description: string;
  room_type_id: string;
  rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Season {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  multiplier: number;
  is_active: boolean;
}

export interface Guest {
  id: string;
  full_name: string;
  mobile: string;
  email: string;
  id_proof_type: string;
  id_proof_number: string;
  address: string;
  company_name: string | null;
  gst_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: string;
  booking_code: string;
  guest_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children: number;
  rate_plan_id: string;
  status: ReservationStatus;
  deposit_amount: number;
  total_amount: number;
  source: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  guest?: Guest;
  room?: Room;
  rate_plan?: RatePlan;
}

export type ReservationStatus =
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "cancelled"
  | "no_show";

export interface ReservationAddon {
  id: string;
  reservation_id: string;
  addon_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface Checkin {
  id: string;
  reservation_id: string;
  room_id: string;
  checked_in_at: string;
  checked_out_at: string | null;
  checked_in_by: string | null;
  checked_out_by: string | null;
  notes: string | null;
}

export interface HousekeepingTask {
  id: string;
  room_id: string;
  assigned_to: string | null;
  status: HousekeepingStatus;
  priority: "low" | "normal" | "high" | "urgent";
  notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  room?: Room;
  assignee?: Profile;
}

export type HousekeepingStatus =
  | "dirty"
  | "assigned"
  | "cleaning"
  | "clean"
  | "inspected"
  | "under_repair";

export interface MaintenanceRequest {
  id: string;
  room_id: string;
  reported_by: string | null;
  title: string;
  description: string;
  priority: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FnbCategory {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export interface FnbItem {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  is_veg: boolean;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  category?: FnbCategory;
}

export interface FnbOrder {
  id: string;
  order_code: string;
  room_id: string | null;
  guest_id: string | null;
  order_type: "room_service" | "restaurant" | "takeaway";
  status: "pending" | "preparing" | "served" | "completed" | "cancelled";
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  posted_to_room: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  room?: Room;
  guest?: Guest;
  items?: FnbOrderItem[];
}

export interface FnbOrderItem {
  id: string;
  order_id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  reservation_id: string;
  guest_id: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  status: InvoiceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  guest?: Guest;
  reservation?: Reservation;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export type InvoiceStatus =
  | "draft"
  | "issued"
  | "paid"
  | "partially_paid"
  | "cancelled";

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  category: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_mode: "cash" | "upi" | "card" | "bank_transfer" | "bill_to_company";
  reference_number: string | null;
  notes: string | null;
  paid_at: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}
