"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Settings,
  Users,
  BedDouble,
  IndianRupee,
  Calendar,
  UtensilsCrossed,
  Shield,
  Plus,
  Edit,
  Trash2,
  Check,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { useAuth } from "@/lib/auth/useAuth";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface RoomTypeItem {
  id: string;
  name: string;
  baseRate: number;
  maxOccupancy: number;
  count: number;
  amenities: string[];
}

interface RatePlanItem {
  id: string;
  name: string;
  description: string;
  modifier: string;
}

interface FnbItem {
  id: string;
  name: string;
  price: number;
  category: string;
  veg: boolean;
}

const initialUsers: UserItem[] = [
  { id: "1", name: "Admin User", email: "admin@iimn.ac.in", role: "admin", status: "active" },
  { id: "2", name: "Priya Sharma", email: "frontdesk@iimn.ac.in", role: "front_desk", status: "active" },
  { id: "3", name: "Ramesh Kumar", email: "hk@iimn.ac.in", role: "housekeeping", status: "active" },
  { id: "4", name: "Suresh Patel", email: "fnb@iimn.ac.in", role: "fnb", status: "active" },
  { id: "5", name: "Anita Verma", email: "accounts@iimn.ac.in", role: "accounts", status: "active" },
];

const initialRoomTypes: RoomTypeItem[] = [
  { id: "1", name: "Standard Single", baseRate: 2500, maxOccupancy: 1, count: 38, amenities: ["AC", "TV", "WiFi", "Desk"] },
  { id: "2", name: "Deluxe Double", baseRate: 3500, maxOccupancy: 2, count: 28, amenities: ["AC", "TV", "WiFi", "Desk", "Mini Bar", "Sofa"] },
  { id: "3", name: "Suite", baseRate: 6000, maxOccupancy: 3, count: 12, amenities: ["AC", "TV", "WiFi", "Desk", "Mini Bar", "Sofa", "Living Area", "Bathtub"] },
  { id: "4", name: "Executive Suite", baseRate: 8500, maxOccupancy: 4, count: 4, amenities: ["AC", "TV", "WiFi", "Desk", "Mini Bar", "Sofa", "Living Area", "Bathtub", "Kitchen", "Balcony"] },
];

const initialRatePlans: RatePlanItem[] = [
  { id: "1", name: "Rack Rate", description: "Standard published rate", modifier: "100%" },
  { id: "2", name: "Corporate Rate", description: "20% discount for corporate bookings", modifier: "80%" },
  { id: "3", name: "Government Rate", description: "30% discount for government officials", modifier: "70%" },
  { id: "4", name: "Long Stay", description: "25% discount for 7+ night stays", modifier: "75%" },
  { id: "5", name: "Special Event", description: "20% premium for special events", modifier: "120%" },
];

const initialFnbItems: FnbItem[] = [
  { id: "1", name: "Tea", price: 40, category: "Beverages", veg: true },
  { id: "2", name: "Coffee", price: 60, category: "Beverages", veg: true },
  { id: "3", name: "Masala Dosa", price: 120, category: "Breakfast", veg: true },
  { id: "4", name: "Paneer Butter Masala", price: 250, category: "Main Course", veg: true },
  { id: "5", name: "Chicken Biryani", price: 300, category: "Main Course", veg: false },
  { id: "6", name: "Veg Thali", price: 220, category: "Main Course", veg: true },
];

const rolePermissions = [
  { role: "Admin", permissions: ["All access", "User management", "Settings", "Reports", "Billing"] },
  { role: "Front Desk", permissions: ["Reservations", "Check-in/out", "Room status", "Guest management"] },
  { role: "Housekeeping", permissions: ["Housekeeping tasks", "Room status update", "Maintenance requests"] },
  { role: "F&B Manager", permissions: ["F&B orders", "Menu management", "POS operations"] },
  { role: "Accounts", permissions: ["Billing", "Invoices", "Payments", "Reports", "GST reports"] },
];

export default function SettingsPage() {
  // Users state
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    role: "front_desk",
    status: "active",
    password: "",
  });
  const [savingUser, setSavingUser] = useState(false);
  const { hasPermission } = useAuth();

  // Room types state
  const [roomTypes, setRoomTypes] = useState<RoomTypeItem[]>(initialRoomTypes);
  const [roomTypeDialogOpen, setRoomTypeDialogOpen] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState<RoomTypeItem | null>(null);
  const [roomTypeForm, setRoomTypeForm] = useState({ name: "", baseRate: "", maxOccupancy: "", count: "", amenities: "" });

  // Rate plans state
  const [ratePlans, setRatePlans] = useState<RatePlanItem[]>(initialRatePlans);
  const [ratePlanDialogOpen, setRatePlanDialogOpen] = useState(false);
  const [editingRatePlan, setEditingRatePlan] = useState<RatePlanItem | null>(null);
  const [ratePlanForm, setRatePlanForm] = useState({ name: "", description: "", modifier: "" });

  // F&B state
  const [fnbItems, setFnbItems] = useState<FnbItem[]>(initialFnbItems);
  const [fnbDialogOpen, setFnbDialogOpen] = useState(false);
  const [editingFnb, setEditingFnb] = useState<FnbItem | null>(null);
  const [fnbForm, setFnbForm] = useState({ name: "", price: "", category: "Beverages", veg: "true" });

  // === User handlers ===
  const openAddUser = () => {
    setEditingUser(null);
    setUserForm({ name: "", email: "", role: "front_desk", status: "active", password: "" });
    setUserDialogOpen(true);
  };

  const openEditUser = (user: UserItem) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      password: "",
    });
    setUserDialogOpen(true);
  };

  const saveUser = async () => {
    if (!userForm.name || !userForm.email) {
      toast.error("Name and email are required");
      return;
    }

    if (!editingUser) {
      if (!hasPermission("user_management", "create")) {
        toast.error("You do not have permission to create users");
        return;
      }
      if (!userForm.password || userForm.password.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }
      setSavingUser(true);
      try {
        const res = await fetch("/api/admin/create-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userForm.email,
            password: userForm.password,
            full_name: userForm.name,
            role: userForm.role,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to create user");
          return;
        }
        const newUser: UserItem = {
          id: data.user.id,
          name: data.user.full_name,
          email: data.user.email,
          role: data.user.role,
          status: "active",
        };
        setUsers((prev) => [...prev, newUser]);
        toast.success(`User "${userForm.name}" created`);
        setUserDialogOpen(false);
      } catch {
        toast.error("Failed to create user");
      } finally {
        setSavingUser(false);
      }
      return;
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === editingUser.id
          ? { ...u, name: userForm.name, email: userForm.email, role: userForm.role, status: userForm.status }
          : u
      )
    );
    toast.success(`User "${userForm.name}" updated`);
    setUserDialogOpen(false);
  };

  const deleteUser = (user: UserItem) => {
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
    toast.success(`User "${user.name}" removed`);
  };

  // === Room Type handlers ===
  const openAddRoomType = () => {
    setEditingRoomType(null);
    setRoomTypeForm({ name: "", baseRate: "", maxOccupancy: "", count: "", amenities: "" });
    setRoomTypeDialogOpen(true);
  };

  const openEditRoomType = (rt: RoomTypeItem) => {
    setEditingRoomType(rt);
    setRoomTypeForm({
      name: rt.name,
      baseRate: rt.baseRate.toString(),
      maxOccupancy: rt.maxOccupancy.toString(),
      count: rt.count.toString(),
      amenities: rt.amenities.join(", "),
    });
    setRoomTypeDialogOpen(true);
  };

  const saveRoomType = () => {
    if (!roomTypeForm.name || !roomTypeForm.baseRate) {
      toast.error("Name and base rate are required");
      return;
    }
    if (editingRoomType) {
      setRoomTypes((prev) =>
        prev.map((rt) =>
          rt.id === editingRoomType.id
            ? {
                ...rt,
                name: roomTypeForm.name,
                baseRate: Number(roomTypeForm.baseRate),
                maxOccupancy: Number(roomTypeForm.maxOccupancy) || 1,
                count: Number(roomTypeForm.count) || 0,
                amenities: roomTypeForm.amenities.split(",").map((a) => a.trim()).filter(Boolean),
              }
            : rt
        )
      );
      toast.success(`Room type "${roomTypeForm.name}" updated`);
    } else {
      const newRoomType: RoomTypeItem = {
        id: Date.now().toString(),
        name: roomTypeForm.name,
        baseRate: Number(roomTypeForm.baseRate),
        maxOccupancy: Number(roomTypeForm.maxOccupancy) || 1,
        count: Number(roomTypeForm.count) || 0,
        amenities: roomTypeForm.amenities.split(",").map((a) => a.trim()).filter(Boolean),
      };
      setRoomTypes((prev) => [...prev, newRoomType]);
      toast.success(`Room type "${roomTypeForm.name}" added`);
    }
    setRoomTypeDialogOpen(false);
  };

  const deleteRoomType = (rt: RoomTypeItem) => {
    setRoomTypes((prev) => prev.filter((r) => r.id !== rt.id));
    toast.success(`Room type "${rt.name}" removed`);
  };

  // === Rate Plan handlers ===
  const openAddRatePlan = () => {
    setEditingRatePlan(null);
    setRatePlanForm({ name: "", description: "", modifier: "" });
    setRatePlanDialogOpen(true);
  };

  const openEditRatePlan = (plan: RatePlanItem) => {
    setEditingRatePlan(plan);
    setRatePlanForm({ name: plan.name, description: plan.description, modifier: plan.modifier });
    setRatePlanDialogOpen(true);
  };

  const saveRatePlan = () => {
    if (!ratePlanForm.name || !ratePlanForm.modifier) {
      toast.error("Name and modifier are required");
      return;
    }
    if (editingRatePlan) {
      setRatePlans((prev) => prev.map((p) => p.id === editingRatePlan.id ? { ...p, ...ratePlanForm } : p));
      toast.success(`Rate plan "${ratePlanForm.name}" updated`);
    } else {
      const newPlan: RatePlanItem = { id: Date.now().toString(), ...ratePlanForm };
      setRatePlans((prev) => [...prev, newPlan]);
      toast.success(`Rate plan "${ratePlanForm.name}" added`);
    }
    setRatePlanDialogOpen(false);
  };

  // === F&B handlers ===
  const openAddFnb = () => {
    setEditingFnb(null);
    setFnbForm({ name: "", price: "", category: "Beverages", veg: "true" });
    setFnbDialogOpen(true);
  };

  const openEditFnb = (item: FnbItem) => {
    setEditingFnb(item);
    setFnbForm({ name: item.name, price: item.price.toString(), category: item.category, veg: item.veg.toString() });
    setFnbDialogOpen(true);
  };

  const saveFnb = () => {
    if (!fnbForm.name || !fnbForm.price) {
      toast.error("Name and price are required");
      return;
    }
    if (editingFnb) {
      setFnbItems((prev) =>
        prev.map((i) =>
          i.id === editingFnb.id
            ? { ...i, name: fnbForm.name, price: Number(fnbForm.price), category: fnbForm.category, veg: fnbForm.veg === "true" }
            : i
        )
      );
      toast.success(`"${fnbForm.name}" updated`);
    } else {
      const newItem: FnbItem = {
        id: Date.now().toString(),
        name: fnbForm.name,
        price: Number(fnbForm.price),
        category: fnbForm.category,
        veg: fnbForm.veg === "true",
      };
      setFnbItems((prev) => [...prev, newItem]);
      toast.success(`"${fnbForm.name}" added to menu`);
    }
    setFnbDialogOpen(false);
  };

  return (
    <AppLayout module="settings">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">System configuration and administration</p>
        </div>

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users"><Users className="h-4 w-4 mr-2" /> Users</TabsTrigger>
            <TabsTrigger value="roles"><Shield className="h-4 w-4 mr-2" /> Roles</TabsTrigger>
            <TabsTrigger value="room_types"><BedDouble className="h-4 w-4 mr-2" /> Room Types</TabsTrigger>
            <TabsTrigger value="rate_plans"><IndianRupee className="h-4 w-4 mr-2" /> Rate Plans</TabsTrigger>
            <TabsTrigger value="fnb"><UtensilsCrossed className="h-4 w-4 mr-2" /> F&B Menu</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">User Management</CardTitle>
                <PermissionGate module="user_management" action="create">
                  <Button size="sm" onClick={openAddUser}>
                    <Plus className="h-4 w-4 mr-1" /> Add User
                  </Button>
                </PermissionGate>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-sm font-medium">{user.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="capitalize text-xs">{user.role.replace("_", " ")}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={user.status === "active" ? "success" : "secondary"} className="text-xs capitalize">
                            {user.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditUser(user)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => deleteUser(user)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rolePermissions.map((role) => (
                <Card key={role.role}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-4 w-4 text-[#D4A017]" />
                      {role.role}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {role.permissions.map((perm) => (
                        <div key={perm} className="flex items-center gap-2 text-sm text-gray-600">
                          <Check className="h-3.5 w-3.5 text-green-500" />
                          {perm}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Room Types Tab */}
          <TabsContent value="room_types" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">
                  Total: {roomTypes.reduce((sum, rt) => sum + rt.count, 0)} rooms across {roomTypes.length} types
                </p>
              </div>
              <Button size="sm" onClick={openAddRoomType}><Plus className="h-4 w-4 mr-1" /> Add Room Type</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roomTypes.map((rt) => (
                <Card key={rt.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">{rt.name}</h3>
                        <p className="text-sm text-gray-500">{rt.count} rooms &bull; Max {rt.maxOccupancy} guest{rt.maxOccupancy > 1 ? "s" : ""}</p>
                      </div>
                      <span className="text-lg font-bold text-[#1E2A44]">{formatCurrency(rt.baseRate)}<span className="text-xs font-normal text-gray-500">/night</span></span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {rt.amenities.map((a) => (
                        <Badge key={a} variant="secondary" className="text-[10px]">{a}</Badge>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" size="sm" className="text-xs" onClick={() => openEditRoomType(rt)}>
                        <Edit className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs text-red-500 hover:text-red-700 hover:border-red-300" onClick={() => deleteRoomType(rt)}>
                        <Trash2 className="h-3 w-3 mr-1" /> Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Rate Plans Tab */}
          <TabsContent value="rate_plans" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Rate Plans</CardTitle>
                <Button size="sm" onClick={openAddRatePlan}><Plus className="h-4 w-4 mr-1" /> Add Plan</Button>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Plan Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Rate Modifier</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ratePlans.map((plan) => (
                      <tr key={plan.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-sm font-medium">{plan.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{plan.description}</td>
                        <td className="px-4 py-3">
                          <Badge variant={plan.modifier === "120%" ? "warning" : plan.modifier === "100%" ? "secondary" : "success"}>
                            {plan.modifier}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEditRatePlan(plan)}>
                            <Edit className="h-3 w-3 mr-1" /> Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* F&B Menu Tab */}
          <TabsContent value="fnb" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Menu Management</CardTitle>
                <Button size="sm" onClick={openAddFnb}><Plus className="h-4 w-4 mr-1" /> Add Item</Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {fnbItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <div className={`h-4 w-4 border ${item.veg ? "border-green-600" : "border-red-600"} flex items-center justify-center`}>
                          <div className={`h-2 w-2 rounded-full ${item.veg ? "bg-green-600" : "bg-red-600"}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-[10px] text-gray-500">{item.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{formatCurrency(item.price)}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditFnb(item)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* User Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "Update user details below." : "Fill in the details to create a new user."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name</label>
              <Input
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
              <Input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Role</label>
              <SearchableSelect
                options={[
                  { label: "Admin", value: "admin" },
                  { label: "Front Desk", value: "front_desk" },
                  { label: "Housekeeping", value: "housekeeping" },
                  { label: "Maintenance Staff", value: "maintenance_staff" },
                  { label: "F&B Manager", value: "fnb_manager" },
                  { label: "Accounts", value: "accounts" },
                ]}
                value={userForm.role}
                onChange={(v) => setUserForm({ ...userForm, role: v })}
                placeholder="Select role"
                searchPlaceholder="Search role..."
                emptyText="No role found"
              />
            </div>
            {!editingUser && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
                <Input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="Minimum 8 characters"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
              <SearchableSelect
                options={[
                  { label: "Active", value: "active" },
                  { label: "Inactive", value: "inactive" },
                ]}
                value={userForm.status}
                onChange={(v) => setUserForm({ ...userForm, status: v })}
                placeholder="Select status"
                searchPlaceholder="Search status..."
                emptyText="No status found"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveUser} disabled={savingUser}>
              {savingUser ? "Saving..." : editingUser ? "Save Changes" : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Room Type Dialog */}
      <Dialog open={roomTypeDialogOpen} onOpenChange={setRoomTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRoomType ? "Edit Room Type" : "Add New Room Type"}</DialogTitle>
            <DialogDescription>
              {editingRoomType ? "Update room type configuration." : "Define a new room type to expand capacity."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Room Type Name</label>
              <Input
                value={roomTypeForm.name}
                onChange={(e) => setRoomTypeForm({ ...roomTypeForm, name: e.target.value })}
                placeholder="e.g. Deluxe Double"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Base Rate (₹)</label>
                <Input
                  type="number"
                  value={roomTypeForm.baseRate}
                  onChange={(e) => setRoomTypeForm({ ...roomTypeForm, baseRate: e.target.value })}
                  placeholder="2500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Max Guests</label>
                <Input
                  type="number"
                  value={roomTypeForm.maxOccupancy}
                  onChange={(e) => setRoomTypeForm({ ...roomTypeForm, maxOccupancy: e.target.value })}
                  placeholder="2"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Room Count</label>
                <Input
                  type="number"
                  value={roomTypeForm.count}
                  onChange={(e) => setRoomTypeForm({ ...roomTypeForm, count: e.target.value })}
                  placeholder="20"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Amenities (comma-separated)</label>
              <Input
                value={roomTypeForm.amenities}
                onChange={(e) => setRoomTypeForm({ ...roomTypeForm, amenities: e.target.value })}
                placeholder="AC, TV, WiFi, Desk"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoomTypeDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveRoomType}>{editingRoomType ? "Save Changes" : "Add Room Type"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rate Plan Dialog */}
      <Dialog open={ratePlanDialogOpen} onOpenChange={setRatePlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRatePlan ? "Edit Rate Plan" : "Add Rate Plan"}</DialogTitle>
            <DialogDescription>
              {editingRatePlan ? "Update rate plan details." : "Create a new rate plan."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Plan Name</label>
              <Input
                value={ratePlanForm.name}
                onChange={(e) => setRatePlanForm({ ...ratePlanForm, name: e.target.value })}
                placeholder="e.g. Weekend Special"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
              <Input
                value={ratePlanForm.description}
                onChange={(e) => setRatePlanForm({ ...ratePlanForm, description: e.target.value })}
                placeholder="Brief description of the rate plan"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Rate Modifier (%)</label>
              <Input
                value={ratePlanForm.modifier}
                onChange={(e) => setRatePlanForm({ ...ratePlanForm, modifier: e.target.value })}
                placeholder="e.g. 80% for discount, 120% for premium"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRatePlanDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveRatePlan}>{editingRatePlan ? "Save Changes" : "Add Plan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* F&B Item Dialog */}
      <Dialog open={fnbDialogOpen} onOpenChange={setFnbDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFnb ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
            <DialogDescription>
              {editingFnb ? "Update menu item details." : "Add a new item to the F&B menu."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Item Name</label>
              <Input
                value={fnbForm.name}
                onChange={(e) => setFnbForm({ ...fnbForm, name: e.target.value })}
                placeholder="e.g. Paneer Tikka"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Price (₹)</label>
                <Input
                  type="number"
                  value={fnbForm.price}
                  onChange={(e) => setFnbForm({ ...fnbForm, price: e.target.value })}
                  placeholder="250"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
                <SearchableSelect
                  options={[
                    { label: "Beverages", value: "Beverages" },
                    { label: "Breakfast", value: "Breakfast" },
                    { label: "Starters", value: "Starters" },
                    { label: "Main Course", value: "Main Course" },
                    { label: "Desserts", value: "Desserts" },
                    { label: "Snacks", value: "Snacks" },
                  ]}
                  value={fnbForm.category}
                  onChange={(v) => setFnbForm({ ...fnbForm, category: v })}
                  placeholder="Select category"
                  searchPlaceholder="Search category..."
                  emptyText="No category found"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Type</label>
              <SearchableSelect
                options={[
                  { label: "Vegetarian", value: "true" },
                  { label: "Non-Vegetarian", value: "false" },
                ]}
                value={fnbForm.veg}
                onChange={(v) => setFnbForm({ ...fnbForm, veg: v })}
                placeholder="Select type"
                searchPlaceholder="Search type..."
                emptyText="No results found"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFnbDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveFnb}>{editingFnb ? "Save Changes" : "Add Item"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
