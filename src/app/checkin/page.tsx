"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LogIn,
  LogOut,
  User,
  Phone,
  BedDouble,
  Clock,
  CheckCircle,
  FileText,
  Loader2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface ReservationItem {
  id: string;
  booking_code: string;
  guest_name: string;
  guest_mobile: string;
  guest_email: string;
  room_number: string;
  room_type: string;
  room_rate: number;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  adults: number;
  children: number;
  status: string;
  total_amount: number;
  deposit_amount: number;
  notes: string | null;
}

export default function CheckinPage() {
  const [arrivals, setArrivals] = useState<ReservationItem[]>([]);
  const [departures, setDepartures] = useState<ReservationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/checkin")
      .then((res) => res.json())
      .then((data) => {
        if (data.arrivals) setArrivals(data.arrivals);
        if (data.departures) setDepartures(data.departures);
      })
      .catch(() => toast.error("Failed to load check-in data"))
      .finally(() => setLoading(false));
  }, []);

  const handleCheckIn = async (reservation: ReservationItem) => {
    setProcessingIds((prev) => [...prev, reservation.id]);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservation_id: reservation.id, action: "checkin" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Check-in failed");
        return;
      }
      setCompletedIds((prev) => [...prev, reservation.id]);
      toast.success(`${reservation.guest_name} checked in successfully!`);
    } catch {
      toast.error("Network error");
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== reservation.id));
    }
  };

  const handleCheckOut = async (reservation: ReservationItem) => {
    setProcessingIds((prev) => [...prev, reservation.id]);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservation_id: reservation.id, action: "checkout" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Check-out failed");
        return;
      }
      setCompletedIds((prev) => [...prev, reservation.id]);
      toast.success(`${reservation.guest_name} checked out. Room marked for cleaning.`);
    } catch {
      toast.error("Network error");
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== reservation.id));
    }
  };

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Check-in / Check-out</h1>
          <p className="text-sm text-gray-500">Manage today&apos;s arrivals and departures</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50">
                <LogIn className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{arrivals.length}</p>
                <p className="text-sm text-gray-500">Expected Arrivals Today</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-50">
                <LogOut className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{departures.length}</p>
                <p className="text-sm text-gray-500">In-house / Pending Departure</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="arrivals">
          <TabsList>
            <TabsTrigger value="arrivals">
              <LogIn className="h-4 w-4 mr-2" /> Arrivals ({arrivals.length})
            </TabsTrigger>
            <TabsTrigger value="departures">
              <LogOut className="h-4 w-4 mr-2" /> Departures ({departures.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="arrivals" className="space-y-3 mt-4">
            {arrivals.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <LogIn className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">No arrivals expected today</p>
                </CardContent>
              </Card>
            ) : (
              arrivals.map((arrival) => (
                <Card key={arrival.id} className={completedIds.includes(arrival.id) ? "opacity-50" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1E2A44] text-white">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900">{arrival.guest_name}</h3>
                            <Badge variant="secondary" className="text-[10px]">{arrival.booking_code}</Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{arrival.guest_mobile}</span>
                            <span className="flex items-center gap-1"><BedDouble className="h-3 w-3" />Room {arrival.room_number} ({arrival.room_type})</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{arrival.nights} night{arrival.nights > 1 ? "s" : ""}</span>
                          </div>
                          {arrival.notes && <p className="text-[11px] text-gray-400 mt-1">{arrival.notes}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-semibold">{formatCurrency(arrival.total_amount)}</p>
                          <p className="text-xs text-gray-500">Deposit: {formatCurrency(arrival.deposit_amount)}</p>
                        </div>
                        {completedIds.includes(arrival.id) ? (
                          <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Checked In</Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleCheckIn(arrival)}
                            disabled={processingIds.includes(arrival.id)}
                          >
                            {processingIds.includes(arrival.id) ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <LogIn className="h-4 w-4 mr-1" />
                            )}
                            Check In
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="departures" className="space-y-3 mt-4">
            {departures.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <LogOut className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">No guests currently in-house for departure</p>
                </CardContent>
              </Card>
            ) : (
              departures.map((dep) => {
                const tax = Math.round(dep.total_amount * 0.18);
                const grandTotal = dep.total_amount + tax;
                const balance = grandTotal - dep.deposit_amount;
                return (
                  <Card key={dep.id} className={completedIds.includes(dep.id) ? "opacity-50" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold text-gray-900">{dep.guest_name}</h3>
                              <Badge variant="secondary" className="text-[10px]">{dep.booking_code}</Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              <span>Room {dep.room_number} ({dep.room_type})</span>
                              <span>Since {formatDate(dep.check_in_date)}</span>
                              <span>{dep.nights} nights</span>
                              <span>Due: {formatDate(dep.check_out_date)}</span>
                            </div>
                            {dep.notes && <p className="text-[11px] text-gray-400 mt-1">{dep.notes}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right text-xs space-y-0.5">
                            <p>Room Charges: {formatCurrency(dep.total_amount)}</p>
                            <p>GST (18%): {formatCurrency(tax)}</p>
                            <p>Deposit: -{formatCurrency(dep.deposit_amount)}</p>
                            <p className="font-semibold text-sm text-gray-900 pt-1 border-t">Balance: {formatCurrency(balance)}</p>
                          </div>
                          {completedIds.includes(dep.id) ? (
                            <Badge variant="secondary"><CheckCircle className="h-3 w-3 mr-1" />Checked Out</Badge>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <Button
                                size="sm"
                                variant="gold"
                                onClick={() => handleCheckOut(dep)}
                                disabled={processingIds.includes(dep.id)}
                              >
                                {processingIds.includes(dep.id) ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <LogOut className="h-4 w-4 mr-1" />
                                )}
                                Check Out
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
