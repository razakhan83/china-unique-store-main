'use client';

import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';

export default function FooterNewsletter() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubscribed(true);
      toast.success('Thank you for subscribing!');
      setEmail('');
    }, 300);
  };

  return (
    <div className="mb-10 rounded-2xl border border-border bg-card p-4 sm:p-8">
      <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:gap-8">
        {/* Left Side: Text & Form */}
        <div className="flex-1 max-w-lg text-center md:text-left">
          <h2 className="text-sm min-[360px]:text-[15px] min-[400px]:text-base sm:text-xl md:text-2xl font-bold text-foreground tracking-tight whitespace-nowrap sm:whitespace-normal">
            Subscribe for discounts &amp; new arrivals
          </h2>
          
          <p className="mt-1 text-[11px] min-[360px]:text-xs sm:text-sm text-muted-foreground whitespace-nowrap sm:whitespace-normal">
            Get updates on special discounts, offers, and new products.
          </p>

          {isSubscribed ? (
            <div className="mt-4 inline-block rounded-lg bg-muted px-4 py-2 text-xs sm:text-sm font-semibold text-foreground">
              Thank you for subscribing!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col sm:flex-row items-center gap-2 max-w-md mx-auto md:mx-0">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                disabled={isLoading}
                className="h-10 w-full rounded-xl border border-border bg-background px-3.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="h-10 px-5 w-full sm:w-auto rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs sm:text-sm shadow-none transition-all active:scale-[0.98] shrink-0 cursor-pointer"
              >
                {isLoading ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
          )}
        </div>

        {/* Right Side: Illustration */}
        <div className="shrink-0 flex items-center justify-center select-none">
          <Image
            src="/undraw_subscribe_w8sz.svg"
            alt="Subscribe"
            width={160}
            height={110}
            className="h-auto w-[120px] sm:w-[150px] object-contain"
          />
        </div>
      </div>
    </div>
  );
}
