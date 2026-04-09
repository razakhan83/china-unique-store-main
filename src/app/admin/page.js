import Link from 'next/link';
import { ArrowRight, Box, CircleDollarSign, Inbox, ShoppingBag, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Button } from '@/components/ui/button';
import { getAdminDashboardData } from '@/lib/data';
import { requireAdmin } from '@/lib/requireAdmin';

const statsConfig = [
  { title: 'Total Orders', icon: ShoppingBag, tone: 'bg-primary/10 text-primary', key: 'totalOrders' },
  { title: 'Revenue', icon: CircleDollarSign, tone: 'bg-accent/18 text-accent-foreground', key: 'totalRevenue' },
  { title: 'Total Products', icon: Box, tone: 'bg-secondary text-secondary-foreground', key: 'totalProducts' },
  { title: 'Customers', icon: Users, tone: 'bg-muted text-foreground', key: 'totalCustomers' },
];

const quickActions = [
  {
    href: '/admin/orders',
    title: 'Review orders',
  },
  {
    href: '/admin/products/add',
    title: 'Add new product',
  },
  {
    href: '/admin/settings',
    title: 'Store settings',
  },
];

export default async function AdminDashboardPage() {
  await requireAdmin();

  return <DashboardContent />;
}

async function DashboardContent() {
  const { summary, recentOrders } = await getAdminDashboardData();

  const stats = [
    { value: `${summary.totalOrders}`, change: `${summary.pendingOrders} pending` },
    { value: `Rs. ${summary.totalRevenue.toLocaleString('en-PK')}`, change: 'Total revenue' },
    { value: `${summary.totalProducts}`, change: `${summary.liveProducts} live` },
    { value: `${summary.totalCustomers}`, change: 'Total customers' },
  ];

  return (
    <div className="w-full space-y-8">
      <section className="surface-panel overflow-hidden rounded-[1.8rem] border border-border/70 px-6 py-6 shadow-[0_30px_80px_-52px_color-mix(in_oklab,var(--color-primary)_28%,transparent)] md:px-8 md:py-7">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.9fr)] xl:items-start">
          <div className="space-y-4">
            <div className="max-w-3xl space-y-2">
              <h1 className="text-balance text-3xl font-bold tracking-[-0.04em] text-foreground md:text-[2.4rem]">
                Store overview
              </h1>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="rounded-full border border-border/70 bg-background/85 px-4 py-2 text-foreground">
                <span className="font-semibold tabular-nums">{summary.pendingOrders}</span> pending
              </div>
              <div className="rounded-full border border-border/70 bg-background/85 px-4 py-2 text-foreground">
                <span className="font-semibold tabular-nums">{summary.liveProducts}</span> live products
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border/70 bg-background/90 p-4 shadow-[0_22px_50px_-42px_color-mix(in_oklab,var(--color-primary)_28%,transparent)]">
            <div className="mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/70">Quick actions</p>
            </div>
            <div className="space-y-2.5">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex items-center justify-between gap-3 rounded-[1.15rem] border border-border/70 bg-[color:color-mix(in_oklab,var(--color-card)_94%,white)] px-4 py-3 transition-[border-color,background-color,transform,box-shadow] duration-200 hover:border-primary/20 hover:bg-[color:color-mix(in_oklab,var(--color-primary)_6%,white)] hover:shadow-[0_18px_40px_-34px_color-mix(in_oklab,var(--color-primary)_28%,transparent)]"
                >
                  <p className="font-semibold text-foreground">{action.title}</p>
                  <ArrowRight className="size-4 shrink-0 text-primary transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsConfig.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="surface-card rounded-[1.4rem] border border-border/70 p-5 shadow-[0_22px_50px_-44px_color-mix(in_oklab,var(--color-primary)_24%,transparent)]"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{stat.title}</p>
                  <h3 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-foreground tabular-nums">{stats[index].value}</h3>
                </div>
                <div className={`flex size-12 items-center justify-center rounded-[1rem] ${stat.tone}`}>
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
          <div className="surface-card rounded-[1.5rem] border border-border/70 p-5 shadow-[0_24px_56px_-44px_color-mix(in_oklab,var(--color-primary)_24%,transparent)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShoppingBag className="size-4" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Daily Stats</h2>
              </div>
            </div>
            <div className="flex h-[260px] flex-col justify-between rounded-[1.3rem] border border-border/70 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-primary)_5%,white),color-mix(in_oklab,var(--color-card)_90%,white))] p-6">
              <div className="space-y-2">
                <p className="text-6xl font-black tracking-[-0.06em] text-foreground tabular-nums">{summary.dailyConfirmedOrders}</p>
              </div>
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">Confirmed today</p>
            </div>
          </div>

          <div className="surface-card rounded-[1.5rem] border border-border/70 p-5 shadow-[0_24px_56px_-44px_color-mix(in_oklab,var(--color-primary)_24%,transparent)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
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
                    className="rounded-[1.2rem] border border-border/70 bg-[color:color-mix(in_oklab,var(--color-card)_94%,white)] p-4 transition-[border-color,transform,box-shadow] duration-200 hover:border-primary/18 hover:shadow-[0_18px_36px_-34px_color-mix(in_oklab,var(--color-primary)_22%,transparent)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{order.customerName}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{order.orderId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-primary tabular-nums">Rs. {order.totalAmount.toLocaleString('en-PK')}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</p>
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
          <div className="surface-card rounded-[1.5rem] border border-border/70 p-5 shadow-[0_24px_56px_-44px_color-mix(in_oklab,var(--color-primary)_24%,transparent)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CircleDollarSign className="size-4" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Revenue Snapshot</h2>
              </div>
            </div>
            <div className="rounded-[1.3rem] border border-border/70 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_96%,white),color-mix(in_oklab,var(--color-primary)_5%,white))] p-6">
              <p className="mt-3 text-4xl font-black tracking-[-0.05em] text-foreground tabular-nums">Rs. {summary.totalRevenue.toLocaleString('en-PK')}</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">All-time revenue</p>
            </div>
          </div>

          <div className="surface-card rounded-[1.5rem] border border-border/70 p-5 shadow-[0_24px_56px_-44px_color-mix(in_oklab,var(--color-primary)_24%,transparent)]">
            <div className="mb-4">
              <h2 className="font-semibold text-foreground">Overview</h2>
            </div>
            <div className="space-y-3">
              <div className="rounded-[1.15rem] border border-border/70 bg-background/80 px-4 py-3">
                <p className="text-sm font-medium text-foreground">Pending orders</p>
                <p className="mt-1 text-sm text-muted-foreground"><span className="font-semibold tabular-nums text-primary">{summary.pendingOrders}</span> waiting</p>
              </div>
              <div className="rounded-[1.15rem] border border-border/70 bg-background/80 px-4 py-3">
                <p className="text-sm font-medium text-foreground">Catalog health</p>
                <p className="mt-1 text-sm text-muted-foreground"><span className="font-semibold tabular-nums text-primary">{summary.liveProducts}</span> live</p>
              </div>
              <div className="rounded-[1.15rem] border border-border/70 bg-background/80 px-4 py-3">
                <p className="text-sm font-medium text-foreground">Customer reach</p>
                <p className="mt-1 text-sm text-muted-foreground"><span className="font-semibold tabular-nums text-primary">{summary.totalCustomers}</span> customers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card flex flex-col gap-4 rounded-[1.5rem] border border-border/70 p-5 shadow-[0_24px_56px_-44px_color-mix(in_oklab,var(--color-primary)_24%,transparent)] md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-semibold text-foreground">Add a product</h2>
        </div>
        <Link href="/admin/products/add">
          <Button className="shadow-[0_20px_45px_-30px_color-mix(in_oklab,var(--color-primary)_45%,transparent)]">
            Add New Product
            <ArrowRight data-icon="inline-end" />
          </Button>
        </Link>
      </section>
    </div>
  );
}
