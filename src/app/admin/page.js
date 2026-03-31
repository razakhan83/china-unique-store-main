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

export default async function AdminDashboardPage() {
  await requireAdmin();

  return <DashboardContent />;
}

async function DashboardContent() {
  const { summary, recentOrders } = await getAdminDashboardData();

  const stats = [
    { value: `${summary.totalOrders}`, change: `${summary.pendingOrders} pending orders` },
    { value: `Rs. ${summary.totalRevenue.toLocaleString('en-PK')}`, change: 'Store revenue to date' },
    { value: `${summary.totalProducts}`, change: `${summary.liveProducts} live in the catalog` },
    { value: `${summary.totalCustomers}`, change: 'Unique customers so far' },
  ];

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">A calm view of store activity, inventory, and next actions.</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsConfig.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="surface-card rounded-xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className={`flex size-11 items-center justify-center rounded-xl ${stat.tone}`}>
                  <Icon className="size-5" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <h3 className="mt-2 text-2xl font-bold text-foreground">{stats[index].value}</h3>
              <p className="mt-2 text-xs text-muted-foreground">{stats[index].change}</p>
            </div>
          );
        })}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="surface-card rounded-xl p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShoppingBag className="size-4" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Daily Stats</h2>
              <p className="text-sm text-muted-foreground">Confirmed orders recorded today.</p>
            </div>
          </div>
          <div className="flex h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 text-center">
            <p className="text-5xl font-black text-foreground">{summary.dailyConfirmedOrders}</p>
            <p className="mt-2 text-sm text-muted-foreground">Fresh count since midnight server time.</p>
          </div>
        </div>

        <div className="surface-card rounded-xl p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CircleDollarSign className="size-4" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Revenue Snapshot</h2>
              <p className="text-sm text-muted-foreground">Cash on delivery totals based on saved orders.</p>
            </div>
          </div>
          <div className="flex h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 text-center">
            <p className="text-4xl font-black text-foreground">Rs. {summary.totalRevenue.toLocaleString('en-PK')}</p>
            <p className="mt-2 text-sm text-muted-foreground">Keep growing the catalog to drive the next order.</p>
          </div>
        </div>

        <div className="surface-card rounded-xl p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Inbox className="size-4" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Recent Orders</h2>
              <p className="text-sm text-muted-foreground">Most recent customer activity in one place.</p>
            </div>
          </div>
          {recentOrders.length ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order._id} className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">{order.orderId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary">Rs. {order.totalAmount.toLocaleString('en-PK')}</p>
                      <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 text-center">
              <Inbox className="mb-3 size-8 text-muted-foreground" />
              <p className="font-medium text-foreground">No orders yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Once customers place orders, this panel becomes your quick overview.</p>
            </div>
          )}
        </div>
      </div>

      <div className="surface-card flex flex-col gap-4 rounded-xl p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-semibold text-foreground">Next step</h2>
          <p className="mt-1 text-sm text-muted-foreground">Add products to shape the catalog before the first order arrives.</p>
        </div>
        <Link href="/admin/products/add">
          <Button>
            Add New Product
            <ArrowRight data-icon="inline-end" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
