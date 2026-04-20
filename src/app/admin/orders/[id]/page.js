import Link from 'next/link';
import { Fragment } from 'react';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Receipt } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getOrderById, getOrderLogs } from '@/lib/data';
import { requireAdmin } from '@/lib/requireAdmin';
import OrderDetailActions from './OrderDetailActions';

const statusVariant = {
  Pending: 'accent',
  Confirmed: 'primary',
  Sourcing: 'secondary',
  'In Process': 'secondary',
  Packed: 'secondary',
  Shipped: 'secondary',
  'Out for Delivery': 'secondary',
  Delivered: 'secondary',
  'Delivery Address Issue': 'destructive',
  Returned: 'outline',
};

export default async function AdminOrderDetailPage({ params }) {
  await connection();
  await requireAdmin();
  const { id } = await params;

  return <OrderDetailContent id={id} />;
}

async function OrderDetailContent({ id }) {
  const [order, logs] = await Promise.all([
    getOrderById(id),
    getOrderLogs(id)
  ]);

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Order {order.orderId}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Saved order details and customer delivery information.</p>
        </div>
        <Button variant="outline" render={<Link href="/admin/orders" />} nativeButton={false} className="w-full sm:w-auto">
          Back to Orders
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="surface-card min-w-0 overflow-hidden rounded-xl p-4 sm:p-5 lg:col-span-1 shadow-sm">
          <h2 className="font-semibold text-foreground">Customer</h2>
          <div className="mt-4 space-y-3 text-sm">
            <p className="flex flex-wrap gap-1.5"><span className="font-medium text-foreground">Name:</span> <span>{order.customerName}</span></p>
            <p className="flex flex-wrap gap-1.5"><span className="font-medium text-foreground">Phone:</span> <span>{order.customerPhone || 'Not provided'}</span></p>
            <p className="break-words"><span className="font-medium text-foreground">Address:</span> {order.customerAddress || 'Not provided'}</p>
            <p className="flex items-center gap-1.5"><span className="font-medium text-foreground">Status:</span> <Badge variant={statusVariant[order.status] || 'secondary'}>{order.status}</Badge></p>
            <p><span className="font-medium text-foreground">Total:</span> Rs. {order.totalAmount.toLocaleString('en-PK')}</p>
            {order.notes ? <p className="break-words mt-3 rounded-lg bg-muted/30 p-3 italic text-muted-foreground"><span className="font-medium text-foreground not-italic block mb-1">Notes:</span> {order.notes}</p> : null}
          </div>
        </section>

        <OrderDetailActions order={order} />

        <section className="surface-card min-w-0 overflow-hidden rounded-xl p-4 sm:p-5 lg:col-span-2 shadow-sm">
          <h2 className="font-semibold text-foreground">Items</h2>
          <div className="mt-4 space-y-4">
            {/* Mobile View: Stacked Cards */}
            <div className="grid gap-4 sm:hidden">
              {order.items.map((item, index) => (
                <div key={`${item.productId}-${index}`} className="flex flex-col rounded-xl border border-border bg-background p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted shadow-inner">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name || 'Product'}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-bold uppercase text-muted-foreground">
                          N/A
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground leading-tight">{item.name || 'Unnamed Product'}</p>
                      {item.productId && (
                        <p className="mt-0.5 text-[10px] text-muted-foreground font-mono">ID: {item.productId}</p>
                      )}
                      <div className="mt-2 flex items-baseline gap-2">
                         <span className="text-xs text-muted-foreground">{item.quantity} × Rs. {Number(item.price || 0).toLocaleString('en-PK')}</span>
                      </div>
                      <p className="mt-1 text-sm font-black text-foreground">
                        Total: Rs. {(Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString('en-PK')}
                      </p>
                    </div>
                  </div>

                  {/* Sourcing Info in Card */}
                  {Array.isArray(item.sourcingVendors) && item.sourcingVendors.length > 0 && (
                    <div className="mt-4 rounded-lg border border-border/80 bg-muted/20 p-3">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                        Vendor Sourcing
                      </p>
                      <div className="space-y-3">
                        {item.sourcingVendors.map((vendor, vIdx) => (
                          <div key={vIdx} className="grid grid-cols-2 gap-2 text-xs border-b border-border/40 pb-2 last:border-0 last:pb-0">
                            <div>
                              <p className="font-semibold text-foreground">{vendor.name}</p>
                              <p className="text-[10px] text-muted-foreground">Shop: {vendor.shopNumber || '—'}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-foreground">
                                {vendor.vendorPrice != null ? `Rs. ${Number(vendor.vendorPrice).toLocaleString('en-PK')}` : '—'}
                              </p>
                              <p className="text-[10px] truncate text-muted-foreground italic px-1">{vendor.vendorProductName || '—'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop View: Table (Hidden on small mobile) */}
            <div className="hidden sm:block overflow-hidden rounded-xl border border-border bg-background">
              <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full min-w-[640px] divide-y divide-border">
                  <thead>
                    <tr className="bg-muted/50 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Qty</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {order.items.map((item, index) => (
                      <Fragment key={`${item.productId}-${index}`}>
                        <tr>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="relative h-14 w-14 overflow-hidden rounded-lg border border-border bg-muted">
                                {item.image ? (
                                  <Image
                                    src={item.image}
                                    alt={item.name || 'Product image'}
                                    fill
                                    sizes="56px"
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    N/A
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground">{item.name || 'Unnamed product'}</p>
                                {item.productId ? (
                                  <p className="text-xs text-muted-foreground font-mono opacity-70">ID: {item.productId}</p>
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-muted-foreground font-medium">{item.quantity}</td>
                          <td className="px-4 py-4 text-sm text-muted-foreground">Rs. {Number(item.price || 0).toLocaleString('en-PK')}</td>
                          <td className="px-4 py-4 text-sm font-bold text-foreground">
                            Rs. {(Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString('en-PK')}
                          </td>
                        </tr>
                        {/* Desktop Sourcing Sub-table */}
                        <tr>
                          <td colSpan={4} className="bg-muted/10 px-4 pb-4 pt-0">
                            <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
                              <div className="mb-3">
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                                  Vendor Sourcing Info
                                </p>
                              </div>
                              {Array.isArray(item.sourcingVendors) && item.sourcingVendors.length > 0 ? (
                                <div className="overflow-hidden rounded-lg border border-border">
                                  <div className="overflow-x-auto">
                                    <table className="w-full min-w-[560px]">
                                      <thead>
                                        <tr className="bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                          <th className="px-3 py-2">Vendor Name</th>
                                          <th className="px-3 py-2">Shop</th>
                                          <th className="px-3 py-2">Vendor List Name</th>
                                          <th className="px-3 py-2 text-right">Cost Price</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-border">
                                        {item.sourcingVendors.map((vendor, vendorIndex) => (
                                          <tr key={`${vendor.vendorId || vendor.name}-${vendorIndex}`}>
                                            <td className="px-3 py-2.5 text-sm font-medium text-foreground">{vendor.name}</td>
                                            <td className="px-3 py-2.5 text-xs text-muted-foreground">{vendor.shopNumber || '—'}</td>
                                            <td className="px-3 py-2.5 text-xs text-muted-foreground italic">{vendor.vendorProductName || '—'}</td>
                                            <td className="px-3 py-2.5 text-sm font-semibold text-right text-foreground">
                                              {vendor.vendorPrice != null
                                                ? `Rs. ${Number(vendor.vendorPrice).toLocaleString('en-PK')}`
                                                : '—'}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[11px] text-muted-foreground italic">
                                  No sourcing info added.
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Order History Log */}
      <section className="surface-card rounded-xl p-6 border border-border shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
          <div className="rounded-lg border border-border bg-muted p-2 text-foreground">
            <Receipt className="size-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Order History</h2>
            <p className="text-sm text-muted-foreground">Timeline of status changes and updates</p>
          </div>
        </div>

        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {logs.length === 0 ? (
            <div className="pl-12 py-4">
              <p className="text-sm text-muted-foreground italic">No history logs found for this order.</p>
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={log._id} className="relative flex items-start group">
                <div className="absolute left-0 z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-border bg-background shadow-sm transition-transform group-hover:scale-110">
                  <div className="size-2 rounded-full bg-foreground" />
                </div>
                <div className="flex-1 ml-14 p-4 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-foreground">
                      {log.action.replace('_', ' ')}
                    </span>
                    <time className="text-xs font-medium text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString('en-PK', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </time>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed font-medium">{log.details}</p>
                  {(log.adminName || log.adminEmail) && (
                    <div className="mt-3 pt-3 flex items-center gap-2 border-t border-border/30">
                      <div className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                        {(log.adminName || 'A').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs text-muted-foreground italic">
                        By {log.adminName || log.adminEmail || 'System'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
