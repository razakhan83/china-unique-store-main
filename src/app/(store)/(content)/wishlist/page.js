import { Suspense } from 'react';
import { connection } from 'next/server';
import WishlistClient from './WishlistClient';

export const metadata = {
  title: 'My Wishlist | China Unique',
  description: 'Review your saved products and add them to cart anytime.',
};

export default function WishlistPage() {
  return (
    <main className="min-h-screen bg-background pb-16 pt-8">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Wishlist</h1>
          <p className="mt-2 text-muted-foreground">Saved picks ready to revisit or add straight to your cart.</p>
        </div>
        <Suspense fallback={<div className="h-96 w-full animate-pulse rounded-xl bg-muted" />}>
          <WishlistContent />
        </Suspense>
      </div>
    </main>
  );
}

async function WishlistContent() {
  await connection();
  return <WishlistClient />;
}
