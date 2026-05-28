"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Phone,
  CheckCircle,
  XCircle,
  LogIn,
  Loader2,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { PermissionGate } from "@/components/auth/PermissionGate";

interface Reservation {
  id: string;
  booking_code: string;
  guest: string;
  mobile: string;
  email: string;
  room: string;
  type: string;
  rate_plan: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  status: string;
  amount: number;
  deposit: number;
  source: string;
  notes: string | null;
}

const statusColors: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-800",
  checked_in: "bg-green-100 text-green-800",
  checked_out: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
  no_show: "bg-amber-100 text-amber-800",
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [idProofType, setIdProofType] = useState("");
  const [roomType, setRoomType] = useState("");
  const [ratePlan, setRatePlan] = useState("rack");

  const fetchReservations = (params?: { search?: string; status?: string }) => {
    const qp = new URLSearchParams();
    const s = params?.search ?? search;
    const st = params?.status ?? filterStatus;

    if (s) qp.set("search", s);
    if (st !== "All") qp.set("status", st);

    const url = `/api/reservations${qp.toString() ? `?${qp.toString()}` : ""}`;
    setLoading(true);
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.reservations) setReservations(data.reservations);
      })
      .catch(() => toast.error("Failed to load reservations"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchReservations();
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterStatus]);

  const filtered = reservations;

  const handleCheckin = async (reservation: Reservation) => {
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservation_id: reservation.id, action: "checkin" }),
      });
      if (res.ok) {
        setReservations((prev) => prev.map((r) => r.id === reservation.id ? { ...r, status: "checked_in" } : r));
        toast.success(`${reservation.guest} checked in!`);
      } else {
        toast.error("Check-in failed");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleCheckout = async (reservation: Reservation) => {
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservation_id: reservation.id, action: "checkout" }),
      });
      if (res.ok) {
        setReservations((prev) => prev.map((r) => r.id === reservation.id ? { ...r, status: "checked_out" } : r));
        toast.success(`${reservation.guest} checked out!`);
      } else {
        toast.error("Check-out failed");
      }
    } catch {
      toast.error("Network error");
    }
  };

  if (loading) {
    return (
      <AppLayout module="reservations">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout module="reservations">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reservations</h1>
            <p className="text-sm text-gray-500">Manage bookings and guest reservations ({reservations.length} total)</p>
          </div>
          <PermissionGate module="reservations" action="create">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> New Reservation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Reservation</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Guest Name *</label>
                  <Input placeholder="Full name" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Mobile *</label>
                  <Input placeholder="+91 XXXXX XXXXX" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <Input placeholder="email@example.com" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">ID Proof Type</label>
                  <div className="mt-1">
                    <SearchableSelect
                      options={[
                        { label: "Aadhaar", value: "aadhaar" },
                        { label: "PAN Card", value: "pan" },
                        { label: "Passport", value: "passport" },
                        { label: "Driving License", value: "driving_license" },
                      ]}
                      value={idProofType}
                      onChange={setIdProofType}
                      placeholder="Select"
                      searchPlaceholder="Search document..."
                      emptyText="No document found"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">ID Proof Number</label>
                  <Input placeholder="Document number" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Room Type *</label>
                  <div className="mt-1">
                    <SearchableSelect
                      options={[
                        { label: "Standard", value: "standard", description: "₹2,500/night" },
                        { label: "Deluxe", value: "deluxe", description: "₹3,500/night" },
                        { label: "Suite", value: "suite", description: "₹6,000/night" },
                        { label: "Executive", value: "executive", description: "₹8,500/night" },
                      ]}
                      value={roomType}
                      onChange={setRoomType}
                      placeholder="Select"
                      searchPlaceholder="Search room type..."
                      emptyText="No room type found"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Check-in Date *</label>
                  <Input type="date" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Check-out Date *</label>
                  <Input type="date" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Adults</label>
                  <Input type="number" defaultValue={1} min={1} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Children</label>
                  <Input type="number" defaultValue={0} min={0} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Rate Plan</label>
                  <div className="mt-1">
                    <SearchableSelect
                      options={[
                        { label: "Rack Rate", value: "rack" },
                        { label: "Corporate Rate", value: "corporate" },
                        { label: "Government Rate", value: "government" },
                        { label: "Long Stay Rate", value: "long_stay" },
                      ]}
                      value={ratePlan}
                      onChange={setRatePlan}
                      placeholder="Select"
                      searchPlaceholder="Search rate plan..."
                      emptyText="No rate plan found"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Deposit Amount</label>
                  <Input type="number" placeholder="0" className="mt-1" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button onClick={() => { toast.success("Reservation created!"); setShowCreateDialog(false); }}>Create Reservation</Button>
              </div>
            </DialogContent>
          </Dialog>
          </PermissionGate>
        </div>

        {/* Search & Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by guest, mobile, booking ID, room..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="w-44">
                <SearchableSelect
                  options={[
                    { label: "All Statuses", value: "All" },
                    { label: "Confirmed", value: "confirmed" },
                    { label: "Checked In", value: "checked_in" },
                    { label: "Checked Out", value: "checked_out" },
                    { label: "Cancelled", value: "cancelled" },
                    { label: "No Show", value: "no_show" },
                  ]}
                  value={filterStatus}
                  onChange={setFilterStatus}
                  placeholder="All Statuses"
                  searchPlaceholder="Search status..."
                  emptyText="No status found"
                />
              </div>
              <Badge variant="secondary">{filtered.length} bookings</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Reservations Table */}
        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="p-8 text-center">
                <Loader2 className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No reservations found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-sm font-mono font-medium text-[#1E2A44]">{r.booking_code}</span>
                          {r.source && <p className="text-[10px] text-gray-400 capitalize">{r.source}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{r.guest}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {r.mobile}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium">{r.room}</p>
                            <p className="text-xs text-gray-500">{r.type}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-gray-600">
                            <p>{formatDate(r.check_in)}</p>
                            <p className="text-gray-400">to {formatDate(r.check_out)}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize", statusColors[r.status] || "bg-gray-100 text-gray-800")}>
                            {r.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">{formatCurrency(r.amount)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {r.status === "confirmed" && (
                              <>
                                <Button variant="ghost" size="sm" className="h-7 text-xs text-green-600" onClick={() => handleCheckin(r)}>
                                  <LogIn className="h-3 w-3 mr-1" /> Check-in
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600" onClick={() => toast.success("Booking cancelled")}>
                                  <XCircle className="h-3 w-3 mr-1" /> Cancel
                                </Button>
                              </>
                            )}
                            {r.status === "checked_in" && (
                              <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600" onClick={() => handleCheckout(r)}>
                                <CheckCircle className="h-3 w-3 mr-1" /> Check-out
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
