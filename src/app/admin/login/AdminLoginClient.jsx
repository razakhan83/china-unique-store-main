"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AdminLoginClient({ guestModeEnabled = true }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Link href="/" className="absolute left-6 top-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" />
        Back to Store
      </Link>

      <div className="surface-card w-full max-w-[400px] rounded-xl p-8 text-center">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-xl border border-border bg-muted text-foreground">
          <ShieldCheck className="size-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Admin Login</h2>
        <p className="mt-2 text-sm text-muted-foreground">Use the authorized Google account to continue.</p>

        <div className="mt-8 flex flex-col gap-3">
          <Button className="w-full" size="lg" onClick={() => signIn('google', { callbackUrl: '/admin' })}>
            Continue with Google
          </Button>
          {guestModeEnabled && (
            <Button 
              variant="outline" 
              className="w-full bg-muted/50" 
              size="lg" 
              onClick={() => signIn('credentials', { isGuest: 'true', callbackUrl: '/admin' })}
            >
              Explore as Guest
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
