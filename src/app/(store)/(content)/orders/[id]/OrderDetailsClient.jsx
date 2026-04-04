'use client';

import Image from 'next/image';
import { Package, Calendar, Clock, Truck, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import InvoiceButton from '@/components/InvoiceButtonWrapper';
import CopyButton from '@/components/CopyButton';
import { cn } from '@/lib/utils';

const STATUS_COLORS = {
  Pending: 'bg-accent/15 text-accent-foreground border-accent/25',
  Confirmed: 'bg-primary/10 text-primary border-primary/20',
  'In Process': 'bg-secondary text-secondary-foreground border-border',
  Delivered: 'bg-success/12 text-success border-success/20',
  'Delivery Address Issue': 'bg-destructive/10 text-destructive border-destructive/20',
  Returned: 'bg-muted text-muted-foreground border-border',
};

export default function OrderDetailsClient({ order }) {
  if (!order) return null;

  return (
    <div className="surface-card overflow-hidden rounded-xl border border-border shadow-md">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-8 bg-muted/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Order ID</span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-lg font-bold text-foreground">{order.orderId}</span>
              <CopyButton 
                text={order.orderId} 
                className="size-7 p-1 hover:bg-primary/10 transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="size-3" />
              {new Date(order.createdAt).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="size-3" />
              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <InvoiceButton order={order} />
          <Badge 
            variant="outline" 
            className={cn("px-4 py-1.5 text-sm rounded-full border shadow-sm font-semibold", STATUS_COLORS[order.status] || 'bg-muted')}
          >
            {order.status}
          </Badge>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column: Items */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Package className="size-5 text-primary" />
              Order Items
            </h3>
            <div className="space-y-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 rounded-lg border border-border/50 bg-muted/10">
                  <div className="relative size-16 overflow-hidden rounded-lg border border-border bg-muted shrink-0">
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-bold text-foreground">Rs. {(item.price * item.quantity).toLocaleString('en-PK')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Tracking & Summary */}
          <div className="space-y-8">
            {/* Tracking Info */}
            {(order.courierName || order.trackingNumber) && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 border-dashed">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="size-5 text-primary" />
                  <h3 className="text-md font-bold text-primary">Tracking Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {order.courierName && (
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">Courier</p>
                      <p className="text-sm font-bold text-foreground">{order.courierName}</p>
                    </div>
                  )}
                  {order.trackingNumber && (
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">Tracking ID</p>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-mono font-bold text-foreground">{order.trackingNumber}</span>
                        <CopyButton 
                          text={order.trackingNumber} 
                          className="size-6 p-1 hover:bg-primary/10 transition-colors"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Shipping Summary */}
            <div className="space-y-4 pt-4">
               <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Truck className="size-5 text-primary" />
                Shipping Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-semibold">{order.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address:</span>
                  <span className="font-semibold text-right max-w-[200px]">{order.customerAddress}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between text-muted-foreground text-sm">
                <span>Payment Method:</span>
                <span className="font-semibold text-foreground">Cash on Delivery</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-lg font-bold text-foreground">Total Paid:</span>
                <span className="text-2xl font-black text-primary">Rs. {order.totalAmount.toLocaleString('en-PK')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer text */}
      <div className="p-6 bg-muted/10 border-t border-border text-center text-xs text-muted-foreground">
        Order created on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
      </div>
    </div>
  );
}
