'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { Camera, Eye, MapPin, Package, Phone, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { normalizeOrderStatus } from '@/lib/order-status';

const formatPrice = (price) => `PKR ${Number(price || 0).toLocaleString('en-PK')}`;
const formatDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })
    : '—';

const STATUS_COLORS = {
  'Order Confirmed': 'bg-blue-100 text-blue-800 border-blue-200',
  'In Process': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Packed: 'bg-orange-100 text-orange-800 border-orange-200',
  Shipped: 'bg-purple-100 text-purple-800 border-purple-200',
  'Out For Delivery': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  Delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Returned: 'bg-rose-100 text-rose-800 border-rose-200',
  Draft: 'bg-slate-100 text-slate-700 border-slate-200',
};

function getStatusLabel(order) {
  return order?.isDraft ? 'Draft' : normalizeOrderStatus(order?.status);
}

function getTotalUnits(items) {
  return (Array.isArray(items) ? items : []).reduce(
    (sum, item) => sum + Number(item?.quantity || 0),
    0
  );
}

function getCodAmount(order) {
  if (order?.manualCodAmount != null && order.manualCodAmount !== '') {
    return Number(order.manualCodAmount);
  }
  return Number(order?.totalAmount || 0);
}

export default function OrderQuickViewDialog({
  order,
  triggerClassName,
  triggerVariant = 'secondary',
  triggerSize,
  triggerLabel = 'Quick View',
}) {
  const cardRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const items = Array.isArray(order?.items) ? order.items : [];
  const totalUnits = getTotalUnits(items);
  const statusLabel = getStatusLabel(order);
  const statusClass = STATUS_COLORS[statusLabel] || 'bg-muted text-muted-foreground border-border';
  const codAmount = getCodAmount(order);
  const itemsTotal = items.reduce(
    (sum, item) => sum + Number(item?.price || 0) * Number(item?.quantity || 1),
    0
  );

  const handleSaveAsImage = async () => {
    if (!cardRef.current) return;
    setIsSaving(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        style: {
          transform: 'none',
        },
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `order-${order?.orderId || 'detail'}.png`;
      link.click();
    } catch (err) {
      console.error('Failed to save image:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant={triggerVariant}
            size={triggerSize}
            className={cn('w-full sm:w-auto', triggerClassName)}
          />
        }
      >
        <Eye data-icon="inline-start" />
        {triggerLabel}
      </DialogTrigger>

      <DialogContent className="max-h-[92vh] w-[calc(100%-1rem)] max-w-xl overflow-hidden p-0 sm:max-w-2xl" showCloseButton>
        {/* Sticky header with actions */}
        <DialogHeader className="flex-row items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3 sm:px-5">
          <div>
            <DialogTitle className="text-sm font-bold text-foreground">
              {order?.orderId}
            </DialogTitle>
            <p className="text-[11px] text-muted-foreground">{formatDate(order?.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn('border text-[10px] font-semibold', statusClass)}>
              {statusLabel}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px]"
              disabled={isSaving}
              onClick={handleSaveAsImage}
            >
              {isSaving ? <Spinner className="mr-1 size-3" /> : <Camera className="mr-1 size-3" />}
              {isSaving ? 'Saving...' : 'Save Image'}
            </Button>
          </div>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="max-h-[calc(92vh-58px)] overflow-y-auto">
          {/* The ref'd card — this is what gets captured */}
          <div ref={cardRef} className="bg-white p-4 sm:p-5">
            {/* Order meta */}
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="text-[13px] font-bold text-foreground">{order?.orderId}</p>
              <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold', statusClass)}>
                {statusLabel}
              </span>
            </div>
            <p className="mb-4 text-[11px] text-muted-foreground">{formatDate(order?.createdAt)}</p>

            {/* ── 3-column info strip ── */}
            <div className="mb-4 grid grid-cols-3 gap-2">
              {/* Customer */}
              <div className="rounded-xl border border-border bg-muted/20 p-2.5">
                <div className="mb-1 flex items-center gap-1 text-muted-foreground">
                  <User className="size-3" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Customer</span>
                </div>
                <p className="text-[12px] font-semibold leading-tight text-foreground">{order?.customerName || '—'}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Phone className="size-2.5" />
                  {order?.customerPhone || '—'}
                </p>
                {order?.customerEmail && (
                  <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{order.customerEmail}</p>
                )}
              </div>

              {/* Delivery */}
              <div className="rounded-xl border border-border bg-muted/20 p-2.5">
                <div className="mb-1 flex items-center gap-1 text-muted-foreground">
                  <MapPin className="size-3" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Delivery</span>
                </div>
                <p className="text-[12px] font-semibold leading-tight text-foreground">{order?.customerCity || '—'}</p>
                <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{order?.customerAddress || '—'}</p>
                {order?.landmark && (
                  <p className="mt-0.5 text-[10px] text-muted-foreground">📍 {order.landmark}</p>
                )}
              </div>

              {/* Payment */}
              <div className="rounded-xl border border-border bg-muted/20 p-2.5">
                <div className="mb-1 flex items-center gap-1 text-muted-foreground">
                  <Package className="size-3" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Payment</span>
                </div>
                <p className="text-[12px] font-bold leading-tight text-foreground">{formatPrice(codAmount)}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{order?.paymentStatus || 'COD'}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {Number(order?.weight || 2)} kg · {totalUnits} unit{totalUnits === 1 ? '' : 's'}
                </p>
                {order?.trackingNumber && (
                  <p className="mt-0.5 truncate text-[10px] text-muted-foreground">📦 {order.trackingNumber}</p>
                )}
              </div>
            </div>

            {/* ── Source tag & notes ── */}
            {(order?.sourceTag || order?.notes) && (
              <div className="mb-4 flex flex-wrap gap-2">
                {order.sourceTag && (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    📣 {order.sourceTag}
                  </span>
                )}
                {order.notes && (
                  <span className="text-[11px] italic text-muted-foreground">"{order.notes}"</span>
                )}
              </div>
            )}

            {/* ── Product list ── */}
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="border-b border-border bg-muted/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Items ({items.length})
              </div>
              {items.length === 0 ? (
                <div className="px-4 py-6 text-center text-[12px] text-muted-foreground">No items found.</div>
              ) : (
                <div className="divide-y divide-border">
                  {items.map((item, index) => {
                    const lineTotal = Number(item?.price || 0) * Number(item?.quantity || 1);
                    return (
                      <div
                        key={`${item?.productId || item?.name || 'item'}-${index}`}
                        className="flex items-center gap-3 px-3 py-2.5"
                      >
                        {/* Image */}
                        <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                          {item?.image ? (
                            <Image
                              src={item.image}
                              alt={item.name || 'Product'}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-[9px] font-semibold uppercase text-muted-foreground">
                              N/A
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-semibold text-foreground">
                            {item?.name || 'Unnamed product'}
                          </p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {formatPrice(item?.price || 0)} × {item?.quantity || 1}
                          </p>
                        </div>

                        {/* Line total */}
                        <p className="shrink-0 text-[12px] font-bold tabular-nums text-foreground">
                          {formatPrice(lineTotal)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Footer totals */}
              <div className="border-t border-border bg-muted/20 px-3 py-2.5">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Items total</span>
                  <span className="tabular-nums">{formatPrice(itemsTotal)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[12px] font-bold text-foreground">COD Amount</span>
                  <span className="text-[14px] font-bold tabular-nums text-foreground">{formatPrice(codAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
