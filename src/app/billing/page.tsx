"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Receipt,
  Search,
  Download,
  Printer,
  Eye,
  IndianRupee,
  CreditCard,
  Building2,
  Loader2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { downloadCSV, downloadPDF, printInvoice, generateInvoiceHTML } from "@/lib/export";
import toast from "react-hot-toast";

interface Invoice {
  id: string;
  number: string;
  guest: string;
  guest_email: string;
  room: string;
  date: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  balance: number;
  status: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  category: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const invoiceStatusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  issued: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  partially_paid: "bg-amber-100 text-amber-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const fetchBilling = (params?: { search?: string; status?: string }) => {
    const qp = new URLSearchParams();
    const s = params?.search ?? search;
    const st = params?.status ?? filterStatus;

    if (s) qp.set("search", s);
    if (st !== "All") qp.set("status", st);

    const url = `/api/billing${qp.toString() ? `?${qp.toString()}` : ""}`;
    setLoading(true);
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.invoices) setInvoices(data.invoices);
      })
      .catch(() => toast.error("Failed to load billing data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBilling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchBilling();
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterStatus]);

  const openInvoice = async (inv: Invoice) => {
    setSelectedInvoice(inv);
    setInvoiceItems([]);
    setLoadingItems(true);

    try {
      const res = await fetch(`/api/billing/items?invoice_id=${inv.id}`);
      const data = await res.json();
      if (data.items) setInvoiceItems(data.items);
    } catch {
      toast.error("Failed to load invoice details");
    } finally {
      setLoadingItems(false);
    }
  };

  const filtered = invoices;

  const totalRevenue = invoices.reduce((sum, i) => sum + i.paid, 0);
  const totalPending = invoices.reduce((sum, i) => sum + i.balance, 0);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Billing & Invoicing</h1>
            <p className="text-sm text-gray-500">Manage invoices and payments</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <IndianRupee className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Collected</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                <CreditCard className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Pending Amount</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totalPending)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Invoices</p>
                <p className="text-xl font-bold text-gray-900">{invoices.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input placeholder="Search invoices..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="All">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="issued">Issued</option>
                <option value="paid">Paid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Table */}
        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="p-8 text-center">
                <Receipt className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No invoices found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv) => (
                    <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-sm font-mono font-medium text-[#1E2A44]">{inv.number}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{inv.guest}</p>
                        <p className="text-xs text-gray-500">Room {inv.room}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(inv.date)}</td>
                      <td className="px-4 py-3 text-sm font-medium">{formatCurrency(inv.total)}</td>
                      <td className="px-4 py-3 text-sm text-green-600 font-medium">{formatCurrency(inv.paid)}</td>
                      <td className="px-4 py-3 text-sm text-red-600 font-medium">{inv.balance > 0 ? formatCurrency(inv.balance) : "—"}</td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize", invoiceStatusColors[inv.status] || invoiceStatusColors.draft)}>
                          {inv.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openInvoice(inv)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                            downloadCSV(`Invoice_${inv.number}`, [
                              "Invoice #", "Guest", "Room", "Date", "Subtotal", "Discount", "Tax", "Total", "Paid", "Balance", "Status"
                            ], [[
                              inv.number, inv.guest, inv.room, inv.date,
                              String(inv.subtotal), String(inv.discount), String(inv.tax),
                              String(inv.total), String(inv.paid), String(inv.balance), inv.status,
                            ]]);
                            toast.success("CSV downloaded");
                          }}>
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={async () => {
                            try {
                              const res = await fetch(`/api/billing/items?invoice_id=${inv.id}`);
                              const data = await res.json();
                              const html = generateInvoiceHTML(inv, data.items || []);
                              printInvoice(html);
                            } catch {
                              toast.error("Failed to print");
                            }
                          }}>
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Invoice Detail Dialog */}
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Invoice {selectedInvoice?.number}</DialogTitle>
            </DialogHeader>
            {selectedInvoice && (
              <div className="space-y-4">
                <div className="flex justify-between items-start border-b pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-5 w-5 text-[#D4A017]" />
                      <span className="font-bold text-[#1E2A44]">IIM Nagpur Guest House</span>
                    </div>
                    <p className="text-xs text-gray-500">GSTIN: 27AAACI1234F1Z5</p>
                    <p className="text-xs text-gray-500">IIM Nagpur, MIHAN, Nagpur - 441108</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{selectedInvoice.number}</p>
                    <p className="text-xs text-gray-500">Date: {formatDate(selectedInvoice.date)}</p>
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize mt-1", invoiceStatusColors[selectedInvoice.status])}>
                      {selectedInvoice.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium">{selectedInvoice.guest}</p>
                  <p className="text-xs text-gray-500">Room {selectedInvoice.room}</p>
                  {selectedInvoice.guest_email && <p className="text-xs text-gray-500">{selectedInvoice.guest_email}</p>}
                </div>

                {loadingItems ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : invoiceItems.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left text-xs text-gray-500">Description</th>
                        <th className="py-2 text-center text-xs text-gray-500">Qty</th>
                        <th className="py-2 text-right text-xs text-gray-500">Rate</th>
                        <th className="py-2 text-right text-xs text-gray-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceItems.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="py-2">{item.description}</td>
                          <td className="py-2 text-center">{item.quantity}</td>
                          <td className="py-2 text-right">{formatCurrency(item.unit_price)}</td>
                          <td className="py-2 text-right font-medium">{formatCurrency(item.total_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">No line items available</p>
                )}

                <div className="border-t pt-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(selectedInvoice.subtotal)}</span></div>
                  {selectedInvoice.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(selectedInvoice.discount)}</span></div>}
                  <div className="flex justify-between"><span>GST (18%)</span><span>{formatCurrency(selectedInvoice.tax)}</span></div>
                  <div className="flex justify-between font-bold text-base border-t pt-2"><span>Grand Total</span><span>{formatCurrency(selectedInvoice.total)}</span></div>
                  <div className="flex justify-between text-green-600"><span>Paid</span><span>{formatCurrency(selectedInvoice.paid)}</span></div>
                  {selectedInvoice.balance > 0 && <div className="flex justify-between text-red-600 font-medium"><span>Balance Due</span><span>{formatCurrency(selectedInvoice.balance)}</span></div>}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => {
                    if (!selectedInvoice) return;
                    const html = generateInvoiceHTML(selectedInvoice, invoiceItems);
                    printInvoice(html);
                  }}>
                    <Printer className="h-4 w-4 mr-2" /> Print
                  </Button>
                  <Button onClick={() => {
                    if (!selectedInvoice) return;
                    downloadPDF(selectedInvoice, invoiceItems);
                  }}>
                    <Download className="h-4 w-4 mr-2" /> Download PDF
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
