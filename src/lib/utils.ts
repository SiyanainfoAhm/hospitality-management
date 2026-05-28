import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function generateBookingCode(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `BK-${year}-${random}`;
}

export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${year}-${random}`;
}

export function generateOrderCode(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `ORD-${year}-${random}`;
}

export const roomStatusColors: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-800 border-emerald-200",
  reserved: "bg-blue-100 text-blue-800 border-blue-200",
  checked_in: "bg-purple-100 text-purple-800 border-purple-200",
  checked_out: "bg-orange-100 text-orange-800 border-orange-200",
  dirty: "bg-red-100 text-red-800 border-red-200",
  clean: "bg-teal-100 text-teal-800 border-teal-200",
  under_repair: "bg-yellow-100 text-yellow-800 border-yellow-200",
  maintenance_resolved: "bg-sky-100 text-sky-800 border-sky-200",
  cleaning_required: "bg-rose-100 text-rose-800 border-rose-200",
  needs_inspection: "bg-amber-100 text-amber-900 border-amber-200",
  blocked: "bg-gray-100 text-gray-800 border-gray-200",
};

export const roomStatusLabels: Record<string, string> = {
  available: "Available",
  reserved: "Reserved",
  checked_in: "Occupied",
  checked_out: "Checked Out",
  dirty: "Dirty",
  clean: "Clean",
  under_repair: "Under Repair",
  maintenance_resolved: "Maintenance Resolved",
  cleaning_required: "Cleaning Required",
  needs_inspection: "Needs Inspection",
  blocked: "Blocked",
};

export const reservationStatusColors: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-800",
  checked_in: "bg-green-100 text-green-800",
  checked_out: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
  no_show: "bg-yellow-100 text-yellow-800",
};
