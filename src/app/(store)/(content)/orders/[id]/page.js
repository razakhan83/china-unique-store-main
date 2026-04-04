import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { getServerSession } from 'next-auth';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

import { authOptions } from '@/lib/auth';
import mongooseConnect from '@/lib/mongooseConnect';
import Order from '@/models/Order';
import OrderDetailsClient from './OrderDetailsClient';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Order Details | China Unique',
  description: 'View your order status and invoice.',
};

export default async function SingleOrderPage({ params, searchParams }) {
  await connection();
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const { id } = resolvedParams;
  const { token } = resolvedSearchParams;

  await mongooseConnect();
  
  // 1. Fetch Order
  const orderDoc = await Order.findById(id).lean();
  
  if (!orderDoc) {
    redirect('/orders');
  }

  const order = JSON.parse(JSON.stringify(orderDoc));
  const session = await getServerSession(authOptions);

  // 2. Security Check (Magic Link vs Session)
  const isAuthorizedViaToken = token && order.secureToken === token;
  const isAuthorizedViaSession = session?.user?.email && order.customerEmail === session.user.email;

  if (!isAuthorizedViaToken && !isAuthorizedViaSession) {
    // If neither authorized, force login
    redirect('/api/auth/signin?callbackUrl=/orders/' + id);
  }

  return (
    <main className="min-h-screen bg-background pb-20 pt-12">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link 
              href="/orders" 
              className="group mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
              Back to My Orders
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Order Status</h1>
            <p className="mt-2 text-muted-foreground">Manage your shipment and download your invoice below.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <Button variant="outline" asChild>
                <Link href="/">Continue Shopping</Link>
             </Button>
          </div>
        </div>

        <OrderDetailsClient order={order} />
        
        {!session && (
          <div className="mt-8 rounded-xl border border-accent/25 bg-accent/12 p-6 text-center">
            <p className="text-sm font-medium text-accent-foreground">
              Viewing as Guest. <Link href="/api/auth/signin" className="font-bold underline hover:text-foreground">Sign in</Link> to save this order to your account permanently.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
