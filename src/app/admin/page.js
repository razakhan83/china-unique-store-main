import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Box, CircleDollarSign, ExternalLink, Images, Inbox, LayoutGrid, Settings, ShoppingBag, Store, Users, Plus, Trophy, Star, MessageSquare } from 'lucide-react';

import { AdminDashboardSkeleton } from '@/components/AdminDashboardSkeleton';
import { Badge } from '@/components/ui/badge';
import DashboardChart from '@/components/admin/DashboardChart';
import { getAdminDashboardData } from '@/lib/data';
import { normalizeOrderStatus } from '@/lib/order-status';
import { requireAdmin } from '@/lib/requireAdmin';

const STATUS_VARIANT = {
  'Order Confirmed': 'default',
  'In Process': 'secondary',
  Packed: 'secondary',
  Shipped: 'default',
  'Out For Delivery': 'default',
  Delivered: 'default',
  Returned: 'destructive',
};

const statsConfig = [
  { title: 'Total Orders', icon: ShoppingBag, key: 'totalOrders' },
  { title: 'Total Revenue', icon: CircleDollarSign, key: 'totalRevenue' },
  { title: 'Total Products', icon: Box, key: 'totalProducts' },
  { title: 'Customers', icon: Users, key: 'totalCustomers' },
];

function formatAdminTimestamp(value) {
  return new Intl.DateTimeFormat('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getGreeting() {
  const hour = Number(new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi', hour: 'numeric', hourCycle: 'h23' }));
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const emptySummary = {
  totalOrders: 0,
  pendingOrders: 0,
  totalProducts: 0,
  liveProducts: 0,
  totalRevenue: 0,
  totalCustomers: 0,
  dailyConfirmedOrders: 0,
};

async function loadDashboardDataSafely() {
  try {
    return await getAdminDashboardData();
  } catch (error) {
    console.error('[admin/dashboard] failed to load dashboard summary', error);
    return {
      summary: emptySummary,
      recentOrders: [],
      topVendors: [],
      topProducts: [],
      topCustomers: [],
      recentReviews: [],
      hasError: true,
    };
  }
}

export default async function AdminDashboardPage() {
  const session = await requireAdmin();

  return (
    <Suspense fallback={<AdminDashboardSkeleton />}>
      <DashboardContent session={session} />
    </Suspense>
  );
}

async function DashboardContent({ session }) {
  const {
    summary,
    recentOrders,
    topVendors,
    topProducts = [],
    topCustomers = [],
    recentReviews = [],
    hasError = false,
  } = await loadDashboardDataSafely();

  const stats = [
    { value: `${summary.totalOrders}`, change: `${summary.pendingOrders} order confirmed` },
    { value: `Rs. ${summary.totalRevenue.toLocaleString('en-PK')}`, change: 'All-time' },
    { value: `${summary.totalProducts}`, change: `${summary.liveProducts} live` },
    { value: `${summary.totalCustomers}`, change: 'Total reach' },
  ];

  return (
    <div className="admin-page-stack w-full gap-4">
      <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.04em] text-foreground md:text-[1.75rem]">
            {getGreeting()}, {session?.user?.name?.split(' ')[0] || 'Admin'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Here's what's happening with your store today.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/orders" className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 sm:px-4 py-2 text-[13px] font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors">
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Create Order</span>
            <span className="sm:hidden">Order</span>
          </Link>
          <Link href="/admin/products/add" className="inline-flex items-center justify-center gap-1.5 rounded-md bg-secondary px-3 sm:px-4 py-2 text-[13px] font-medium text-secondary-foreground shadow-sm hover:bg-secondary/80 transition-colors">
            <Box className="size-3.5" />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Product</span>
          </Link>
        </div>
      </div>

      {hasError ? (
        <div className="admin-surface rounded-[0.5rem] border border-destructive/20 bg-destructive/5 p-3 text-[12px] text-destructive">
          Dashboard data could not be loaded completely. The admin panel shell is still available, and you can continue to other sections.
        </div>
      ) : null}

      {/* Top Level Stats */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statsConfig.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="admin-surface rounded-[0.5rem] border-transparent p-3 sm:p-4 transition-colors hover:border-border">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] sm:text-[12px] font-medium text-muted-foreground line-clamp-1">{stat.title}</p>
                  <h3 className="mt-0.5 text-lg sm:text-2xl font-bold tracking-[-0.02em] text-foreground tabular-nums">
                    {stats[index].value}
                  </h3>
                </div>
                <div className="flex size-6 sm:size-8 items-center justify-center rounded-md bg-muted/50 text-foreground shrink-0 ml-2">
                  <Icon className="size-3.5 sm:size-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Row 2: Recent Orders & Top Products */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1.4fr] mb-4">
        <div className="flex flex-col gap-4">
          <div className="admin-surface rounded-[0.5rem] p-4 flex flex-col h-full">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4">
              <div className="flex items-center gap-2">
                <Inbox className="size-4 text-muted-foreground" />
                <h2 className="text-[13px] font-semibold text-foreground">Recent Orders</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                    <p className="text-[15px] font-bold tabular-nums leading-none text-foreground">{summary.dailyConfirmedOrders}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">Today</p>
                </div>
                <div className="h-6 w-px bg-border/80"></div>
                <div className="flex flex-col items-end">
                    <p className="text-[15px] font-bold tabular-nums leading-none text-foreground">{summary.pendingOrders}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">Order Confirmed</p>
                </div>
              </div>
            </div>

            <div className="flex-1">
              {recentOrders.length ? (
                <div className="flex flex-col divide-y divide-border/60">
                  {recentOrders.map((order) => (
                    <Link key={order._id} href={`/admin/orders/${order._id}`} className="flex items-center justify-between gap-2 py-2.5 transition-colors hover:bg-muted/30 -mx-2 px-2 rounded-md">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-medium text-foreground truncate">{order.customerName}</p>
                          <Badge variant={STATUS_VARIANT[normalizeOrderStatus(order.status)] || 'outline'} className="text-[9px] px-1.5 py-0 h-4 shrink-0">
                            {normalizeOrderStatus(order.status)}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{order.orderId}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[13px] font-medium text-foreground tabular-nums">Rs. {order.totalAmount.toLocaleString('en-PK')}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{formatAdminTimestamp(order.createdAt)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-[12px] text-muted-foreground">
                  No orders found.
                </div>
              )}
            </div>

            {recentOrders.length > 0 && (
              <Link href="/admin/orders" className="mt-3 flex items-center justify-center gap-1.5 rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                View All Orders
                <ArrowRight className="size-3" />
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="admin-surface rounded-[0.5rem] p-4 flex-1 h-full">
            <div className="mb-4 flex items-center gap-2">
              <Trophy className="size-4 text-muted-foreground" />
              <h2 className="text-[13px] font-semibold text-foreground">Top Performing Products</h2>
            </div>
            {topProducts?.length > 0 ? (
              <div className="flex flex-col divide-y divide-border/60">
                {topProducts.map((product, index) => (
                  <div key={product._id} className="flex items-center justify-between py-3 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative size-10 rounded-md border border-border/50 overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                        {product.image ? (
                          <Image src={product.image} alt={product.name} fill className="object-cover" sizes="40px" />
                        ) : (
                          <Box className="size-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">{product.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Rank #{index + 1}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[14px] font-bold text-foreground tabular-nums">{product.totalSold}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sold</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-[12px] text-muted-foreground">
                No product data available yet.
              </div>
            )}
            {topProducts?.length > 0 && (
              <Link href="/admin/top-performing-products" className="mt-3 flex items-center justify-center gap-1.5 rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                View All Products
                <ArrowRight className="size-3" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Row 3: Mini Performance Chart & Top Vendors */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1.4fr] mb-4">
        <div className="flex flex-col gap-4">
          <div className="admin-surface flex flex-col rounded-[0.5rem] p-4 h-full">
             <div className="mb-4 flex items-center gap-2">
                <CircleDollarSign className="size-4 text-muted-foreground" />
                <h2 className="text-[13px] font-semibold text-foreground">Performance Overview</h2>
             </div>
             <div className="h-56 w-full mt-2">
               <DashboardChart initialData={[]} initialPeriod="monthly" />
             </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="admin-surface rounded-[0.5rem] p-4 flex-1 h-full">
            <div className="mb-4 flex items-center gap-2">
              <Store className="size-4 text-muted-foreground" />
              <h2 className="text-[13px] font-semibold text-foreground">Top Vendors</h2>
            </div>
            {topVendors.length > 0 ? (
              <div className="flex flex-col divide-y divide-border/60">
                {topVendors.map((vendor) => (
                  <div key={`${vendor.vendorId || vendor.name}`} className="flex items-center justify-between py-2">
                    <p className="text-[13px] font-medium text-foreground">{vendor.name}</p>
                    <p className="text-[12px] text-muted-foreground">
                       <span className="font-medium text-foreground">{vendor.totalLiveItems}</span> Items
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-2 text-center text-[12px] text-muted-foreground">
                No vendors yet.
              </div>
            )}
            {topVendors?.length > 0 && (
              <Link href="/admin/vendors" className="mt-3 flex items-center justify-center gap-1.5 rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                View All Vendors
                <ArrowRight className="size-3" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Row 4: Recent Reviews & Top Customers */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1.4fr]">
        <div className="flex flex-col gap-4">
          <div className="admin-surface rounded-[0.5rem] p-4 flex-1 h-full">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="size-4 text-muted-foreground" />
              <h2 className="text-[13px] font-semibold text-foreground">Recent Reviews</h2>
            </div>
            {recentReviews?.length > 0 ? (
              <div className="flex flex-col divide-y divide-border/60">
                {recentReviews.map((review) => (
                  <div key={review._id} className="flex flex-col justify-center py-3 gap-1">
                    <div className="flex items-center justify-between min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">{review.userName}</p>
                        <span className="text-[10px] text-muted-foreground truncate hidden sm:inline-block">on {review.productName}</span>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0 text-yellow-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`size-3 ${i < review.rating ? 'fill-current' : 'fill-transparent text-muted-foreground/30'}`} />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-[12px] text-muted-foreground line-clamp-2 mt-1">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-[12px] text-muted-foreground">
                No recent reviews found.
              </div>
            )}
            {recentReviews?.length > 0 && (
              <Link href="/admin/reviews" className="mt-3 flex items-center justify-center gap-1.5 rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                View All Reviews
                <ArrowRight className="size-3" />
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="admin-surface rounded-[0.5rem] p-4 flex-1 h-full">
            <div className="mb-4 flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              <h2 className="text-[13px] font-semibold text-foreground">Top Customers</h2>
            </div>
            {topCustomers?.length > 0 ? (
              <div className="flex flex-col divide-y divide-border/60">
                {topCustomers.map((customer, index) => (
                  <div key={index} className="flex items-center justify-between py-3 gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">{customer.name || 'Anonymous'}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{customer.email || customer.phone || 'No contact info'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[14px] font-bold text-foreground tabular-nums">Rs. {customer.totalSpent?.toLocaleString('en-PK')}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{customer.ordersCount} {customer.ordersCount === 1 ? 'Order' : 'Orders'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-[12px] text-muted-foreground">
                No customer data available yet.
              </div>
            )}
            {topCustomers?.length > 0 && (
              <Link href="/admin/users" className="mt-3 flex items-center justify-center gap-1.5 rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                View All Customers
                <ArrowRight className="size-3" />
              </Link>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
