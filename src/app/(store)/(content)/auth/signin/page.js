import { LockKeyhole, Store } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import GoogleSignInButton from '@/components/GoogleSignInButton';

export default function SignInPage() {
  return (
    <section className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md text-center sm:p-2">
        <CardContent className="p-8 sm:p-10">
        <div className="mx-auto mb-6 flex size-18 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Store className="size-8" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Admin Access</h2>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">Secure login for China Unique Store management.</p>

        <div className="mt-8">
          <GoogleSignInButton callbackUrl="/" />
        </div>

        <div className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <LockKeyhole className="size-3.5" />
          Authorized personnel only
        </div>
        </CardContent>
      </Card>
    </section>
  );
}
