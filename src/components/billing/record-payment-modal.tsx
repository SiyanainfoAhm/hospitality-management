"use client";

import { useState } from "react";
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
import { IndianRupee, Loader2 } from "lucide-react";

const PAYMENT_MODES = [
  { label: "Cash", value: "cash" },
  { label: "UPI", value: "upi" },
  { label: "Card", value: "card" },
  { label: "Bank Transfer", value: "bank_transfer" },
  { label: "Bill to Company", value: "bill_to_company" },
];

interface RecordPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: string;
    number: string;
    guest: string;
    balance: number;
  } | null;
  onSuccess: () => void;
}

export function RecordPaymentModal({
  open,
  onOpenChange,
  invoice,
  onSuccess,
}: RecordPaymentModalProps) {
  const [paymentMode, setPaymentMode] = useState("cash");
  const [amount, setAmount] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setPaymentMode("cash");
    setAmount("");
    setReferenceNumber("");
    setRemarks("");
    setError("");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    if (next && invoice) {
      setAmount(String(invoice.balance));
    }
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    if (!invoice) return;
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Enter a valid amount");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/billing/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_id: invoice.id,
          amount: parsedAmount,
          payment_mode: paymentMode,
          reference_number: referenceNumber || null,
          remarks: remarks || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Payment failed");
        return;
      }
      onSuccess();
      handleOpenChange(false);
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          {invoice && (
            <p className="text-sm text-gray-500">
              {invoice.number} · {invoice.guest} · Balance{" "}
              {formatCurrency(invoice.balance)}
            </p>
          )}
        </DialogHeader>

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
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
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
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !invoice}>
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <IndianRupee className="h-4 w-4 mr-2" />
            )}
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
