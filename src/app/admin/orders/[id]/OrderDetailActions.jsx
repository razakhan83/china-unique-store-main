'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Save, Loader2, Truck } from 'lucide-react';

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

const ORDER_STATUSES = [
  'Pending',
  'Confirmed',
  'In Process',
  'Delivered',
  'Delivery Address Issue',
  'Returned',
];

export default function OrderDetailActions({ order }) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [courierName, setCourierName] = useState(order.courierName || '');
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [weight, setWeight] = useState(order.weight ?? 2);
  const [manualCodAmount, setManualCodAmount] = useState(order.manualCodAmount ?? '');
  const [saving, setSaving] = useState(false);

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

  const isChanged = 
    status !== order.status || 
    courierName !== (order.courierName || '') || 
    trackingNumber !== (order.trackingNumber || '') ||
    Number(weight) !== (order.weight ?? 2) ||
    manualCodAmount !== (order.manualCodAmount ?? '');

  return (
    <section className="surface-card rounded-xl p-5 shadow-sm border border-border">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border/50">
          <Truck className="size-5 text-foreground" />
        <h2 className="font-semibold text-foreground">Order Fulfillment</h2>
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
            placeholder="e.g. Leopard, TCS, Trax"
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
          className="w-full mt-4" 
          onClick={handleSave} 
          disabled={saving || !isChanged}
        >
          {saving ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Save className="mr-2 size-4" />
          )}
          Save Updates
        </Button>
      </div>
    </section>
  );
}
