import type { SupabaseClient } from "@supabase/supabase-js";
import { generateInvoiceNumber } from "@/lib/utils";

const GST_RATE = 0.18;
const LATE_CHECKOUT_FEE = 500;

export type PaymentMode =
  | "cash"
  | "upi"
  | "card"
  | "bank_transfer"
  | "bill_to_company";

export interface SettlementLineItem {
  description: string;
  category: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface SettlementPreview {
  invoice_id: string;
  invoice_number: string;
  line_items: SettlementLineItem[];
  room_charge: number;
  fnb_charge: number;
  extra_bed_charge: number;
  addon_charge: number;
  late_checkout_charge: number;
  discount: number;
  subtotal: number;
  tax: number;
  total_amount: number;
  deposit_received: number;
  deposit_applied: number;
  amount_paid: number;
  balance_payable: number;
}

interface ReservationRow {
  id: string;
  guest_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  total_amount: number;
  deposit_amount: number;
  adults: number;
  children: number;
  hotel_management_rooms?: {
    room_number?: string;
    hotel_management_room_types?: { name?: string; base_rate?: number };
  };
  hotel_management_rate_plans?: { rate?: number };
}

function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.max(
    1,
    Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000
    )
  );
}

function roundInr(value: number): number {
  return Math.round(value);
}

export async function ensureCheckoutInvoice(
  supabase: SupabaseClient,
  reservationId: string
): Promise<{ invoiceId: string; invoiceNumber: string; error?: string }> {
  const { data: reservation, error: resErr } = await supabase
    .from("hotel_management_reservations")
    .select(`
      id,
      guest_id,
      room_id,
      check_in_date,
      check_out_date,
      total_amount,
      deposit_amount,
      adults,
      children,
      hotel_management_rooms!room_id (
        room_number,
        hotel_management_room_types ( name, base_rate )
      ),
      hotel_management_rate_plans!rate_plan_id ( rate )
    `)
    .eq("id", reservationId)
    .single();

  if (resErr || !reservation) {
    return { invoiceId: "", invoiceNumber: "", error: "Reservation not found" };
  }

  const res = reservation as unknown as ReservationRow;
  const room = res.hotel_management_rooms;
  const roomType = room?.hotel_management_room_types;
  const nights = nightsBetween(res.check_in_date, res.check_out_date);
  const roomRate =
    res.hotel_management_rate_plans?.rate ??
    roomType?.base_rate ??
    Math.round(res.total_amount / nights);

  const { data: existingInvoices } = await supabase
    .from("hotel_management_invoices")
    .select("id, invoice_number, status, paid_amount")
    .eq("reservation_id", reservationId)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(1);

  let invoiceId = existingInvoices?.[0]?.id;
  let invoiceNumber = existingInvoices?.[0]?.invoice_number ?? generateInvoiceNumber();
  const existingStatus = existingInvoices?.[0]?.status;

  if (!invoiceId) {
    const { data: created, error: createErr } = await supabase
      .from("hotel_management_invoices")
      .insert({
        invoice_number: invoiceNumber,
        reservation_id: reservationId,
        guest_id: res.guest_id,
        status: "draft",
      })
      .select("id, invoice_number")
      .single();

    if (createErr || !created) {
      return { invoiceId: "", invoiceNumber: "", error: createErr?.message ?? "Failed to create invoice" };
    }
    invoiceId = created.id;
    invoiceNumber = created.invoice_number;
  } else if (existingStatus === "paid") {
    return { invoiceId, invoiceNumber };
  }

  const lineItems: SettlementLineItem[] = [];

  lineItems.push({
    description: `Room Tariff - ${roomType?.name ?? "Room"} (${nights} night${nights > 1 ? "s" : ""})`,
    category: "room_tariff",
    quantity: nights,
    unit_price: roomRate,
    total_price: roundInr(roomRate * nights),
  });

  const { data: fnbOrders } = await supabase
    .from("hotel_management_fnb_orders")
    .select("id, order_code, total_amount, subtotal, tax_amount, notes")
    .eq("room_id", res.room_id)
    .eq("posted_to_room", true)
    .in("status", ["completed", "served", "ready", "delivered"]);

  let fnbTotal = 0;
  for (const order of fnbOrders ?? []) {
    fnbTotal += Number(order.total_amount ?? 0);
    lineItems.push({
      description: `F&B - ${order.order_code}${order.notes ? ` (${order.notes})` : ""}`,
      category: "fnb",
      quantity: 1,
      unit_price: Number(order.total_amount ?? 0),
      total_price: Number(order.total_amount ?? 0),
    });
  }

  const { data: existingItems } = await supabase
    .from("hotel_management_invoice_items")
    .select("description, category, quantity, unit_price, total_price")
    .eq("invoice_id", invoiceId);

  for (const item of existingItems ?? []) {
    if (
      item.category === "extra_bed" ||
      item.category === "addon" ||
      item.category === "late_checkout" ||
      item.category === "discount"
    ) {
      const exists = lineItems.some(
        (l) => l.description === item.description && l.category === item.category
      );
      if (!exists) {
        lineItems.push({
          description: item.description,
          category: item.category,
          quantity: item.quantity,
          unit_price: Number(item.unit_price),
          total_price: Number(item.total_price),
        });
      }
    }
  }

  const today = new Date().toISOString().split("T")[0];
  if (today > res.check_out_date) {
    const hasLate = lineItems.some((l) => l.category === "late_checkout");
    if (!hasLate) {
      lineItems.push({
        description: "Late Checkout Charge",
        category: "late_checkout",
        quantity: 1,
        unit_price: LATE_CHECKOUT_FEE,
        total_price: LATE_CHECKOUT_FEE,
      });
    }
  }

  const discount = lineItems
    .filter((l) => l.category === "discount")
    .reduce((s, l) => s + Math.abs(l.total_price), 0);

  const chargeSubtotal = lineItems
    .filter((l) => l.category !== "discount" && l.category !== "tax")
    .reduce((s, l) => s + l.total_price, 0);

  const taxable = Math.max(chargeSubtotal - discount, 0);
  const tax = roundInr(taxable * GST_RATE);
  const totalAmount = taxable + tax;

  await supabase
    .from("hotel_management_invoice_items")
    .delete()
    .eq("invoice_id", invoiceId);

  if (lineItems.length > 0) {
    await supabase.from("hotel_management_invoice_items").insert(
      lineItems.map((item) => ({
        invoice_id: invoiceId,
        description: item.description,
        category: item.category,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }))
    );
  }

  const { data: payments } = await supabase
    .from("hotel_management_payments")
    .select("amount")
    .eq("invoice_id", invoiceId);

  const paidAmount = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const balanceAmount = Math.max(totalAmount - paidAmount, 0);
  let status = "issued";
  if (balanceAmount <= 0) status = "paid";
  else if (paidAmount > 0) status = "partially_paid";
  else if (existingStatus === "draft") status = "issued";

  await supabase
    .from("hotel_management_invoices")
    .update({
      subtotal: chargeSubtotal,
      discount_amount: discount,
      tax_amount: tax,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      balance_amount: balanceAmount,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);

  return { invoiceId, invoiceNumber };
}

export async function getSettlementPreview(
  supabase: SupabaseClient,
  reservationId: string
): Promise<{ settlement?: SettlementPreview; error?: string }> {
  const ensured = await ensureCheckoutInvoice(supabase, reservationId);
  if (ensured.error) return { error: ensured.error };

  const { data: reservation } = await supabase
    .from("hotel_management_reservations")
    .select("deposit_amount")
    .eq("id", reservationId)
    .single();

  const { data: invoice } = await supabase
    .from("hotel_management_invoices")
    .select("id, invoice_number, subtotal, discount_amount, tax_amount, total_amount, paid_amount, balance_amount")
    .eq("id", ensured.invoiceId)
    .single();

  if (!invoice) return { error: "Invoice not found" };

  const { data: items } = await supabase
    .from("hotel_management_invoice_items")
    .select("description, category, quantity, unit_price, total_price")
    .eq("invoice_id", ensured.invoiceId);

  const lineItems = (items ?? []) as SettlementLineItem[];

  const sumCategory = (cat: string) =>
    lineItems.filter((l) => l.category === cat).reduce((s, l) => s + l.total_price, 0);

  const depositReceived = Number(reservation?.deposit_amount ?? 0);
  const amountPaid = Number(invoice.paid_amount ?? 0);

  const { data: depositPayments } = await supabase
    .from("hotel_management_payments")
    .select("amount, notes")
    .eq("invoice_id", ensured.invoiceId);

  const depositInPayments = (depositPayments ?? [])
    .filter((p) => (p.notes ?? "").toLowerCase().includes("deposit"))
    .reduce((s, p) => s + Number(p.amount), 0);

  const depositApplied = Math.min(
    depositReceived,
    Math.max(depositReceived - depositInPayments, 0)
  );

  const totalAmount = Number(invoice.total_amount);
  const balancePayable = Math.max(totalAmount - amountPaid - depositApplied, 0);

  return {
    settlement: {
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      line_items: lineItems,
      room_charge: sumCategory("room_tariff"),
      fnb_charge: sumCategory("fnb"),
      extra_bed_charge: sumCategory("extra_bed"),
      addon_charge: sumCategory("addon"),
      late_checkout_charge: sumCategory("late_checkout"),
      discount: Number(invoice.discount_amount ?? 0),
      subtotal: Number(invoice.subtotal),
      tax: Number(invoice.tax_amount),
      total_amount: totalAmount,
      deposit_received: depositReceived,
      deposit_applied: depositApplied,
      amount_paid: amountPaid,
      balance_payable: balancePayable,
    },
  };
}

export async function recordInvoicePayment(
  supabase: SupabaseClient,
  params: {
    invoiceId: string;
    amount: number;
    paymentMode: PaymentMode;
    referenceNumber?: string | null;
    remarks?: string | null;
  }
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  const { invoiceId, amount, paymentMode, referenceNumber, remarks } = params;

  if (amount <= 0) {
    return { success: false, error: "Amount must be greater than zero" };
  }

  const { data: rpcData, error: rpcErr } = await supabase.rpc("record_invoice_payment", {
    p_invoice_id: invoiceId,
    p_amount: amount,
    p_payment_mode: paymentMode,
    p_reference_number: referenceNumber ?? null,
    p_remarks: remarks ?? null,
  });

  if (!rpcErr && rpcData) {
    return { success: true, data: rpcData as Record<string, unknown> };
  }

  const { data: invoice, error: invErr } = await supabase
    .from("hotel_management_invoices")
    .select("id, total_amount, status")
    .eq("id", invoiceId)
    .single();

  if (invErr || !invoice) {
    return { success: false, error: invErr?.message ?? "Invoice not found" };
  }

  if (invoice.status === "cancelled") {
    return { success: false, error: "Cannot record payment on cancelled invoice" };
  }

  const { error: payErr } = await supabase.from("hotel_management_payments").insert({
    invoice_id: invoiceId,
    amount,
    payment_mode: paymentMode,
    reference_number: referenceNumber ?? null,
    notes: remarks ?? null,
  });

  if (payErr) {
    return { success: false, error: payErr.message };
  }

  const { data: payments } = await supabase
    .from("hotel_management_payments")
    .select("amount")
    .eq("invoice_id", invoiceId);

  const paidAmount = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const totalAmount = Number(invoice.total_amount);
  const balanceAmount = Math.max(totalAmount - paidAmount, 0);
  let status = "issued";
  if (balanceAmount <= 0) status = "paid";
  else if (paidAmount > 0) status = "partially_paid";

  await supabase
    .from("hotel_management_invoices")
    .update({
      paid_amount: paidAmount,
      balance_amount: balanceAmount,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);

  return {
    success: true,
    data: {
      invoice_id: invoiceId,
      paid_amount: paidAmount,
      balance_amount: balanceAmount,
      status,
    },
  };
}

export async function applyDepositCreditIfNeeded(
  supabase: SupabaseClient,
  invoiceId: string,
  depositAmount: number
): Promise<number> {
  if (depositAmount <= 0) return 0;

  const { data: existing } = await supabase
    .from("hotel_management_payments")
    .select("id, notes")
    .eq("invoice_id", invoiceId);

  const hasDeposit = (existing ?? []).some((p) =>
    (p.notes ?? "").toLowerCase().includes("deposit")
  );
  if (hasDeposit) return 0;

  await supabase.from("hotel_management_payments").insert({
    invoice_id: invoiceId,
    amount: depositAmount,
    payment_mode: "cash",
    reference_number: null,
    notes: "Advance deposit received at booking/check-in",
  });

  return depositAmount;
}

export async function setInvoiceStatusAfterSettlement(
  supabase: SupabaseClient,
  invoiceId: string
): Promise<string> {
  const { data: invoice } = await supabase
    .from("hotel_management_invoices")
    .select("total_amount")
    .eq("id", invoiceId)
    .single();

  const { data: payments } = await supabase
    .from("hotel_management_payments")
    .select("amount")
    .eq("invoice_id", invoiceId);

  const paidAmount = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const totalAmount = Number(invoice?.total_amount ?? 0);
  const balanceAmount = Math.max(totalAmount - paidAmount, 0);

  let status = "issued";
  if (balanceAmount <= 0) status = "paid";
  else if (paidAmount > 0) status = "partially_paid";

  await supabase
    .from("hotel_management_invoices")
    .update({
      paid_amount: paidAmount,
      balance_amount: balanceAmount,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);

  return status;
}
