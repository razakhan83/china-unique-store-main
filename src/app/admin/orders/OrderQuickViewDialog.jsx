'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { Camera, Eye, MapPin, Package, Phone, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
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
  triggerClassName = '',
  triggerVariant = 'secondary',
  triggerSize = 'sm',
  triggerLabel = 'View',
}) {
  const cardRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [open, setOpen] = useState(false);

  if (!order) return null;

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
        className={cn(buttonVariants({ variant: triggerVariant, size: triggerSize }), triggerClassName)}
      >
        <Eye data-icon="inline-start" />
        {triggerLabel}
      </DialogTrigger>

      <DialogContent className="max-h-[92vh] w-[calc(100%-1rem)] max-w-xl overflow-hidden p-0 sm:max-w-2xl" showCloseButton>
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border pl-4 pr-12 py-3 sm:pl-5 sm:pr-12">
          <DialogTitle className="text-[14px] font-bold text-foreground">
            Order Quick View
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[12px]"
              disabled={isSaving}
              onClick={handleSaveAsImage}
            >
              {isSaving ? <Spinner className="mr-1 size-3" /> : <Camera className="mr-1 size-3" />}
              <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save Image'}</span>
              <span className="sm:hidden">{isSaving ? '...' : 'Save'}</span>
            </Button>
            <Link
              href={`/admin/orders/${order?._id}`}
              className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'h-8 text-[12px]')}
            >
              View Details
            </Link>
          </div>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="max-h-[calc(92vh-64px)] overflow-y-auto">
          {/* The ref'd card — this is what gets captured */}
          <div ref={cardRef} className="bg-background p-5 sm:p-7 text-foreground space-y-6">
            {/* Header: Order ID & Status */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/60">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">{order?.orderId}</h2>
                <p className="mt-1 text-[12px] text-muted-foreground">{formatDate(order?.createdAt)}</p>
              </div>
              <span className={cn('shrink-0 rounded-md border px-2.5 py-1 text-[11px] font-semibold tracking-wide', statusClass)}>
                {statusLabel}
              </span>
            </div>

            {/* ── Customer & Delivery Info (Labeled Rows) ── */}
            <div className="space-y-2 py-1 text-[13px]">
              <div className="flex items-baseline gap-2">
                <span className="text-muted-foreground text-[13px] w-36 shrink-0 font-medium">Customer Name:</span>
                <span className="font-bold text-foreground text-[15px]">{order?.customerName || '—'}</span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-muted-foreground text-[13px] w-36 shrink-0 font-medium">Phone Number:</span>
                <span className="font-semibold text-foreground text-[14px]">{order?.customerPhone || '—'}</span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-muted-foreground text-[13px] w-36 shrink-0 font-medium">Address:</span>
                <span className="text-foreground text-[13px] leading-relaxed">
                  {order?.customerAddress || '—'}
                  {order?.landmark ? <span className="ml-1.5 text-muted-foreground">({order.landmark})</span> : null}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-muted-foreground text-[13px] w-36 shrink-0 font-medium">City:</span>
                <span className="font-bold text-foreground text-[16px] capitalize tracking-wide">{order?.customerCity || '—'}</span>
              </div>
            </div>

            {/* ── Source tag & notes ── */}
            {(order?.sourceTag || order?.notes) && (
              <div className="flex flex-wrap gap-2 pt-0.5">
                {order.sourceTag && (
                  <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    📣 {order.sourceTag}
                  </span>
                )}
                {order.notes && (
                  <span className="text-[12px] italic text-muted-foreground bg-muted/30 px-2.5 py-1 rounded border border-border/40">
                    &quot;{order.notes}&quot;
                  </span>
                )}
              </div>
            )}

            {/* ── Product list ── */}
            <div className="pt-1">
              <div className="flex items-center justify-between pb-2 border-b border-border/80">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                  Order Items ({items.length})
                </h3>
                <span className="text-[11px] text-muted-foreground">Price</span>
              </div>
              
              {items.length === 0 ? (
                <div className="py-6 text-center text-[12px] text-muted-foreground">No items in this order.</div>
              ) : (
                <div className="divide-y divide-border/60">
                  {items.map((item, index) => {
                    const lineTotal = Number(item?.price || 0) * Number(item?.quantity || 1);
                    return (
                      <div
                        key={`${item?.productId || item?.name || 'item'}-${index}`}
                        className="flex items-center justify-between gap-4 py-3"
                      >
                        {/* Image + Title */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                            {item?.image ? (
                              <Image
                                src={item.image}
                                alt={item.name || 'Product'}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center text-[9px] font-medium uppercase text-muted-foreground">
                                N/A
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold text-foreground truncate">
                              {item?.name || 'Unnamed product'}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {formatPrice(item?.price || 0)} × {item?.quantity || 1}
                            </p>
                          </div>
                        </div>

                        {/* Line total */}
                        <p className="shrink-0 text-[13px] font-bold tabular-nums text-foreground">
                          {formatPrice(lineTotal)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Totals Summary */}
              <div className="border-t border-border/80 pt-4 mt-2 space-y-1.5">
                <div className="flex items-center justify-between text-[12px] text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="tabular-nums font-medium text-foreground">{formatPrice(itemsTotal)}</span>
                </div>
                {order?.shippingAmount != null ? (
                  <div className="flex items-center justify-between text-[12px] text-muted-foreground">
                    <span>Delivery Charges</span>
                    <span className="tabular-nums font-medium text-foreground">{formatPrice(order.shippingAmount)}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[12px] text-muted-foreground">
                    <span>Delivery Charges</span>
                    <span className="tabular-nums font-medium text-foreground">{formatPrice(Math.max(0, (order?.totalAmount || codAmount) - itemsTotal))}</span>
                  </div>
                )}
                {order?.discountAmount > 0 && (
                  <div className="flex items-center justify-between text-[12px] text-emerald-600 dark:text-emerald-400">
                    <span>Discount</span>
                    <span className="tabular-nums font-medium">-{formatPrice(order.discountAmount)}</span>
                  </div>
                )}
                
                {/* Total Amount Row */}
                <div className="flex items-center justify-between border-t border-border/80 pt-3 mt-2">
                  <span className="text-[13px] font-bold uppercase tracking-wider text-foreground">Total Amount</span>
                  <span className="text-[18px] font-bold tabular-nums text-foreground">{formatPrice(order?.totalAmount || codAmount)}</span>
                </div>

                {/* Sub-info Row: COD Amount, KG Weight, Units & Tracking with Courier Name */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-3 border-t border-border/40 text-[12px] text-muted-foreground">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>COD: <strong className="text-foreground font-bold">{formatPrice(codAmount)}</strong></span>
                    <span className="text-muted-foreground/40">•</span>
                    <span>{Number(order?.weight || 2)} kg</span>
                    <span className="text-muted-foreground/40">•</span>
                    <span>{totalUnits} unit{totalUnits === 1 ? '' : 's'}</span>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="font-semibold text-foreground">{order?.paymentStatus || 'COD'}</span>
                  </div>
                  {(() => {
                    const displayTracking = order?.nocThirdPartyNo && String(order.nocThirdPartyNo).trim() !== '' && String(order.nocThirdPartyNo).trim().toUpperCase() !== 'N/A' && String(order.nocThirdPartyNo).trim().toUpperCase() !== 'NA'
                      ? String(order.nocThirdPartyNo).trim()
                      : (order?.nocParcelNo || order?.trackingNumber || '');
                    const courierDisplay = order?.courierName || (order?.trackingNumber ? 'NOC' : '');

                    if (!displayTracking) return null;

                    return (
                      <div className="flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
                        <span>📦</span> Tracking: <span className="font-mono">{displayTracking}</span>
                        {courierDisplay ? (
                          <span className="text-muted-foreground font-medium">({courierDisplay})</span>
                        ) : null}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
