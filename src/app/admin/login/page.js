import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, X } from 'lucide-react';
import { Suspense } from 'react';

import StoreLogo from '@/components/StoreLogo';
import { getStoreSettings } from '@/lib/data';
import AdminLoginFormClient from './AdminLoginFormClient';

export const metadata = {
  title: 'Admin Login',
};

export default async function AdminLoginPage() {
  const settings = await getStoreSettings();
  const guestModeEnabled = settings?.guestModeEnabled !== false;

  return (
    <div className="relative flex min-h-[100dvh] flex-col w-full items-center justify-center bg-muted/10 p-0 sm:p-4 lg:p-8">
      
      {/* Background Doodle / Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="absolute h-full w-full bg-[radial-gradient(#00000030_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff20_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_50%,transparent_100%)]"></div>
      </div>

      <div className="relative mx-auto flex w-full max-w-[1000px] flex-col overflow-hidden sm:rounded-2xl border-x-0 border-y sm:border border-border bg-background lg:flex-row lg:max-w-[1200px] lg:min-h-[700px] lg:rounded-[2.5rem] min-h-[100dvh] sm:min-h-[auto]">
        
        {/* Mobile: Top / PC: Left - SVG Image */}
        <div className="relative flex w-full flex-col items-center justify-center bg-primary/5 p-4 pt-16 sm:p-6 lg:w-1/2 lg:p-16">
          
          {/* Back Button Inside Card */}
          <div className="absolute top-4 left-4 lg:top-8 lg:left-8 z-20">
            <Link href="/" className="group inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-all duration-300 hover:text-foreground bg-background/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border shadow-sm hover:bg-background hover:shadow-md">
              <ArrowLeft className="size-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
              Back to Store
            </Link>
          </div>

          <div className="relative z-10 flex w-full flex-col items-center text-center">
            <div className="mb-4 lg:hidden">
              <StoreLogo
                  storeName={settings.storeName}
                  lightLogoUrl={settings.lightLogoUrl}
                  darkLogoUrl={settings.darkLogoUrl}
                  logoScalePercent={settings.logoScalePercent}
                  variant="dark-surface"
                />
            </div>
            
            <div className="hidden lg:block mb-8">
               <StoreLogo
                  storeName={settings.storeName}
                  lightLogoUrl={settings.lightLogoUrl}
                  darkLogoUrl={settings.darkLogoUrl}
                  logoScalePercent={settings.logoScalePercent}
                  variant="dark-surface"
                />
            </div>
            
            <h2 className="hidden text-2xl font-bold tracking-tight text-foreground lg:block lg:text-3xl xl:text-4xl">Store Management</h2>
            <p className="mt-4 hidden text-sm text-muted-foreground leading-relaxed lg:block lg:text-base">
              Securely log in to manage your inventory, process orders, and control your storefront.
            </p>
            
            <div className="w-full max-w-[160px] sm:max-w-[240px] lg:mt-12 lg:max-w-[480px]">
              <Image 
                src="/Work time-amico.svg" 
                alt="Admin Workspace Illustration" 
                width={500} 
                height={500}
                className="mx-auto w-full object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-700 hover:scale-105"
                priority
              />
            </div>
          </div>
        </div>

        {/* Mobile: Bottom / PC: Right - Form Data */}
        <div className="flex w-full flex-col justify-center p-5 sm:p-10 lg:w-1/2 lg:p-20">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-6 sm:mb-8 flex flex-col items-center justify-center text-center lg:items-start lg:text-left">
              <div className="mb-3 sm:mb-4 flex size-10 sm:size-12 lg:size-16 items-center justify-center rounded-2xl border border-border bg-muted text-foreground">
                <ShieldCheck className="size-5 sm:size-6 lg:size-8" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl xl:text-5xl">Admin Access</h1>
              <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm lg:mt-3 lg:text-base">
                Sign in with authorized credentials.
              </p>
            </div>

            <Suspense fallback={
              <div className="flex flex-col gap-3 sm:gap-4 lg:gap-5">
                <div className="h-12 sm:h-14 lg:h-14 w-full animate-pulse rounded-md bg-muted/60" />
                <div className="h-12 sm:h-14 lg:h-14 w-full animate-pulse rounded-md bg-muted/60" />
                <div className="h-12 sm:h-14 lg:h-14 w-full animate-pulse rounded-md bg-muted/80 mt-2 sm:mt-4 lg:mt-4" />
              </div>
            }>
              <AdminLoginFormClient guestModeEnabled={guestModeEnabled} />
            </Suspense>

            <p className="mt-6 sm:mt-8 lg:mt-10 flex items-center justify-center gap-1.5 sm:gap-2 text-center text-[10px] sm:text-[11px] font-medium text-muted-foreground lg:text-sm">
              <ShieldCheck className="size-3 sm:size-3.5 lg:size-4" />
              Authorized personnel only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
