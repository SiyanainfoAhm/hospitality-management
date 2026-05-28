"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UtensilsCrossed,
  Plus,
  Minus,
  ShoppingCart,
  Search,
  Trash2,
  Send,
  Receipt,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { PermissionGate } from "@/components/auth/PermissionGate";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  isVeg: boolean;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface OrderItem {
  id: string;
  room: string | null;
  guest: string;
  total: number;
  status: string;
  type: string;
  time: string;
}

interface RoomOption {
  id: string;
  room_number: string;
}

const orderStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  preparing: "bg-blue-100 text-blue-800",
  served: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
};

export default function FnBPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [orderType, setOrderType] = useState("room_service");
  const [selectedRoom, setSelectedRoom] = useState("");

  const [categories, setCategories] = useState<string[]>(["All"]);

  const fetchMenu = (params?: { category?: string; search?: string }) => {
    const qp = new URLSearchParams();
    const cat = params?.category ?? selectedCategory;
    const s = params?.search ?? search;

    if (cat !== "All") qp.set("category", cat);
    if (s) qp.set("search", s);

    const url = `/api/fnb${qp.toString() ? `?${qp.toString()}` : ""}`;
    setLoading(true);
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.items) setMenuItems(data.items);
        if (data.orders) setOrders(data.orders);
        if (data.rooms) setRooms(data.rooms);
        if (data.items && categories.length <= 1) {
          const uniqueCats = Array.from(new Set(data.items.map((i: MenuItem) => i.category))) as string[];
          setCategories(["All", ...uniqueCats]);
        }
      })
      .catch(() => toast.error("Failed to load F&B data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchMenu();
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, search]);

  const filteredItems = menuItems;

  const addToCart = (item: MenuItem) => {
    const existing = cart.find((c) => c.id === item.id);
    if (existing) {
      setCart(cart.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map((c) => {
      if (c.id === id) {
        const newQty = c.quantity + delta;
        return newQty <= 0 ? null : { ...c, quantity: newQty };
      }
      return c;
    }).filter(Boolean) as CartItem[]);
  };

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  const [placing, setPlacing] = useState(false);

  const placeOrder = async () => {
    if (cart.length === 0) { toast.error("Cart is empty"); return; }
    if (orderType === "room_service" && !selectedRoom) {
      toast.error("Please select a room for room service");
      return;
    }

    setPlacing(true);
    try {
      const res = await fetch("/api/fnb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((c) => ({ id: c.id, name: c.name, price: c.price, quantity: c.quantity })),
          order_type: orderType,
          room_number: orderType === "room_service" ? selectedRoom : null,
          notes: null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to place order");
        return;
      }

      toast.success(`Order ${data.order_code} placed — ₹${data.total.toLocaleString()}`);
      setCart([]);

      // Refresh orders
      const refreshRes = await fetch("/api/fnb");
      const refreshData = await refreshRes.json();
      if (refreshData.orders) setOrders(refreshData.orders);
    } catch {
      toast.error("Network error — could not place order");
    } finally {
      setPlacing(false);
    }
  };

  const updateOrderStatus = async (orderCode: string, newStatus: string) => {
    try {
      const res = await fetch("/api/fnb", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_code: orderCode, status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) => prev.map((o) => o.id === orderCode ? { ...o, status: newStatus } : o));
        toast.success(`Order ${orderCode} → ${newStatus}`);
      } else {
        toast.error("Failed to update order");
      }
    } catch {
      toast.error("Network error");
    }
  };

  if (loading) {
    return (
      <AppLayout module="fnb_pos">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout module="fnb_pos">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">F&B Point of Sale</h1>
            <p className="text-sm text-gray-500">Restaurant and room service orders</p>
          </div>
        </div>

        <Tabs defaultValue="pos">
          <TabsList>
            <TabsTrigger value="pos"><ShoppingCart className="h-4 w-4 mr-2" /> New Order</TabsTrigger>
            <TabsTrigger value="orders"><Receipt className="h-4 w-4 mr-2" /> Orders ({orders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pos" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Menu Items */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input placeholder="Search menu items..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                  <div className="flex gap-1 overflow-x-auto">
                    {categories.map((cat) => (
                      <Button
                        key={cat}
                        variant={selectedCategory === cat ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(cat)}
                        className="whitespace-nowrap"
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredItems.map((item) => (
                    <Card
                      key={item.id}
                      className="cursor-pointer hover:shadow-md hover:border-[#D4A017] transition-all"
                      onClick={() => addToCart(item)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-xs font-medium text-gray-500">{item.category}</span>
                          {item.isVeg ? (
                            <div className="h-4 w-4 border border-green-600 flex items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-green-600" />
                            </div>
                          ) : (
                            <div className="h-4 w-4 border border-red-600 flex items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-red-600" />
                            </div>
                          )}
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">{item.name}</h3>
                        <p className="text-sm font-bold text-[#1E2A44]">{formatCurrency(item.price)}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Cart */}
              <div>
                <Card className="sticky top-20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" /> Cart
                      {cart.length > 0 && <Badge variant="secondary">{cart.length}</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <SearchableSelect
                        options={[
                          { label: "Room Service", value: "room_service" },
                          { label: "Restaurant", value: "restaurant" },
                          { label: "Takeaway", value: "takeaway" },
                        ]}
                        value={orderType}
                        onChange={setOrderType}
                        placeholder="Order type"
                        searchPlaceholder="Search order type..."
                        emptyText="No results found"
                      />
                      {orderType === "room_service" && (
                        <SearchableSelect
                          options={rooms.map((r) => ({
                            label: `Room ${r.room_number}`,
                            value: r.room_number,
                          }))}
                          value={selectedRoom}
                          onChange={setSelectedRoom}
                          placeholder="Select Room"
                          searchPlaceholder="Search room number..."
                          emptyText="No room found"
                        />
                      )}
                    </div>

                    {cart.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Cart is empty</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {cart.map((item) => (
                          <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{item.name}</p>
                              <p className="text-xs text-gray-500">{formatCurrency(item.price)} each</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, -1)}>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, 1)}>
                                <Plus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-medium w-16 text-right">{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {cart.length > 0 && (
                      <>
                        <div className="space-y-1 text-sm border-t pt-3">
                          <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>{formatCurrency(subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span>GST (5%)</span>
                            <span>{formatCurrency(tax)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t">
                            <span>Total</span>
                            <span>{formatCurrency(total)}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" onClick={() => setCart([])}>
                            <Trash2 className="h-4 w-4 mr-1" /> Clear
                          </Button>
                          <PermissionGate module="fnb_pos" action="create">
                            <Button onClick={placeOrder} disabled={placing}>
                              {placing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                              Place Order
                            </Button>
                          </PermissionGate>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {orders.length === 0 ? (
                  <div className="p-8 text-center">
                    <Receipt className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500">No orders yet</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50/50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room / Guest</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-4 py-3 text-sm font-mono">{order.id}</td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium">{order.guest}</p>
                            {order.room && <p className="text-xs text-gray-500">Room {order.room}</p>}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 capitalize">{order.type.replace("_", " ")}</td>
                          <td className="px-4 py-3 text-sm font-medium">{formatCurrency(order.total)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${orderStatusColors[order.status] || "bg-gray-100 text-gray-800"}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{order.time}</td>
                          <td className="px-4 py-3">
                            {order.status === "pending" && (
                              <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => updateOrderStatus(order.id, "preparing")}>
                                Start Prep
                              </Button>
                            )}
                            {order.status === "preparing" && (
                              <Button size="sm" className="h-6 text-[10px] px-2" variant="gold" onClick={() => updateOrderStatus(order.id, "served")}>
                                Mark Served
                              </Button>
                            )}
                            {order.status === "served" && (
                              <Button size="sm" className="h-6 text-[10px] px-2" variant="outline" onClick={() => updateOrderStatus(order.id, "completed")}>
                                Complete
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
