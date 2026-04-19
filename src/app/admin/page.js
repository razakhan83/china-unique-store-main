import Link from 'next/link';
import { ArrowRight, Box, CircleDollarSign, Inbox, ShoppingBag, Store, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import DashboardChart from '@/components/admin/DashboardChart';
import { getAdminDashboardData } from '@/lib/data';
import { requireAdmin } from '@/lib/requireAdmin';

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

const quickActions = [
  { href: '/admin/orders', title: 'Orders' },
  { href: '/admin/products/add', title: 'Add product' },
  { href: '/admin/settings', title: 'Settings' },
];

export default async function AdminDashboardPage() {
  await requireAdmin();

  return <DashboardContent />;
}

async function DashboardContent() {
  const { summary, recentOrders, topVendors } = await getAdminDashboardData();

  const stats = [
    { value: `${summary.totalOrders}`, change: `${summary.pendingOrders} pending` },
    { value: `Rs. ${summary.totalRevenue.toLocaleString('en-PK')}`, change: 'All-time' },
    { value: `${summary.totalProducts}`, change: `${summary.liveProducts} live` },
    { value: `${summary.totalCustomers}`, change: 'Total reach' },
  ];

  return (
    <div className="admin-page-stack w-full gap-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-[-0.04em] text-foreground md:text-[1.75rem]">
          Dashboard
        </h1>
      </div>

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

      {/* Row 2: Recent Orders & Quick Actions */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.8fr_1.2fr]">
        <div className="flex flex-col gap-4">
          <div className="admin-surface rounded-[0.5rem] p-4 flex flex-col">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4">
              <div className="flex items-center gap-2">
                <Inbox className="size-4 text-muted-foreground" />
                <h2 className="text-[13px] font-semibold text-foreground">Recent Orders</h2>
              </div>
              {/* Embedded Today pulse inside recent orders header */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                    <p className="text-[15px] font-bold tabular-nums leading-none text-foreground">{summary.dailyConfirmedOrders}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">Today</p>
                </div>
                <div className="h-6 w-px bg-border/80"></div>
                <div className="flex flex-col items-end">
                    <p className="text-[15px] font-bold tabular-nums leading-none text-foreground">{summary.pendingOrders}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">Pending</p>
                </div>
              </div>
            </div>

            <div className="flex-1">
              {recentOrders.length ? (
                <div className="flex flex-col divide-y divide-border/60">
                  {recentOrders.map((order) => (
                    <div key={order._id} className="flex items-center justify-between py-2.5">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">{order.customerName}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{order.orderId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-medium text-foreground tabular-nums">Rs. {order.totalAmount.toLocaleString('en-PK')}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{formatAdminTimestamp(order.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-[12px] text-muted-foreground">
                  No orders found.
                </div>
              )}
            </div>
          </div>
          
          <div className="admin-surface flex flex-col rounded-[0.5rem] p-4">
             <DashboardChart />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Quick Actions */}
          <div className="admin-surface rounded-[0.5rem] p-4">
            <h2 className="mb-4 text-[13px] font-semibold text-foreground">Quick Actions</h2>
            <div className="flex flex-col gap-1.5">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex items-center justify-between rounded-md border border-transparent bg-muted/30 px-3 py-2 transition-colors hover:bg-muted"
                >
                  <p className="text-[13px] font-medium text-foreground">{action.title}</p>
                  <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </div>
          
          {/* Top Vendors */}
          <div className="admin-surface rounded-[0.5rem] p-4 flex-1">
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
          </div>
        </div>
      </section>

    </div>
  );
}
