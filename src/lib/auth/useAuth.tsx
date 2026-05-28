"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  canAccess,
  normalizeRole,
  ROLE_LABELS,
  type Module,
  type PermissionAction,
  type Role,
} from "@/config/rbac";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_active?: boolean;
}

interface AuthContextValue {
  user: UserProfile | null;
  profile: UserProfile | null;
  role: Role | null;
  loading: boolean;
  isAdmin: boolean;
  hasPermission: (module: Module, action?: PermissionAction) => boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = await res.json();
      if (data.user) {
        const normalized = normalizeRole(data.user.role);
        if (normalized) {
          setUser({
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.full_name ?? "",
            role: normalized,
            is_active: data.user.is_active ?? true,
          });
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const role = user?.role ?? null;
  const isAdmin = role === "admin";

  const hasPermission = useCallback(
    (module: Module, action: PermissionAction = "view") => {
      if (!role) return false;
      return canAccess(role, module, action);
    },
    [role]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile: user,
      role,
      loading,
      isAdmin,
      hasPermission,
      refresh,
    }),
    [user, role, loading, isAdmin, hasPermission, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export function useRoleLabel(role: string | null) {
  if (!role) return "";
  const normalized = normalizeRole(role);
  return normalized ? ROLE_LABELS[normalized] : role;
}
