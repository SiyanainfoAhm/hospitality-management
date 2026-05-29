import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { requireSession, setDbRequestContext } from "@/lib/auth/permissions-server";
import { canRecordInvoicePayment, normalizeRole } from "@/config/rbac";
import {
  recordInvoicePayment,
  type PaymentMode,
  setInvoiceStatusAfterSettlement,
} from "@/lib/billing-server";

export async function POST(request: NextRequest) {
  const sessionOrDeny = await requireSession();
  if (sessionOrDeny instanceof NextResponse) return sessionOrDeny;

  const role = normalizeRole(sessionOrDeny.role);
  if (!canRecordInvoicePayment(role, "billing")) {
    return NextResponse.json(
      { error: "Forbidden", message: "You do not have permission to record invoice payments" },
      { status: 403 }
    );
  }

  await setDbRequestContext(sessionOrDeny.sub, sessionOrDeny.role);
  const supabase = createServerSupabaseClient();
  const body = await request.json();
  const {
    invoice_id,
    amount,
    payment_mode,
    reference_number,
    remarks,
  } = body as {
    invoice_id?: string;
    amount?: number;
    payment_mode?: PaymentMode;
    reference_number?: string;
    remarks?: string;
  };

  if (!invoice_id || amount == null || !payment_mode) {
    return NextResponse.json(
      { error: "invoice_id, amount, and payment_mode are required" },
      { status: 400 }
    );
  }

  const parsedAmount = Number(amount);
  if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
  }

  const validModes: PaymentMode[] = [
    "cash",
    "upi",
    "card",
    "bank_transfer",
    "bill_to_company",
  ];
  if (!validModes.includes(payment_mode)) {
    return NextResponse.json({ error: "Invalid payment mode" }, { status: 400 });
  }

  const { data: invoice } = await supabase
    .from("hotel_management_invoices")
    .select("id, status, balance_amount")
    .eq("id", invoice_id)
    .single();

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.status === "cancelled") {
    return NextResponse.json({ error: "Cannot record payment on cancelled invoice" }, { status: 400 });
  }

  const result = await recordInvoicePayment(supabase, {
    invoiceId: invoice_id,
    amount: parsedAmount,
    paymentMode: payment_mode,
    referenceNumber: reference_number ?? null,
    remarks: remarks ?? null,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "Payment failed" }, { status: 400 });
  }

  const status = await setInvoiceStatusAfterSettlement(supabase, invoice_id);

  return NextResponse.json({
    success: true,
    payment: result.data,
    status,
  });
}
