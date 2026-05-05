'use client';

import Image from 'next/image';
import { Eye, MapPin, Package, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

function getTotalUnits(items) {
  return (Array.isArray(items) ? items : []).reduce(
    (sum, item) => sum + Number(item?.quantity || 0),
    0
  );
}

export default function OrderQuickViewDialog({
  order,
  triggerClassName,
  triggerVariant = 'secondary',
  triggerSize,
  triggerLabel = 'Quick View',
}) {
  const items = Array.isArray(order?.items) ? order.items : [];
  const totalUnits = getTotalUnits(items);

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant={triggerVariant}
            size={triggerSize}
            className={cn('w-full sm:w-auto', triggerClassName)}
          />
        }
      >
        <Eye className="mr-2 size-4" />
        {triggerLabel}
      </DialogTrigger>

      <DialogContent className="max-w-[calc(100%-1.5rem)] p-0 sm:max-w-2xl" showCloseButton>
        <div className="max-h-[85vh] overflow-y-auto">
          <div className="border-b border-border bg-muted/30 px-5 py-4 sm:px-6">
            <DialogHeader className="gap-1">
              <DialogTitle className="text-lg font-semibold">
                Order {order?.orderId}
              </DialogTitle>
              <DialogDescription>
                Fast order summary for quick checking.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-5 px-5 py-5 sm:px-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-background p-4">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <User className="size-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.14em]">
                    Customer
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {order?.customerName || 'Not provided'}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.14em]">
                    City
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {order?.customerCity || 'Not provided'}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <Package className="size-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.14em]">
                    Quantity
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {totalUnits} unit{totalUnits === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Products
                </h3>
                <p className="text-xs text-muted-foreground">
                  {items.length} item{items.length === 1 ? '' : 's'}
                </p>
              </div>

              {items.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {items.map((item, index) => (
                    <div
                      key={`${item?.productId || item?.name || 'item'}-${index}`}
                      className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                        {item?.image ? (
                          <Image
                            src={item.image}
                            alt={item.name || 'Product image'}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase text-muted-foreground">
                            N/A
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {item?.name || 'Unnamed product'}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Quantity: {Number(item?.quantity || 0)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                  No products found for this order.
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
