'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Save, Loader2, Truck, ExternalLink, FileText, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import NocTrackingModal from '@/components/NocTrackingModal';
import { ORDER_STATUSES } from '@/lib/order-status';
import { NOC_PORTALS } from '@/lib/nocCourier';

export default function OrderDetailActions({ order }) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [courierName, setCourierName] = useState(order.courierName || '');
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [weight, setWeight] = useState(order.weight ?? 2);
  const [manualCodAmount, setManualCodAmount] = useState(order.manualCodAmount ?? '');
  const [saving, setSaving] = useState(false);

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState('portal_1');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${order._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          courierName,
          trackingNumber,
          weight: Number(weight),
          manualCodAmount: manualCodAmount === '' ? null : Number(manualCodAmount),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Order updated successfully');
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to update order');
      }
    } catch (error) {
      toast.error('An error occurred while updating the order');
    } finally {
      setSaving(false);
    }
  };

  const handleBookNoc = async () => {
    setBookingLoading(true);
    try {
      const res = await fetch('/api/admin/courier/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: [order._id || order.orderId],
          portalKey: selectedPortal,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Parcel booked successfully with NOC Express!');
        setBookingModalOpen(false);
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to book with NOC Courier.');
      }
    } catch (err) {
      console.error('Book NOC error:', err);
      toast.error('Connection error booking NOC parcel');
    } finally {
      setBookingLoading(false);
    }
  };

  const isChanged = 
    status !== order.status || 
    courierName !== (order.courierName || '') || 
    trackingNumber !== (order.trackingNumber || '') ||
    Number(weight) !== (order.weight ?? 2) ||
    manualCodAmount !== (order.manualCodAmount ?? '');

  return (
    <>
      <section className="surface-card rounded-xl p-5 shadow-sm border border-border">
        <div className="flex items-center justify-between gap-2 mb-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Truck className="size-5 text-foreground" />
            <h2 className="font-semibold text-foreground">Order Fulfillment</h2>
          </div>
          {order.trackingNumber && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowTrackingModal(true)}
              className="h-8 text-xs font-semibold border-sky-300 text-sky-700 bg-sky-50/50 hover:bg-sky-100"
            >
              <Truck className="size-3.5 mr-1 text-sky-600" />
              Track Order
            </Button>
          )}
        </div>

        {/* NOC Express Action Bar */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 border border-sky-200 dark:border-slate-700 mb-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-900 dark:text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="size-4 text-sky-600" />
              NOC Express Integration
            </span>
            {order.courierBookingStatus === 'booked' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Booked
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            {(order.status !== 'Shipped' && order.status !== 'Delivered' && order.status !== 'Cancelled' && order.status !== 'Returned') && (
              <Button
                size="sm"
                onClick={() => setBookingModalOpen(true)}
                className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs h-9 flex-1 shadow-sm"
              >
                <Send className="size-3.5 mr-1.5" />
                Book with NOC Express
              </Button>
            )}

            {order.nocLabelUrl && (
              <a
                href={order.nocLabelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors flex-1 justify-center"
              >
                <FileText className="size-3.5" />
                Print Airway Slip
              </a>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Order Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status" className="bg-background">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="courier" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Courier Name</Label>
            <Input
              id="courier"
              placeholder="e.g. NOC Express, Leopard, TCS"
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tracking" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tracking Number</Label>
            <Input
              id="tracking"
              placeholder="Enter tracking ID"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                min="0"
                step="0.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manualCodAmount" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">COD Amount</Label>
              <Input
                id="manualCodAmount"
                type="number"
                min="0"
                placeholder="Leave blank for default"
                value={manualCodAmount}
                onChange={(e) => setManualCodAmount(e.target.value)}
                className="bg-background"
              />
            </div>
          </div>

          <Button 
            size="sm"
            className="admin-cta-button mt-4 w-full" 
            onClick={handleSave} 
            disabled={saving || !isChanged}
          >
            {saving ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <Save data-icon="inline-start" />
            )}
            Save Updates
          </Button>
        </div>
      </section>

      {/* Book NOC Account Selection Dialog */}
      <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
        <DialogContent className="max-w-md bg-white text-gray-900 rounded-2xl p-6 shadow-xl border border-gray-200">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <Truck className="size-5 text-sky-600" />
              Book Order with NOC Express
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Select NOC account for Order #{order.orderId}:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">
                NOC Account
              </Label>
              <Select value={selectedPortal} onValueChange={setSelectedPortal}>
                <SelectTrigger className="w-full h-11 text-sm font-semibold bg-white text-gray-900 border-gray-300 rounded-xl">
                  <SelectValue placeholder="Select portal" />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-900 border-gray-200 rounded-xl">
                  {NOC_PORTALS.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="font-medium text-gray-900">
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Simple White Light Summary Box */}
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-1.5">
              <div className="flex justify-between font-semibold">
                <span className="text-gray-500">Consignee:</span>
                <span className="text-gray-900">{order.customerName}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-gray-500">City:</span>
                <span className="text-sky-700">{order.customerCity || 'Karachi'}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-gray-500">COD:</span>
                <span className="text-emerald-700">PKR {Number(order.manualCodAmount != null ? order.manualCodAmount : order.totalAmount).toLocaleString('en-PK')}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setBookingModalOpen(false)} className="rounded-xl h-10 px-4 text-gray-700 hover:bg-gray-100 border-gray-300">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleBookNoc}
              disabled={bookingLoading}
              className="bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl h-10 px-5 shadow-sm"
            >
              {bookingLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Send className="size-4 mr-2" />}
              Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shared Live Tracking Modal */}
      <NocTrackingModal
        open={showTrackingModal}
        onOpenChange={setShowTrackingModal}
        trackingNumber={order.trackingNumber}
        orderId={order.orderId}
        courierName={order.courierName || 'NOC Express'}
        nocLabelUrl={order.nocLabelUrl}
      />
    </>
  );
}

