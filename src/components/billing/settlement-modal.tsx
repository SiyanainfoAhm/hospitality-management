"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { formatCurrency } from "@/lib/utils";
import { Loader2, LogOut } from "lucide-react";

export interface SettlementData {
  invoice_id: string;
  invoice_number: string;
  line_items: { description: string; category: string; total_price: number }[];
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

const PAYMENT_MODES = [
  { label: "Cash", value: "cash" },
  { label: "UPI", value: "upi" },
  { label: "Card", value: "card" },
  { label: "Bank Transfer", value: "bank_transfer" },
  { label: "Bill to Company", value: "bill_to_company" },
];

interface SettlementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guestName: string;
  bookingCode: string;
  reservationId: string;
  onConfirm: (payload: {
    amount_received: number;
    payment_mode: string;
    reference_number: string;
    remarks: string;
  }) => Promise<void>;
}

export function SettlementModal({
  open,
  onOpenChange,
  guestName,
  bookingCode,
  reservationId,
  onConfirm,
}: SettlementModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [settlement, setSettlement] = useState<SettlementData | null>(null);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [amountReceived, setAmountReceived] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (!open || !reservationId) return;

    setLoading(true);
    setSettlement(null);
    fetch(`/api/checkin/settlement?reservation_id=${reservationId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.settlement) {
          setSettlement(data.settlement);
          setAmountReceived(String(data.settlement.balance_payable));
        }
      })
      .finally(() => setLoading(false));
  }, [open, reservationId]);

  useEffect(() => {
    if (paymentMode === "bill_to_company" && settlement) {
      setAmountReceived("0");
    }
  }, [paymentMode, settlement]);

  const handleSubmit = async () => {
    if (!settlement) return;
    setSubmitting(true);
    try {
      await onConfirm({
        amount_received: Number(amountReceived) || 0,
        payment_mode: paymentMode,
        reference_number: referenceNumber,
        remarks: remarks,
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Checkout Settlement</DialogTitle>
          <p className="text-sm text-gray-500">
            {guestName} · {bookingCode}
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : settlement ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-3 text-sm space-y-1">
              {settlement.room_charge > 0 && (
                <div className="flex justify-between">
                  <span>Room Charges</span>
                  <span>{formatCurrency(settlement.room_charge)}</span>
                </div>
              )}
              {settlement.fnb_charge > 0 && (
                <div className="flex justify-between">
                  <span>F&B Posted</span>
                  <span>{formatCurrency(settlement.fnb_charge)}</span>
                </div>
              )}
              {settlement.extra_bed_charge > 0 && (
                <div className="flex justify-between">
                  <span>Extra Bed</span>
                  <span>{formatCurrency(settlement.extra_bed_charge)}</span>
                </div>
              )}
              {settlement.addon_charge > 0 && (
                <div className="flex justify-between">
                  <span>Add-ons</span>
                  <span>{formatCurrency(settlement.addon_charge)}</span>
                </div>
              )}
              {settlement.late_checkout_charge > 0 && (
                <div className="flex justify-between">
                  <span>Late Checkout</span>
                  <span>{formatCurrency(settlement.late_checkout_charge)}</span>
                </div>
              )}
              {settlement.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(settlement.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST (18%)</span>
                <span>{formatCurrency(settlement.tax)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total Amount</span>
                <span>{formatCurrency(settlement.total_amount)}</span>
              </div>
              <div className="flex justify-between text-blue-600">
                <span>Deposit Received</span>
                <span>-{formatCurrency(settlement.deposit_applied || settlement.deposit_received)}</span>
              </div>
              {settlement.amount_paid > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Already Paid</span>
                  <span>-{formatCurrency(settlement.amount_paid)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t pt-2">
                <span>Balance Payable</span>
                <span>{formatCurrency(settlement.balance_payable)}</span>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Invoice: {settlement.invoice_number}
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Payment Mode
                </label>
                <SearchableSelect
                  options={PAYMENT_MODES}
                  value={paymentMode}
                  onChange={setPaymentMode}
                  placeholder="Select mode"
                  searchPlaceholder="Search..."
                  emptyText="No mode found"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Amount Received
                </label>
                <Input
                  type="number"
                  min={0}
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Reference Number
                </label>
                <Input
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Txn ID / Cheque no."
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Remarks
                </label>
                <Input
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Optional notes"
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-6">
            Unable to load settlement details
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="gold"
            onClick={handleSubmit}
            disabled={loading || !settlement || submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4 mr-2" />
            )}
            Complete Checkout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
