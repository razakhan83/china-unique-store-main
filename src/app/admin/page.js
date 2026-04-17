import Link from 'next/link';
import { ArrowRight, Box, CircleDollarSign, Inbox, ShoppingBag, Store, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getAdminDashboardData } from '@/lib/data';
import { requireAdmin } from '@/lib/requireAdmin';

const statsConfig = [
  { title: 'Total Orders', icon: ShoppingBag, key: 'totalOrders' },
  { title: 'Revenue', icon: CircleDollarSign, key: 'totalRevenue' },
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
  {
    href: '/admin/orders',
    title: 'Orders',
  },
  {
    href: '/admin/products/add',
    title: 'Add product',
  },
  {
    href: '/admin/settings',
    title: 'Settings',
  },
];

export default async function AdminDashboardPage() {
  await requireAdmin();

  return <DashboardContent />;
}

async function DashboardContent() {
  const { summary, recentOrders, topVendors } = await getAdminDashboardData();

  const stats = [
    { value: `${summary.totalOrders}`, change: `${summary.pendingOrders} pending` },
    { value: `Rs. ${summary.totalRevenue.toLocaleString('en-PK')}`, change: 'Total revenue' },
    { value: `${summary.totalProducts}`, change: `${summary.liveProducts} live` },
    { value: `${summary.totalCustomers}`, change: 'Total customers' },
  ];

  return (
    <div className="admin-page-stack w-full">
      <section className="admin-panel overflow-hidden rounded-[1.4rem] px-4 py-5 sm:px-5 md:px-6 md:py-6">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(16rem,0.8fr)] xl:items-start">
          <div className="flex min-h-full flex-col justify-between gap-6">
            <div className="max-w-3xl">
              <p className="admin-page-kicker">Dashboard</p>
              <h1 className="mt-2 text-balance text-3xl font-bold tracking-[-0.05em] text-foreground md:text-[2.2rem]">
                Clean overview of orders, revenue, and catalog health.
              </h1>
            </div>
            <div className="flex flex-wrap gap-2.5 text-sm">
              <div className="rounded-full border border-border/80 bg-background px-3.5 py-2 text-foreground">
                <span className="font-semibold tabular-nums">{summary.pendingOrders}</span> pending
              </div>
              <div className="rounded-full border border-border/80 bg-background px-3.5 py-2 text-foreground">
                <span className="font-semibold tabular-nums">{summary.liveProducts}</span> live
              </div>
            </div>
          </div>

          <div className="admin-surface rounded-[1.2rem] p-4">
            <div className="mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Quick actions</p>
            </div>
            <div className="flex flex-col gap-2.5">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex items-center justify-between gap-3 rounded-[0.95rem] border border-border/80 bg-white px-4 py-3 transition-[border-color,background-color,transform] duration-200 hover:border-border hover:bg-[oklch(0.972_0.001_260)]"
                >
                  <p className="font-semibold text-foreground">{action.title}</p>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statsConfig.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="admin-stat-card p-4 sm:p-5"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{stat.title}</p>
                  <h3 className="mt-2 text-[1.8rem] font-bold tracking-[-0.04em] text-foreground tabular-nums sm:text-3xl">{stats[index].value}</h3>
                </div>
                <div className="flex size-11 items-center justify-center rounded-[0.9rem] border border-border bg-muted text-foreground">
                  <Icon className="size-5" />
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3">
                <p className="text-sm text-muted-foreground">{stats[index].change}</p>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="grid gap-5">
          <div className="admin-surface rounded-[1.5rem] p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-muted text-foreground">
                <Store className="size-4" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Top Vendors</h2>
              </div>
            </div>
            {topVendors.length > 0 ? (
              <div className="space-y-3">
                {topVendors.map((vendor) => (
                  <div
                    key={`${vendor.vendorId || vendor.name}-${vendor.shopNumber || ''}`}
                    className="rounded-[1.15rem] border border-border/80 bg-background px-4 py-3"
                  >
                    <p className="text-sm font-medium text-foreground">{vendor.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{vendor.totalLiveItems}</span>{' '}
                      {vendor.totalLiveItems === 1 ? 'Item' : 'Items'}
                      {vendor.shopNumber ? ` • Shop ${vendor.shopNumber}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.15rem] border border-dashed border-border bg-background px-4 py-10 text-center text-sm text-muted-foreground">
                No live vendor-linked products yet.
              </div>
            )}
          </div>

          <div className="admin-surface rounded-[1.5rem] p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-muted text-foreground">
                <ShoppingBag className="size-4" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Today</h2>
              </div>
            </div>
            <div className="flex h-[260px] flex-col justify-between rounded-[1.3rem] border border-border/80 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_98%,white),color-mix(in_oklab,var(--color-muted)_70%,white))] p-6">
              <div className="space-y-2">
                <p className="text-6xl font-black tracking-[-0.06em] text-foreground tabular-nums">{summary.dailyConfirmedOrders}</p>
              </div>
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">Confirmed orders</p>
            </div>
          </div>

          <div className="admin-surface rounded-[1.5rem] p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-muted text-foreground">
                <Inbox className="size-4" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Recent Orders</h2>
              </div>
            </div>
            {recentOrders.length ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order._id}
                    className="rounded-[1.2rem] border border-border/80 bg-background p-4 transition-[border-color,transform] duration-200 hover:border-foreground/14"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{order.customerName}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{order.orderId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground tabular-nums">Rs. {order.totalAmount.toLocaleString('en-PK')}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">{formatAdminTimestamp(order.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[280px] flex-col items-center justify-center rounded-[1.3rem] border border-dashed border-border bg-muted/30 px-6 text-center">
                <Inbox className="mb-3 size-8 text-muted-foreground" />
                <p className="font-medium text-foreground">No orders</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-5">
          <div className="admin-surface rounded-[1.5rem] p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-muted text-foreground">
                <CircleDollarSign className="size-4" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Revenue</h2>
              </div>
            </div>
            <div className="rounded-[1.3rem] border border-border/80 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_98%,white),color-mix(in_oklab,var(--color-muted)_72%,white))] p-6">
              <p className="mt-3 text-4xl font-black tracking-[-0.05em] text-foreground tabular-nums">Rs. {summary.totalRevenue.toLocaleString('en-PK')}</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">All-time revenue</p>
            </div>
          </div>

          <div className="admin-surface rounded-[1.5rem] p-5">
            <div className="mb-4">
              <h2 className="font-semibold text-foreground">Overview</h2>
            </div>
            <div className="space-y-3">
              <div className="rounded-[1.15rem] border border-border/80 bg-background px-4 py-3">
                <p className="text-sm font-medium text-foreground">Pending orders</p>
                <p className="mt-1 text-sm text-muted-foreground"><span className="font-semibold tabular-nums text-foreground">{summary.pendingOrders}</span> waiting</p>
              </div>
              <div className="rounded-[1.15rem] border border-border/80 bg-background px-4 py-3">
                <p className="text-sm font-medium text-foreground">Catalog health</p>
                <p className="mt-1 text-sm text-muted-foreground"><span className="font-semibold tabular-nums text-foreground">{summary.liveProducts}</span> live</p>
              </div>
              <div className="rounded-[1.15rem] border border-border/80 bg-background px-4 py-3">
                <p className="text-sm font-medium text-foreground">Customer reach</p>
                <p className="mt-1 text-sm text-muted-foreground"><span className="font-semibold tabular-nums text-foreground">{summary.totalCustomers}</span> customers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-surface flex flex-col gap-3 rounded-[1.3rem] p-4 md:flex-row md:items-center md:justify-between md:p-5">
        <div>
          <h2 className="font-semibold text-foreground">Catalog</h2>
        </div>
        <Link href="/admin/products/add">
          <Button className="border border-foreground bg-foreground text-background hover:bg-foreground/88">
            Add product
            <ArrowRight data-icon="inline-end" />
          </Button>
        </Link>
      </section>
    </div>
  );
}
