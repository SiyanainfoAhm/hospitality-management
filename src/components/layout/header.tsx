"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Search,
  User,
  LogOut,
  CalendarCheck,
  Sparkles,
  UtensilsCrossed,
  IndianRupee,
  AlertTriangle,
  CheckCircle,
  X,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth/useAuth";
import { ROLE_LABELS, type Role } from "@/config/rbac";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "booking" | "housekeeping" | "fnb" | "payment" | "alert" | "maintenance";
  read: boolean;
}

function getRoleNotifications(role: Role): Notification[] {
  const now = new Date();
  const timeAgo = (mins: number) => {
    const d = new Date(now.getTime() - mins * 60000);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const common: Notification[] = [
    {
      id: "sys-1",
      title: "System Update",
      message: "Dashboard data refreshed successfully",
      time: timeAgo(2),
      type: "alert",
      read: false,
    },
  ];

  const roleNotifs: Record<Role, Notification[]> = {
    admin: [
      {
        id: "a1",
        title: "New Booking Confirmed",
        message: "BK-2026-0016 confirmed for Dr. Sharma — Room 305",
        time: timeAgo(5),
        type: "booking",
        read: false,
      },
      {
        id: "a2",
        title: "Payment Received",
        message: "₹18,000 received via UPI",
        time: timeAgo(15),
        type: "payment",
        read: false,
      },
    ],
    front_desk: [
      {
        id: "f1",
        title: "Guest Arriving Today",
        message: "Dr. Rajesh Kumar — Room 301, check-in at 14:00",
        time: timeAgo(10),
        type: "booking",
        read: false,
      },
      {
        id: "f2",
        title: "Check-out Overdue",
        message: "Room 412 — guest has not checked out",
        time: timeAgo(45),
        type: "alert",
        read: false,
      },
    ],
    housekeeping: [
      {
        id: "h1",
        title: "New Task Assigned",
        message: "Room 215 — urgent cleaning assigned to you",
        time: timeAgo(3),
        type: "housekeeping",
        read: false,
      },
    ],
    maintenance_staff: [
      {
        id: "m1",
        title: "Repair Assigned",
        message: "Room 304 — AC repair assigned to you",
        time: timeAgo(8),
        type: "maintenance",
        read: false,
      },
    ],
    fnb_manager: [
      {
        id: "n1",
        title: "New Room Service Order",
        message: "ORD-2026-0009 — Room 204",
        time: timeAgo(2),
        type: "fnb",
        read: false,
      },
    ],
    accounts: [
      {
        id: "c1",
        title: "Invoice Overdue",
        message: "INV-2026-0003 — ₹10,371 pending",
        time: timeAgo(15),
        type: "payment",
        read: false,
      },
    ],
  };

  return [...(roleNotifs[role] ?? []), ...common];
}

const typeIcons: Record<string, { icon: typeof Bell; color: string }> = {
  booking: { icon: CalendarCheck, color: "text-blue-500 bg-blue-50" },
  housekeeping: { icon: Sparkles, color: "text-amber-500 bg-amber-50" },
  maintenance: { icon: Wrench, color: "text-orange-500 bg-orange-50" },
  fnb: { icon: UtensilsCrossed, color: "text-purple-500 bg-purple-50" },
  payment: { icon: IndianRupee, color: "text-green-500 bg-green-50" },
  alert: { icon: AlertTriangle, color: "text-red-500 bg-red-50" },
};

export function Header() {
  const router = useRouter();
  const { profile, role, loading, refresh } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (role) {
      setNotifications(getRoleNotifications(role));
    } else {
      setNotifications([]);
    }
  }, [role]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await refresh();
    toast.success("Logged out");
    router.push("/login");
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const roleLabel = role ? ROLE_LABELS[role] : null;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search rooms, guests, bookings..." className="w-80 pl-10" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative" ref={panelRef}>
          <Button
            variant="ghost"
            size="icon"
            className="relative text-gray-500"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </Button>
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-96 rounded-xl border border-gray-200 bg-white shadow-xl z-50">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-[#D4A017] hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowNotifications(false)}>
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notif) => {
                  const iconConfig = typeIcons[notif.type] || typeIcons.alert;
                  const Icon = iconConfig.icon;
                  return (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`flex gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
                        !notif.read ? "bg-blue-50/30" : ""
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconConfig.color}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${!notif.read ? "font-semibold text-gray-900" : "text-gray-700"}`}
                        >
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{notif.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{notif.time}</p>
                      </div>
                      {!notif.read && (
                        <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-gray-200" />

        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1E2A44] text-white">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden md:block min-w-[120px]">
            {loading ? (
              <div className="space-y-1.5">
                <div className="h-4 w-28 rounded bg-gray-200 animate-pulse" />
                <div className="h-5 w-20 rounded bg-gray-100 animate-pulse" />
              </div>
            ) : profile && roleLabel ? (
              <>
                <p className="text-sm font-medium text-gray-900 leading-tight">
                  {profile.full_name || profile.email}
                </p>
                <Badge variant="secondary" className="mt-0.5 text-[10px] font-medium">
                  {roleLabel}
                </Badge>
              </>
            ) : (
              <p className="text-xs text-amber-600 font-medium">Profile missing</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-red-600"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
