import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Suspense } from 'react';

import StoreLogo from '@/components/StoreLogo';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { getStoreSettings } from '@/lib/data';
import SignInFormClient from './SignInFormClient';

export const metadata = {
  title: 'Sign In',
};

export default async function SignInPage() {
  const settings = await getStoreSettings();

  return (
    <div className="relative flex min-h-screen flex-col w-full items-center justify-center bg-muted/10 p-4 lg:p-8">
      <div className="w-full max-w-[1200px] mb-4 flex lg:absolute lg:left-8 lg:top-8 lg:mb-0 lg:w-auto">
        <Link href="/" className="z-50 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to Store
        </Link>
      </div>

      <div className="relative mx-auto flex w-full max-w-[1200px] overflow-hidden rounded-2xl border border-border bg-background shadow-xl sm:shadow-2xl lg:min-h-[700px] lg:rounded-[2.5rem]">
        {/* Left Side: Illustration */}
        <div className="relative hidden w-1/2 flex-col items-center justify-center bg-primary/5 p-16 lg:flex">
          <div className="relative z-10 flex flex-col items-center max-w-md text-center">
            <div className="mb-10">
               <StoreLogo
                  storeName={settings.storeName}
                  lightLogoUrl={settings.lightLogoUrl}
                  darkLogoUrl={settings.darkLogoUrl}
                  logoScalePercent={settings.logoScalePercent}
                  variant="dark-surface"
                />
            </div>
            
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h2>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              Sign in to access your orders, saved items, and a personalized shopping experience tailored just for you.
            </p>
            
            <div className="mt-12 w-full max-w-[400px]">
              <Image 
                src="/Tablet login-bro.svg" 
                alt="Login Illustration" 
                width={400} 
                height={400}
                className="mx-auto w-full object-contain mix-blend-multiply dark:mix-blend-normal"
                priority
              />
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="flex w-full flex-col justify-center p-8 sm:p-12 lg:w-1/2 lg:p-20">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-12 flex justify-center lg:hidden">
              <StoreLogo
                  storeName={settings.storeName}
                  lightLogoUrl={settings.lightLogoUrl}
                  darkLogoUrl={settings.darkLogoUrl}
                  logoScalePercent={settings.logoScalePercent}
                  variant="dark-surface"
                />
            </div>

            <div className="mb-10">
              <h1 className="text-4xl font-bold tracking-tight text-foreground lg:text-5xl">Sign In</h1>
              <p className="mt-3 text-base text-muted-foreground">
                Enter your email and password to securely access your account.
              </p>
            </div>

            <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-muted/50" />}>
              <SignInFormClient />
            </Suspense>

            <div className="relative mb-8 mt-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="bg-background px-4 text-muted-foreground font-medium">Or continue with</span>
              </div>
            </div>

            <GoogleSignInButton callbackUrl="/" className="h-14 text-base" />

            <p className="mt-10 text-center text-sm text-muted-foreground leading-relaxed">
              By clicking continue, you agree to our{' '}
              <Link href="/privacy-policy" className="font-medium underline underline-offset-4 hover:text-foreground transition-colors">Terms of Service</Link>{' '}
              and{' '}
              <Link href="/privacy-policy" className="font-medium underline underline-offset-4 hover:text-foreground transition-colors">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
