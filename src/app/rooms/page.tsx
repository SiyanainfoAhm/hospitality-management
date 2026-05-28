"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  BedDouble,
  Filter,
  Grid3X3,
  List,
  Search,
  Wrench,
  Eye,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { cn, roomStatusColors, roomStatusLabels, formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { useAuth } from "@/lib/auth/useAuth";

interface RoomData {
  id: string;
  room_number: string;
  floor: number;
  type: string;
  status: string;
  rate: number;
  notes?: string;
  room_type_id?: string;
}

interface RoomType {
  id: string;
  name: string;
  base_rate: number;
}

const roomTypeNames = ["All", "Standard Single", "Deluxe Double", "Suite", "Executive Suite"];
const floors = ["All", "1", "2", "3", "4", "5", "6"];
const statuses = [
  "All",
  "available",
  "reserved",
  "checked_in",
  "checked_out",
  "dirty",
  "clean",
  "under_repair",
  "maintenance_resolved",
  "cleaning_required",
  "needs_inspection",
  "blocked",
];

const allStatuses = [
  "available",
  "reserved",
  "checked_in",
  "checked_out",
  "dirty",
  "clean",
  "under_repair",
  "maintenance_resolved",
  "cleaning_required",
  "needs_inspection",
  "blocked",
];

export default function RoomsPage() {
  const { role, hasPermission } = useAuth();
  const canUpdateRoom = hasPermission("rooms", "update");
  const canCreateMaint = hasPermission("maintenance", "create");

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [filterFloor, setFilterFloor] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Room dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState({ room_number: "", floor: "1", room_type_id: "", status: "available", notes: "" });
  const [adding, setAdding] = useState(false);

  // View Room dialog
  const [viewRoom, setViewRoom] = useState<RoomData | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Update Room dialog
  const [updateRoom, setUpdateRoom] = useState<RoomData | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState({ status: "", notes: "", room_type_id: "" });
  const [updating, setUpdating] = useState(false);

  const fetchRooms = (params?: { search?: string; floor?: string; type?: string; status?: string }) => {
    const qp = new URLSearchParams();
    const s = params?.search ?? search;
    const f = params?.floor ?? filterFloor;
    const t = params?.type ?? filterType;
    const st = params?.status ?? filterStatus;

    if (s) qp.set("search", s);
    if (f !== "All") qp.set("floor", f);
    if (t !== "All") qp.set("type", t);
    if (st !== "All") qp.set("status", st);

    const url = `/api/rooms${qp.toString() ? `?${qp.toString()}` : ""}`;
    setLoading(true);
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.rooms) setRooms(data.rooms);
        if (data.roomTypes) setRoomTypes(data.roomTypes);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchRooms();
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterFloor, filterType, filterStatus]);

  const filteredRooms = rooms;

  const openAddRoom = () => {
    setAddForm({ room_number: "", floor: "1", room_type_id: roomTypes[0]?.id || "", status: "available", notes: "" });
    setAddDialogOpen(true);
  };

  const handleAddRoom = async () => {
    if (!addForm.room_number) {
      toast.error("Room number is required");
      return;
    }
    if (!addForm.room_type_id) {
      toast.error("Room type is required");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to add room");
        return;
      }

      setRooms((prev) => [...prev, data.room].sort((a, b) => a.room_number.localeCompare(b.room_number)));
      toast.success(`Room ${data.room.room_number} added successfully`);
      setAddDialogOpen(false);
    } catch {
      toast.error("Network error — could not add room");
    } finally {
      setAdding(false);
    }
  };

  const openViewRoom = (room: RoomData) => {
    setViewRoom(room);
    setViewDialogOpen(true);
  };

  const openUpdateRoom = (room: RoomData) => {
    setUpdateRoom(room);
    setUpdateForm({
      status: room.status,
      notes: room.notes || "",
      room_type_id: room.room_type_id || "",
    });
    setUpdateDialogOpen(true);
  };

  const handleUpdateRoom = async () => {
    if (!updateRoom) return;

    setUpdating(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: updateRoom.id,
          status: updateForm.status,
          notes: updateForm.notes,
          room_type_id: updateForm.room_type_id,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to update room");
        return;
      }

      setRooms((prev) => prev.map((r) => (r.id === updateRoom.id ? data.room : r)));
      toast.success(`Room ${updateRoom.room_number} updated`);
      setUpdateDialogOpen(false);
    } catch {
      toast.error("Network error — could not update room");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <AppLayout module="rooms">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Room Management</h1>
            <p className="text-sm text-gray-500">
              {rooms.length} rooms across {new Set(rooms.map((r) => r.floor)).size} floors
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PermissionGate module="rooms" action="create">
              <Button size="sm" onClick={openAddRoom}>
                <Plus className="h-4 w-4 mr-1" /> Add Room
              </Button>
            </PermissionGate>
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Filter className="h-4 w-4 text-gray-400 shrink-0" />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search room..."
                  className="w-40 pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="w-32">
                <SearchableSelect
                  options={floors.map((f) => ({
                    label: f === "All" ? "All Floors" : `Floor ${f}`,
                    value: f,
                  }))}
                  value={filterFloor}
                  onChange={setFilterFloor}
                  placeholder="All Floors"
                  searchPlaceholder="Search floor..."
                  emptyText="No floor found"
                />
              </div>
              <div className="w-40">
                <SearchableSelect
                  options={roomTypeNames.map((t) => ({
                    label: t === "All" ? "All Types" : t,
                    value: t,
                  }))}
                  value={filterType}
                  onChange={setFilterType}
                  placeholder="All Types"
                  searchPlaceholder="Search room type..."
                  emptyText="No type found"
                />
              </div>
              <div className="w-44">
                <SearchableSelect
                  options={statuses.map((s) => ({
                    label: s === "All" ? "All Statuses" : roomStatusLabels[s] || s,
                    value: s,
                  }))}
                  value={filterStatus}
                  onChange={setFilterStatus}
                  placeholder="All Statuses"
                  searchPlaceholder="Search status..."
                  emptyText="No status found"
                />
              </div>
              <Badge variant="secondary" className="shrink-0">{filteredRooms.length} rooms</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : rooms.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BedDouble className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No rooms found</h3>
              <p className="text-sm text-gray-500 mb-4">Get started by adding your first room, or run seed.sql to populate sample data.</p>
              <Button onClick={openAddRoom}>
                <Plus className="h-4 w-4 mr-1" /> Add First Room
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group flex flex-col"
              >
                <div className="p-4 flex flex-col flex-1" onClick={() => openViewRoom(room)}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-gray-900">{room.room_number}</span>
                    <BedDouble className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{room.type}</p>
                  <div className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border", roomStatusColors[room.status])}>
                    {roomStatusLabels[room.status]}
                  </div>
                </div>
                <div className="flex items-center border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="h-8 text-xs flex-1 rounded-none" onClick={() => openViewRoom(room)}>
                    <Eye className="h-3 w-3 mr-1" /> View
                  </Button>
                  {canUpdateRoom ? (
                    <>
                      <div className="w-px h-5 bg-gray-100" />
                      <Button variant="ghost" size="sm" className="h-8 text-xs flex-1 rounded-none" onClick={() => openUpdateRoom(room)}>
                        <Wrench className="h-3 w-3 mr-1" /> Update
                      </Button>
                    </>
                  ) : role === "maintenance_staff" && canCreateMaint ? (
                    <>
                      <div className="w-px h-5 bg-gray-100" />
                      <Button asChild variant="ghost" size="sm" className="h-8 text-xs flex-1 rounded-none">
                        <Link href={`/maintenance?room_id=${encodeURIComponent(room.id)}`}>
                          <Wrench className="h-3 w-3 mr-1" /> Report / View Issue
                        </Link>
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Floor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRooms.map((room) => (
                      <tr key={room.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-900">{room.room_number}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">Floor {room.floor}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{room.type}</td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border", roomStatusColors[room.status])}>
                            {roomStatusLabels[room.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{room.rate.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openViewRoom(room)}>
                              <Eye className="h-3 w-3 mr-1" /> View
                            </Button>
                            {canUpdateRoom ? (
                              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openUpdateRoom(room)}>
                                <Wrench className="h-3 w-3 mr-1" /> Update
                              </Button>
                            ) : role === "maintenance_staff" && canCreateMaint ? (
                              <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                                <Link href={`/maintenance?room_id=${encodeURIComponent(room.id)}`}>
                                  <Wrench className="h-3 w-3 mr-1" /> Report / View Issue
                                </Link>
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Room Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Room</DialogTitle>
            <DialogDescription>Add a room to expand your property capacity.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Room Number</label>
                <Input
                  value={addForm.room_number}
                  onChange={(e) => setAddForm({ ...addForm, room_number: e.target.value })}
                  placeholder="e.g. 501"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Floor</label>
                <SearchableSelect
                  options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((f) => ({
                    label: `Floor ${f}`,
                    value: f.toString(),
                  }))}
                  value={addForm.floor}
                  onChange={(v) => setAddForm({ ...addForm, floor: v })}
                  placeholder="Select floor"
                  searchPlaceholder="Search floor..."
                  emptyText="No floor found"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Room Type</label>
              <SearchableSelect
                options={roomTypes.map((rt) => ({
                  label: rt.name,
                  value: rt.id,
                  description: `₹${rt.base_rate.toLocaleString()}/night`,
                }))}
                value={addForm.room_type_id}
                onChange={(v) => setAddForm({ ...addForm, room_type_id: v })}
                placeholder="Select room type..."
                searchPlaceholder="Search room type..."
                emptyText="No room type found"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Initial Status</label>
              <SearchableSelect
                options={[
                  { label: "Available", value: "available" },
                  { label: "Blocked", value: "blocked" },
                  { label: "Under Repair", value: "under_repair" },
                ]}
                value={addForm.status}
                onChange={(v) => setAddForm({ ...addForm, status: v })}
                placeholder="Select status..."
                searchPlaceholder="Search status..."
                emptyText="No status found"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Notes (optional)</label>
              <Input
                value={addForm.notes}
                onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                placeholder="e.g. Newly renovated, corner room"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddRoom} disabled={adding}>
              {adding ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              Add Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Room Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Room {viewRoom?.room_number}</DialogTitle>
            <DialogDescription>Room details and current status</DialogDescription>
          </DialogHeader>
          {viewRoom && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-[11px] text-gray-500 uppercase font-medium mb-1">Room Number</p>
                  <p className="text-lg font-bold text-gray-900">{viewRoom.room_number}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-[11px] text-gray-500 uppercase font-medium mb-1">Floor</p>
                  <p className="text-lg font-bold text-gray-900">Floor {viewRoom.floor}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-[11px] text-gray-500 uppercase font-medium mb-1">Type</p>
                  <p className="text-sm font-semibold text-gray-900">{viewRoom.type}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-[11px] text-gray-500 uppercase font-medium mb-1">Rate</p>
                  <p className="text-lg font-bold text-[#1E2A44]">{formatCurrency(viewRoom.rate)}<span className="text-xs font-normal text-gray-500">/night</span></p>
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-[11px] text-gray-500 uppercase font-medium mb-2">Current Status</p>
                <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border", roomStatusColors[viewRoom.status])}>
                  {roomStatusLabels[viewRoom.status]}
                </span>
              </div>
              {viewRoom.notes && (
                <div className="rounded-lg border p-3">
                  <p className="text-[11px] text-gray-500 uppercase font-medium mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{viewRoom.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
            {canUpdateRoom && (
              <Button onClick={() => { setViewDialogOpen(false); if (viewRoom) openUpdateRoom(viewRoom); }}>
                <Wrench className="h-4 w-4 mr-1" /> Update Room
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Room Dialog */}
      <Dialog open={updateDialogOpen && canUpdateRoom} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Room {updateRoom?.room_number}</DialogTitle>
            <DialogDescription>Change room status, type, or add notes.</DialogDescription>
          </DialogHeader>
          {updateRoom && (
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                <SearchableSelect
                  options={allStatuses.map((s) => ({
                    label: roomStatusLabels[s] || s,
                    value: s,
                  }))}
                  value={updateForm.status}
                  onChange={(v) => setUpdateForm({ ...updateForm, status: v })}
                  placeholder="Select status..."
                  searchPlaceholder="Search status..."
                  emptyText="No status found"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Room Type</label>
                <SearchableSelect
                  options={roomTypes.map((rt) => ({
                    label: rt.name,
                    value: rt.id,
                    description: `₹${rt.base_rate.toLocaleString()}/night`,
                  }))}
                  value={updateForm.room_type_id}
                  onChange={(v) => setUpdateForm({ ...updateForm, room_type_id: v })}
                  placeholder="Select room type..."
                  searchPlaceholder="Search room type..."
                  emptyText="No room type found"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Notes</label>
                <Input
                  value={updateForm.notes}
                  onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                  placeholder="e.g. Guest requested late checkout"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateRoom} disabled={updating}>
              {updating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Wrench className="h-4 w-4 mr-1" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
