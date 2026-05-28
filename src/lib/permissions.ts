/** @deprecated Import from @/config/rbac instead */
export {
  type Role as AppRole,
  type Module as PermissionModule,
  type PermissionAction,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  NAV_ITEMS,
  ROUTE_MODULE_MAP,
  normalizeRole,
  canAccess,
  getModuleForPath,
  getVisibleNavItems,
} from "@/config/rbac";

import {
  ROLE_PERMISSIONS,
  canAccess,
  normalizeRole,
  type Module,
  type PermissionAction,
  type Role,
} from "@/config/rbac";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active?: boolean;
}

/** @deprecated Legacy shape for DB permission rows */
export interface ModulePermission {
  module: Module;
  can_view: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
}

type LegacyPermMap = Record<
  Module,
  { view: boolean; create: boolean; update: boolean; delete: boolean }
>;

function roleToLegacyMap(role: Role): LegacyPermMap {
  const modules = ROLE_PERMISSIONS[role] ?? {};
  const allModules: Module[] = [
    "dashboard",
    "rooms",
    "reservations",
    "checkin_checkout",
    "housekeeping",
    "maintenance",
    "fnb_pos",
    "billing",
    "reports",
    "settings",
    "user_management",
  ];
  const map = {} as LegacyPermMap;
  for (const mod of allModules) {
    map[mod] = {
      view: canAccess(role, mod, "view"),
      create: canAccess(role, mod, "create"),
      update: canAccess(role, mod, "update"),
      delete: canAccess(role, mod, "delete"),
    };
  }
  return map;
}

/** @deprecated Use ROLE_PERMISSIONS from @/config/rbac */
export const DEFAULT_PERMISSIONS: Record<Role, LegacyPermMap> = {
  admin: roleToLegacyMap("admin"),
  front_desk: roleToLegacyMap("front_desk"),
  housekeeping: roleToLegacyMap("housekeeping"),
  maintenance_staff: roleToLegacyMap("maintenance_staff"),
  fnb_manager: roleToLegacyMap("fnb_manager"),
  accounts: roleToLegacyMap("accounts"),
};

/** @deprecated Use canAccess from @/config/rbac */
export function permissionsFromRows(
  rows: ModulePermission[]
): LegacyPermMap {
  const map = {} as LegacyPermMap;
  for (const row of rows) {
    map[row.module] = {
      view: row.can_view,
      create: row.can_create,
      update: row.can_update,
      delete: row.can_delete,
    };
  }
  return map;
}

/** @deprecated Use canAccess(role, module, action) */
export function hasPermissionInMap(
  permissions: LegacyPermMap | null,
  role: string,
  module: Module,
  action: PermissionAction
): boolean {
  if (permissions?.[module]) {
    const mod = permissions[module];
    switch (action) {
      case "view":
        return mod.view;
      case "create":
        return mod.create;
      case "update":
        return mod.update;
      case "delete":
        return mod.delete;
      case "assign":
        return mod.update;
      default:
        return false;
    }
  }
  const normalized = normalizeRole(role);
  return normalized ? canAccess(normalized, module, action) : false;
}
