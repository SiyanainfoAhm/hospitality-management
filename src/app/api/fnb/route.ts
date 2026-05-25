import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = createServerSupabaseClient();

  // Fetch menu items with categories
  const { data: items, error: itemsErr } = await supabase
    .from("hotel_management_fnb_items")
    .select(`
      id,
      name,
      description,
      price,
      is_veg,
      is_available,
      hotel_management_fnb_categories!category_id ( id, name )
    `)
    .eq("is_available", true)
    .order("name");

  // Fetch recent orders
  const { data: orders, error: ordersErr } = await supabase
    .from("hotel_management_fnb_orders")
    .select(`
      id,
      order_code,
      order_type,
      status,
      total_amount,
      notes,
      created_at,
      hotel_management_rooms!room_id ( room_number ),
      hotel_management_guests!guest_id ( full_name )
    `)
    .order("created_at", { ascending: false })
    .limit(20);

  // Fetch checked-in rooms for room service dropdown
  const { data: checkedInRooms } = await supabase
    .from("hotel_management_rooms")
    .select("id, room_number")
    .eq("status", "checked_in")
    .order("room_number");

  if (itemsErr || ordersErr) {
    return NextResponse.json({ error: itemsErr?.message || ordersErr?.message }, { status: 500 });
  }

  const formattedItems = (items || []).map((item: any) => {
    const category = item.hotel_management_fnb_categories as any;
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: category?.name ?? "Other",
      isVeg: item.is_veg,
    };
  });

  const formattedOrders = (orders || []).map((order: any) => {
    const room = order.hotel_management_rooms as any;
    const guest = order.hotel_management_guests as any;
    return {
      id: order.order_code,
      room: room?.room_number ?? null,
      guest: guest?.full_name ?? (room ? `Room ${room.room_number}` : "Walk-in"),
      total: order.total_amount,
      status: order.status,
      type: order.order_type,
      time: new Date(order.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
  });

  return NextResponse.json({
    items: formattedItems,
    orders: formattedOrders,
    rooms: checkedInRooms || [],
  });
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const body = await request.json();

  const { items, order_type, room_number, notes } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Order must have at least one item" }, { status: 400 });
  }

  // Calculate totals
  const subtotal = items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
  const taxAmount = Math.round(subtotal * 0.05);
  const totalAmount = subtotal + taxAmount;

  // Generate order code
  const { count } = await supabase
    .from("hotel_management_fnb_orders")
    .select("id", { count: "exact", head: true });

  const orderNum = (count ?? 0) + 1;
  const orderCode = `ORD-${new Date().getFullYear()}-${String(orderNum).padStart(4, "0")}`;

  // Get room_id and guest_id if room service
  let roomId: string | null = null;
  let guestId: string | null = null;

  if (order_type === "room_service" && room_number) {
    const { data: room } = await supabase
      .from("hotel_management_rooms")
      .select("id")
      .eq("room_number", room_number)
      .single();

    if (room) {
      roomId = room.id;

      // Find active reservation for this room to get guest
      const { data: reservation } = await supabase
        .from("hotel_management_reservations")
        .select("guest_id")
        .eq("room_id", room.id)
        .eq("status", "checked_in")
        .maybeSingle();

      if (reservation) {
        guestId = reservation.guest_id;
      }
    }
  }

  // Create the order
  const { data: newOrder, error: orderErr } = await supabase
    .from("hotel_management_fnb_orders")
    .insert({
      order_code: orderCode,
      room_id: roomId,
      guest_id: guestId,
      order_type,
      status: "pending",
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      posted_to_room: order_type === "room_service",
      notes: notes || null,
    })
    .select("id, order_code")
    .single();

  if (orderErr) {
    return NextResponse.json({ error: orderErr.message }, { status: 500 });
  }

  // Insert order items
  const orderItems = items.map((item: any) => ({
    order_id: newOrder.id,
    item_id: item.id,
    item_name: item.name,
    quantity: item.quantity,
    unit_price: item.price,
    total_price: item.price * item.quantity,
  }));

  const { error: itemsErr } = await supabase
    .from("hotel_management_fnb_order_items")
    .insert(orderItems);

  if (itemsErr) {
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    order_code: newOrder.order_code,
    total: totalAmount,
  }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const body = await request.json();
  const { order_code, status } = body;

  if (!order_code || !status) {
    return NextResponse.json({ error: "order_code and status are required" }, { status: 400 });
  }

  const validStatuses = ["pending", "preparing", "served", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { error } = await supabase
    .from("hotel_management_fnb_orders")
    .update({ status })
    .eq("order_code", order_code);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
