'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  ShoppingBag,
  TrendingUp,
  User,
  UserCheck,
  Clock,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { getStatusBadgeClass } from '@/lib/order-status';
import { formatSmartTimeAgo } from '@/lib/timeAgo';

function formatPakistaniPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('92')) return digits;
  if (digits.startsWith('03')) return `92${digits.slice(1)}`;
  return `92${digits}`;
}

export default function CustomerDetailClient({ customer }) {
  const formattedPhone = formatPakistaniPhone(customer.phone);
  const whatsappUrl = formattedPhone
    ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(`Salam ${customer.name || 'Customer'}, regarding your account with China Unique Items:`)}`
    : null;
  const callUrl = customer.phone ? `tel:${customer.phone}` : null;

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-16">
      {/* ── Top Header Navigation & Profile Bar ── */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-card border border-border p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/admin/users"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-9 px-3 rounded-lg gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground')}
          >
            <ArrowLeft className="size-4" />
            <span>Back to Users</span>
          </Link>

          <div className="flex items-center gap-3.5">
            <div className="size-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-lg font-black uppercase">
              {customer.name?.charAt(0) || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {customer.name}
                </h1>
                {customer.isRegisteredUser ? (
                  <Badge variant="secondary" className="gap-1 text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20">
                    <UserCheck className="size-3" />
                    Registered Account
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[11px] font-medium text-muted-foreground">
                    Storefront Guest Buyer
                  </Badge>
                )}
                {customer.totalOrders > 1 && (
                  <Badge variant="secondary" className="text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20">
                    Repeat Customer ({customer.totalOrders} orders)
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Customer Identifier: <span className="font-mono text-foreground font-semibold">{customer.id}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ size: 'sm' }), 'h-9 px-3.5 gap-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs')}
            >
              <MessageCircle className="size-4" />
              <span>WhatsApp</span>
            </a>
          )}
          {callUrl && (
            <a
              href={callUrl}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-9 px-3.5 gap-2 text-xs font-semibold rounded-lg')}
            >
              <Phone className="size-3.5" />
              <span>Call Customer</span>
            </a>
          )}
        </div>
      </div>

      {/* ── KPI Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-muted-foreground">Total Lifetime Spent</CardDescription>
            <CardTitle className="text-2xl font-black text-foreground font-mono">
              Rs. {Number(customer.totalSpent || 0).toLocaleString('en-PK')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="size-3.5 text-emerald-600" />
              <span>Across {customer.totalOrders} store orders</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-muted-foreground">Orders Count</CardDescription>
            <CardTitle className="text-2xl font-black text-foreground font-mono">
              {customer.totalOrders}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShoppingBag className="size-3.5 text-sky-600" />
              <span>{customer.totalOrders > 1 ? 'High-intent repeat buyer' : 'First-time buyer'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-muted-foreground">Average Order Value (AOV)</CardDescription>
            <CardTitle className="text-2xl font-black text-foreground font-mono">
              Rs. {Number(customer.avgOrderValue || 0).toLocaleString('en-PK')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CreditCard className="size-3.5 text-purple-600" />
              <span>Per transaction average</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-muted-foreground">Last Order Placed</CardDescription>
            <CardTitle className="text-lg font-bold text-foreground">
              {customer.lastOrderDate ? formatSmartTimeAgo(customer.lastOrderDate) : 'Never'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="size-3.5" />
              <span>
                {customer.lastOrderDate
                  ? new Date(customer.lastOrderDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Main Two Column Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (Profile & Timeline) (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Profile Card */}
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardHeader className="pb-4 border-b border-border">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                <span>Contact & Shipping Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground font-medium">Contact Phone:</span>
                <p className="font-semibold text-foreground font-mono text-sm">
                  {customer.phone || '—'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground font-medium">Email Address:</span>
                <p className="font-semibold text-foreground">
                  {customer.email || '—'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground font-medium">Primary Delivery City:</span>
                <p className="font-semibold text-foreground">
                  {customer.city || '—'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground font-medium">Shipping Address:</span>
                <p className="font-medium text-foreground leading-relaxed bg-muted/30 p-2.5 rounded-lg border border-border">
                  {customer.address || 'No saved address'}
                </p>
              </div>

              {customer.registeredAt && (
                <div className="pt-2 border-t border-border flex justify-between text-muted-foreground">
                  <span>Account Registered:</span>
                  <span className="font-medium text-foreground">
                    {new Date(customer.registeredAt).toLocaleDateString('en-PK')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Timeline Card */}
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardHeader className="pb-4 border-b border-border">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                <span>Customer Activity Timeline</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Milestones from purchase to delivery
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {customer.orders.slice(0, 8).map((order, idx) => (
                  <div key={order._id || idx} className="relative">
                    <div className="absolute -left-6 top-1 flex size-5 items-center justify-center rounded-full border border-border bg-background">
                      {order.status === 'Delivered' ? (
                        <CheckCircle2 className="size-3 text-emerald-600" />
                      ) : (
                        <div className="size-1.5 rounded-full bg-foreground" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <Link
                          href={`/admin/orders/${order._id}`}
                          className="font-bold text-foreground hover:underline font-mono"
                        >
                          Order {order.orderId}
                        </Link>
                        <span className="text-[11px] text-muted-foreground">
                          {order.createdAt ? formatSmartTimeAgo(order.createdAt) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Placed order for Rs. {Number(order.totalAmount || 0).toLocaleString('en-PK')} ({order.items?.length || 1} items)
                      </p>
                      <div className="pt-0.5">
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border', getStatusBadgeClass(order.status, order.isDraft))}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Full Order History) (8 Cols) */}
        <div className="lg:col-span-8">
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardHeader className="pb-4 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Package className="size-4 text-muted-foreground" />
                  <span>Full Order History</span>
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  All {customer.orders.length} order records placed by this customer
                </CardDescription>
              </div>
              <Badge variant="secondary" className="font-semibold text-xs font-mono">
                {customer.orders.length} Orders
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="font-bold text-xs">Order ID</TableHead>
                      <TableHead className="font-bold text-xs">Date</TableHead>
                      <TableHead className="font-bold text-xs">Items</TableHead>
                      <TableHead className="font-bold text-xs">Status</TableHead>
                      <TableHead className="font-bold text-xs">Payment</TableHead>
                      <TableHead className="font-bold text-xs text-right">Total Amount</TableHead>
                      <TableHead className="font-bold text-xs text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.orders.map((order) => (
                      <TableRow key={order._id} className="hover:bg-muted/30">
                        <TableCell>
                          <Link
                            href={`/admin/orders/${order._id}`}
                            className="font-mono font-bold text-foreground text-xs hover:underline flex items-center gap-1"
                          >
                            <span>{order.orderId}</span>
                            <ExternalLink className="size-3 text-muted-foreground" />
                          </Link>
                          {order.sourceTag && (
                            <span className="text-[10px] text-muted-foreground block">{order.sourceTag}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-medium">
                          {order.items?.length || 1} item{(order.items?.length || 1) === 1 ? '' : 's'}
                        </TableCell>
                        <TableCell>
                          <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border', getStatusBadgeClass(order.status, order.isDraft))}>
                            {order.isDraft ? 'Draft' : order.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-semibold text-foreground">
                            {order.paymentStatus === 'Paid' ? 'Paid' : 'COD'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-foreground text-xs">
                          Rs. {Number(order.totalAmount || 0).toLocaleString('en-PK')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/admin/orders/${order._id}`}
                            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-7 px-2.5 text-xs font-semibold rounded-lg')}
                          >
                            View Order
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
