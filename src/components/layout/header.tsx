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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

interface SessionUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "booking" | "housekeeping" | "fnb" | "payment" | "alert";
  read: boolean;
}

function getRoleNotifications(role: string): Notification[] {
  const now = new Date();
  const timeAgo = (mins: number) => {
    const d = new Date(now.getTime() - mins * 60000);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const common: Notification[] = [
    { id: "1", title: "System Update", message: "Dashboard data refreshed successfully", time: timeAgo(2), type: "alert", read: false },
  ];

  const roleNotifs: Record<string, Notification[]> = {
    admin: [
      { id: "a1", title: "New Booking Confirmed", message: "BK-2026-0016 confirmed for Dr. Sharma — Room 305, May 26-28", time: timeAgo(5), type: "booking", read: false },
      { id: "a2", title: "Payment Received", message: "₹18,000 received from Mr. Ankit Patel via UPI", time: timeAgo(15), type: "payment", read: false },
      { id: "a3", title: "Housekeeping Alert", message: "3 rooms pending cleaning for over 2 hours", time: timeAgo(30), type: "housekeeping", read: true },
      { id: "a4", title: "Check-out Overdue", message: "Room 412 — guest has not checked out (due 11:00 AM)", time: timeAgo(45), type: "alert", read: true },
    ],
    front_desk: [
      { id: "f1", title: "New Booking Confirmed", message: "BK-2026-0016 confirmed for Dr. Sharma — Room 305, May 26-28", time: timeAgo(5), type: "booking", read: false },
      { id: "f2", title: "Guest Arriving Today", message: "Dr. Rajesh Kumar — Room 301, check-in at 14:00", time: timeAgo(10), type: "booking", read: false },
      { id: "f3", title: "Check-out Overdue", message: "Room 412 — guest has not checked out (due 11:00 AM)", time: timeAgo(45), type: "alert", read: false },
      { id: "f4", title: "Room Ready", message: "Room 208 is now clean and inspected — ready for next guest", time: timeAgo(60), type: "housekeeping", read: true },
    ],
    housekeeping: [
      { id: "h1", title: "New Task Assigned", message: "Room 215 needs urgent cleaning — VIP arriving at 14:00", time: timeAgo(3), type: "housekeeping", read: false },
      { id: "h2", title: "Task Assigned", message: "Room 307 — standard turnover cleaning", time: timeAgo(20), type: "housekeeping", read: false },
      { id: "h3", title: "Inspection Passed", message: "Room 315 passed supervisor inspection", time: timeAgo(40), type: "housekeeping", read: true },
      { id: "h4", title: "Maintenance Alert", message: "Room 304 — AC repair technician arriving at 15:00", time: timeAgo(90), type: "alert", read: true },
    ],
    fnb: [
      { id: "n1", title: "New Room Service Order", message: "ORD-2026-0009 — Room 204, 2x Coffee + Samosa", time: timeAgo(2), type: "fnb", read: false },
      { id: "n2", title: "Order Ready for Delivery", message: "ORD-2026-0004 — Room 119, Paneer Butter Masala + Dal", time: timeAgo(12), type: "fnb", read: false },
      { id: "n3", title: "Low Stock Alert", message: "Fresh juice stock running low — reorder needed", time: timeAgo(60), type: "alert", read: true },
    ],
    accounts: [
      { id: "c1", title: "Payment Received", message: "₹18,000 received from Mr. Ankit Patel via UPI", time: timeAgo(5), type: "payment", read: false },
      { id: "c2", title: "Invoice Overdue", message: "INV-2026-0003 — Prof. Meera Sharma, ₹10,371 pending 2 days", time: timeAgo(15), type: "payment", read: false },
      { id: "c3", title: "Invoice Generated", message: "INV-2026-0008 draft created for Room 113 stay", time: timeAgo(60), type: "payment", read: true },
      { id: "c4", title: "GST Filing Reminder", message: "Monthly GST return due in 5 days", time: timeAgo(120), type: "alert", read: true },
    ],
  };

  return [...(roleNotifs[role] || roleNotifs["admin"]), ...common];
}

const typeIcons: Record<string, { icon: typeof Bell; color: string }> = {
  booking: { icon: CalendarCheck, color: "text-blue-500 bg-blue-50" },
  housekeeping: { icon: Sparkles, color: "text-amber-500 bg-amber-50" },
  fnb: { icon: UtensilsCrossed, color: "text-purple-500 bg-purple-50" },
  payment: { icon: IndianRupee, color: "text-green-500 bg-green-50" },
  alert: { icon: AlertTriangle, color: "text-red-500 bg-red-50" },
};

export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setNotifications(getRoleNotifications(data.user.role));
        }
      })
      .catch(() => {});
  }, []);

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

  const roleLabel: Record<string, string> = {
    admin: "Administrator",
    front_desk: "Front Desk",
    housekeeping: "Housekeeping",
    fnb: "F&B Manager",
    accounts: "Accounts",
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search rooms, guests, bookings..."
            className="w-80 pl-10"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div className="relative" ref={panelRef}>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                {unreadCount}
              </span>
            )}
          </Button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-96 rounded-xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] text-[#D4A017] hover:underline font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowNotifications(false)}>
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                {notifications.map((notif) => {
                  const { icon: Icon, color } = typeIcons[notif.type] || typeIcons.alert;
                  return (
                    <div
                      key={notif.id}
                      className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                        !notif.read ? "bg-blue-50/30" : ""
                      }`}
                      onClick={() => markAsRead(notif.id)}
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs font-medium truncate ${!notif.read ? "text-gray-900" : "text-gray-600"}`}>
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{notif.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {notifications.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <CheckCircle className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">All caught up!</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-gray-200" />

        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1E2A44] text-white">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900">
              {user?.full_name ?? "Loading..."}
            </p>
            <p className="text-xs text-gray-500">
              {user ? roleLabel[user.role] ?? user.role : ""}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-red-600"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
