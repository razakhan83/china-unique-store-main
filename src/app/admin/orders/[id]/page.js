import Link from 'next/link';
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
  'In Process': 'secondary',
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Order {order.orderId}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Saved order details and customer delivery information.</p>
        </div>
        <Button variant="outline" render={<Link href="/admin/orders" />} nativeButton={false}>
          Back to Orders
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="surface-card rounded-xl p-5 lg:col-span-1">
          <h2 className="font-semibold text-foreground">Customer</h2>
          <div className="mt-4 space-y-3 text-sm">
            <p><span className="font-medium text-foreground">Name:</span> {order.customerName}</p>
            <p><span className="font-medium text-foreground">Phone:</span> {order.customerPhone || 'Not provided'}</p>
            <p><span className="font-medium text-foreground">Address:</span> {order.customerAddress || 'Not provided'}</p>
            <p><span className="font-medium text-foreground">Status:</span> <Badge variant={statusVariant[order.status] || 'secondary'}>{order.status}</Badge></p>
            <p><span className="font-medium text-foreground">Total:</span> Rs. {order.totalAmount.toLocaleString('en-PK')}</p>
            {order.notes ? <p><span className="font-medium text-foreground">Notes:</span> {order.notes}</p> : null}
          </div>
        </section>

        <OrderDetailActions order={order} />

        <section className="surface-card rounded-xl p-5 lg:col-span-2">
          <h2 className="font-semibold text-foreground">Items</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            <table className="w-full">
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
                  <tr key={`${item.productId}-${index}`}>
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
                            <p className="text-xs text-muted-foreground">Product ID: {item.productId}</p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{item.quantity}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">Rs. {Number(item.price || 0).toLocaleString('en-PK')}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-foreground">
                      Rs. {(Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString('en-PK')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
