import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  BedDouble,
  CalendarCheck,
  LogIn,
  Sparkles,
  Wrench,
  UtensilsCrossed,
  Receipt,
  BarChart3,
  Settings,
} from "lucide-react";

export type Role =
  | "admin"
  | "front_desk"
  | "housekeeping"
  | "fnb_manager"
  | "accounts"
  | "maintenance_staff";

export type Module =
  | "dashboard"
  | "rooms"
  | "reservations"
  | "checkin_checkout"
  | "housekeeping"
  | "maintenance"
  | "fnb_pos"
  | "billing"
  | "reports"
  | "settings"
  | "user_management";

export type PermissionAction =
  | "view"
  | "create"
  | "update"
  | "delete"
  | "assign";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  front_desk: "Front Desk",
  housekeeping: "Housekeeping",
  fnb_manager: "F&B Manager",
  accounts: "Accounts",
  maintenance_staff: "Maintenance Staff",
};

export const ROLE_PERMISSIONS: Record<
  Role,
  Partial<Record<Module, PermissionAction[]>>
> = {
  admin: {
    dashboard: ["view"],
    rooms: ["view", "create", "update", "delete"],
    reservations: ["view", "create", "update", "delete"],
    checkin_checkout: ["view", "create", "update"],
    housekeeping: ["view", "create", "update", "delete", "assign"],
    maintenance: ["view", "create", "update", "delete", "assign"],
    fnb_pos: ["view", "create", "update", "delete"],
    billing: ["view", "create", "update", "delete"],
    reports: ["view"],
    settings: ["view", "update"],
    user_management: ["view", "create", "update", "delete"],
  },
  front_desk: {
    dashboard: ["view"],
    rooms: ["view"],
    reservations: ["view", "create", "update"],
    checkin_checkout: ["view", "create", "update"],
    maintenance: ["view", "create", "assign"],
  },
  housekeeping: {
    dashboard: ["view"],
    rooms: ["view"],
    housekeeping: ["view", "update"],
    maintenance: ["view", "create", "assign"],
  },
  maintenance_staff: {
    dashboard: ["view"],
    rooms: ["view"],
    maintenance: ["view", "update"],
  },
  fnb_manager: {
    dashboard: ["view"],
    fnb_pos: ["view", "create", "update"],
  },
  accounts: {
    dashboard: ["view"],
    billing: ["view", "create", "update"],
    reports: ["view"],
  },
};

/** Map legacy DB role values to app roles */
export function normalizeRole(role: string): Role | null {
  const map: Record<string, Role> = {
    admin: "admin",
    front_desk: "front_desk",
    housekeeping: "housekeeping",
    fnb_manager: "fnb_manager",
    fnb: "fnb_manager",
    accounts: "accounts",
    maintenance_staff: "maintenance_staff",
    maintenance: "maintenance_staff",
  };
  return map[role] ?? null;
}

export function canRecordInvoicePayment(
  role: string | null | undefined,
  context: "checkout" | "billing" = "billing"
): boolean {
  if (!role) return false;
  const normalized = normalizeRole(role);
  if (!normalized) return false;
  if (normalized === "admin" || normalized === "accounts") return true;
  if (normalized === "front_desk" && context === "checkout") return true;
  return false;
}

export function canAccess(
  role: string | null | undefined,
  module: Module,
  action: PermissionAction = "view"
): boolean {
  if (!role) return false;
  const normalized = normalizeRole(role);
  if (!normalized) return false;
  const perms = ROLE_PERMISSIONS[normalized]?.[module];
  return perms?.includes(action) ?? false;
}

export const NAV_ITEMS: {
  label: string;
  href: string;
  module: Module;
  icon: LucideIcon;
}[] = [
  { label: "Dashboard", href: "/dashboard", module: "dashboard", icon: LayoutDashboard },
  { label: "Rooms", href: "/rooms", module: "rooms", icon: BedDouble },
  { label: "Reservations", href: "/reservations", module: "reservations", icon: CalendarCheck },
  { label: "Check-in / Out", href: "/checkin", module: "checkin_checkout", icon: LogIn },
  { label: "Housekeeping", href: "/housekeeping", module: "housekeeping", icon: Sparkles },
  { label: "Maintenance", href: "/maintenance", module: "maintenance", icon: Wrench },
  { label: "F&B POS", href: "/fnb", module: "fnb_pos", icon: UtensilsCrossed },
  { label: "Billing", href: "/billing", module: "billing", icon: Receipt },
  { label: "Reports", href: "/reports", module: "reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", module: "settings", icon: Settings },
];

/** Path → module for page guards (includes route aliases) */
export const ROUTE_MODULE_MAP: Record<string, Module> = {
  "/dashboard": "dashboard",
  "/rooms": "rooms",
  "/reservations": "reservations",
  "/checkin": "checkin_checkout",
  "/check-in-out": "checkin_checkout",
  "/housekeeping": "housekeeping",
  "/maintenance": "maintenance",
  "/fnb": "fnb_pos",
  "/fnb-pos": "fnb_pos",
  "/billing": "billing",
  "/reports": "reports",
  "/settings": "settings",
  "/users": "user_management",
};

export function getModuleForPath(pathname: string): Module | null {
  const sorted = Object.entries(ROUTE_MODULE_MAP).sort(
    (a, b) => b[0].length - a[0].length
  );
  for (const [path, module] of sorted) {
    if (pathname === path || pathname.startsWith(path + "/")) {
      return module;
    }
  }
  return null;
}

export function getVisibleNavItems(role: string | null | undefined) {
  return NAV_ITEMS.filter((item) => canAccess(role, item.module, "view"));
}
