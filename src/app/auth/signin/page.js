import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Star, Utensils, Gamepad2, ChefHat, Sparkles, Coffee, Gift, Rocket, Heart, Moon, Sun, Cloud, Music, Camera, ShoppingBag, Home, CheckCircle2, Truck, Tag, Heart as HeartIcon, X } from 'lucide-react';
import { Suspense } from 'react';

import StoreLogo from '@/components/StoreLogo';
import { getStoreSettings } from '@/lib/data';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import SignInFormClient from './SignInFormClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const metadata = {
  title: 'Sign In',
};

export default async function SignInPage() {
  const settings = await getStoreSettings();

  return (
    <>
      {/* ========================================= */}
      {/* MOBILE LAYOUT (Hidden on Desktop) */}
      {/* ========================================= */}
      <div className="lg:hidden relative flex min-h-[100dvh] w-full flex-col bg-[#006B5F] overflow-hidden">
        
        {/* Top Header Section */}
        <div className="relative flex flex-col justify-end pt-12 pb-12 px-8 shrink-0 text-white min-h-[25dvh] overflow-hidden">
            
            {/* Background Vector Doodles */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.04] overflow-hidden">
               {/* Grid 1 - Top Row */}
               <Star className="absolute top-2 left-4 size-10 -rotate-12" />
               <Cloud className="absolute top-6 left-[30%] size-10 rotate-6" />
               <Sun className="absolute top-2 right-[35%] size-9 rotate-[20deg]" />
               <ChefHat className="absolute top-3 right-6 size-12 rotate-12" />
               
               {/* Grid 2 - Middle-Top Row */}
               <Music className="absolute top-20 left-12 size-8 rotate-[-15deg]" />
               <Utensils className="absolute top-24 left-[45%] size-8 rotate-12" />
               <Gamepad2 className="absolute top-20 right-[15%] size-10 rotate-[-20deg]" />
               
               {/* Grid 3 - Middle-Bottom Row */}
               <Sparkles className="absolute top-[140px] left-8 size-8 rotate-45" />
               <Camera className="absolute top-[130px] left-[35%] size-9 rotate-[-15deg]" />
               <Heart className="absolute top-[150px] right-[40%] size-6 rotate-45" />
               <Gift className="absolute top-[130px] right-8 size-10 rotate-12" />
               
               {/* Grid 4 - Bottom Row (near edges) */}
               <Coffee className="absolute top-[200px] left-[20%] size-10 -rotate-12" />
               <Home className="absolute top-[210px] left-[55%] size-10 -rotate-6" />
               <ShoppingBag className="absolute top-[190px] right-6 size-9 rotate-[10deg]" />
               
               {/* Spillage */}
               <Moon className="absolute top-[250px] right-[25%] size-8 -rotate-[30deg]" />
               <Rocket className="absolute top-[260px] left-[5%] size-10 rotate-45" />
            </div>

            {/* Back Button */}
            <div className="absolute top-6 left-6 z-20">
              <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-white/90 transition-colors hover:text-white">
                <ArrowLeft className="size-6 drop-shadow-md" />
              </Link>
            </div>
            
            {/* Animated Hello Section */}
            <div className="relative z-10 font-sans mt-auto animate-in fade-in slide-in-from-left-8 duration-700">
               <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-1 drop-shadow-sm">Hello!</h1>
               <p className="text-white/95 text-base sm:text-lg font-medium drop-shadow-sm">Welcome to {settings.storeName || 'our store'}</p>
            </div>
        </div>

        {/* Bottom Card Section (Animated) */}
        <div className="relative flex-1 bg-[#F8F9FA] rounded-t-[32px] sm:rounded-t-[40px] px-6 pt-10 pb-6 flex flex-col mt-[-24px] shadow-[0_-8px_30px_rgba(0,0,0,0.1)] z-20 animate-in slide-in-from-bottom-12 fade-in duration-500">
          <div className="mx-auto w-full max-w-sm flex flex-col flex-1">
              <div className="mb-10 text-left">
                 <h2 className="text-3xl font-bold text-[#006B5F] mb-2">Login</h2>
                 <p className="text-gray-500 text-sm">Sign in to securely access your account.</p>
              </div>

              <div className="flex flex-col gap-4">
                 <GoogleSignInButton callbackUrl="/" className="h-14 rounded-2xl text-base bg-white ring-1 ring-inset ring-gray-300 hover:ring-gray-400 hover:bg-gray-50 border-0" />
              </div>

              <div className="text-center text-[14px] font-medium mt-6">
                <Dialog>
                  <DialogTrigger className="text-gray-500 hover:text-[#006B5F] transition-colors inline-flex items-center gap-2 group">
                    <Sparkles className="size-4 text-[#006B5F] group-hover:animate-pulse" />
                    <span>Why should I sign in?</span>
                  </DialogTrigger>
                  <DialogContent className="max-w-[90vw] sm:max-w-md rounded-2xl p-6 border-0 shadow-xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl sm:text-2xl font-bold text-[#006B5F] mb-4 text-left pr-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        Benefits of Signing In
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-5 mt-2">
                      
                      <div className="flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[100ms] fill-mode-both">
                        <div className="flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="size-5 text-[#006B5F]" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-semibold text-foreground">Fast & Easy Checkout</h4>
                          <p className="text-sm text-muted-foreground mt-1">Save your delivery details for a seamless one-tap checkout experience.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[200ms] fill-mode-both">
                        <div className="flex items-center justify-center shrink-0 mt-0.5">
                          <Truck className="size-5 text-[#006B5F]" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-semibold text-foreground">Track Orders Easily</h4>
                          <p className="text-sm text-muted-foreground mt-1">View your order history and track the status of your current deliveries anytime.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[300ms] fill-mode-both">
                        <div className="flex items-center justify-center shrink-0 mt-0.5">
                          <Tag className="size-5 text-[#006B5F]" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-semibold text-foreground">Exclusive Discounts</h4>
                          <p className="text-sm text-muted-foreground mt-1">Get access to member-only offers, personalized deals, and early sales.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[400ms] fill-mode-both">
                        <div className="flex items-center justify-center shrink-0 mt-0.5">
                          <HeartIcon className="size-5 text-[#006B5F]" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-semibold text-foreground">Save Your Favorites</h4>
                          <p className="text-sm text-muted-foreground mt-1">Create a wishlist of your favorite products to easily find and buy them later.</p>
                        </div>
                      </div>

                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Vector Image for Mobile */}
              <div className="flex-1 flex items-center justify-center mt-8 mb-4 min-h-0 animate-in fade-in zoom-in-95 duration-700 delay-300 fill-mode-both">
                  <Image 
                    src="/Tablet login-bro.svg" 
                    alt="Login Illustration" 
                    width={280}
                    height={220}
                    className="w-full max-w-[250px] h-auto object-contain opacity-90 mix-blend-multiply"
                    priority
                  />
              </div>
          </div>

          {/* Privacy Policy and Terms of Service */}
          <div className="mt-auto pt-6 text-center flex items-center justify-center gap-3 text-[12px] text-muted-foreground w-full">
              <Link href="/terms-of-service" className="hover:text-[#006B5F] transition-colors hover:underline underline-offset-2">
                Terms & Conditions
              </Link>
              <span className="size-1 rounded-full bg-gray-300"></span>
              <Link href="/privacy-policy" className="hover:text-[#006B5F] transition-colors hover:underline underline-offset-2">
                Privacy Policy
              </Link>
          </div>
        </div>
      </div>


      {/* ========================================= */}
      {/* DESKTOP LAYOUT (Hidden on Mobile) */}
      {/* ========================================= */}
      <div className="hidden lg:flex relative h-[100dvh] w-full flex-col items-center justify-center bg-muted/10 p-0 sm:p-4 lg:p-8 overflow-hidden">
        {/* Background Doodle / Pattern */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
          <div className="absolute h-full w-full bg-[radial-gradient(#00000030_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff20_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_50%,transparent_100%)]"></div>
        </div>

        <div className="relative z-10 mx-auto flex w-full h-full max-h-[100dvh] sm:max-h-[700px] flex-col overflow-hidden sm:rounded-2xl border-x-0 border-y sm:border border-border bg-background lg:flex-row lg:max-w-[1200px] lg:h-[700px] lg:rounded-2xl shadow-xl">
          
          {/* PC: Left - SVG Image */}
          <div className="relative flex w-full shrink-0 flex-col items-center justify-center bg-primary/5 p-4 sm:p-6 lg:w-1/2 lg:p-16">
            
            {/* Back Button Inside Card */}
            <div className="absolute top-4 left-4 lg:top-8 lg:left-8 z-20">
              <Link href="/" className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" />
                Back
              </Link>
            </div>

            <div className="relative z-10 flex w-full flex-col items-center text-center">
              <div className="mb-8">
                 <StoreLogo
                    storeName={settings.storeName}
                    lightLogoUrl={settings.lightLogoUrl}
                    darkLogoUrl={settings.darkLogoUrl}
                    logoScalePercent={settings.logoScalePercent}
                    variant="dark-surface"
                  />
              </div>
              
              <div className="w-full max-w-[180px] mt-1 sm:max-w-[220px] lg:mt-12 lg:max-w-[440px]">
                <Image 
                  src="/Tablet login-bro.svg" 
                  alt="Login Illustration" 
                  width={500}
                  height={500}
                  className="mx-auto w-full object-contain mix-blend-multiply dark:mix-blend-normal"
                  priority
                />
              </div>
            </div>
          </div>

          {/* PC: Right - Form Data */}
          <div className="flex w-full flex-1 flex-col justify-start pt-6 sm:pt-8 sm:justify-center overflow-hidden p-4 sm:p-8 lg:w-1/2 lg:p-20">
            <div className="mx-auto w-full max-w-[380px]">
              <div className="mb-2 sm:mb-8 flex flex-col items-center justify-center text-center lg:items-start lg:text-left">
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl xl:text-5xl">Sign In</h1>
                <p className="mt-0.5 text-[10px] text-foreground/70 sm:text-sm lg:mt-3 lg:text-base">
                  Enter your details to access your account.
                </p>
              </div>

              <Suspense fallback={
                <div className="flex flex-col gap-3 sm:gap-4 lg:gap-5">
                  <div className="h-12 sm:h-14 lg:h-14 w-full animate-pulse rounded-md bg-muted/60" />
                  <div className="h-12 sm:h-14 lg:h-14 w-full animate-pulse rounded-md bg-muted/60" />
                  <div className="h-12 sm:h-14 lg:h-14 w-full animate-pulse rounded-md bg-muted/80 mt-2 sm:mt-4 lg:mt-4" />
                </div>
              }>
                <SignInFormClient />
              </Suspense>

              <div className="relative mb-2 mt-2 sm:mb-6 sm:mt-6 lg:mb-8 lg:mt-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-[9px] uppercase tracking-wider sm:text-xs">
                  <span className="bg-background px-2 sm:px-3 text-foreground/70 font-medium lg:px-4">OR</span>
                </div>
              </div>

              <GoogleSignInButton callbackUrl="/" className="h-10 text-xs sm:h-14 sm:text-base bg-white ring-1 ring-inset ring-gray-300 hover:ring-gray-400 hover:bg-gray-50 border-0" />

              <p className="mt-3 sm:mt-8 lg:mt-10 text-center text-[9px] sm:text-[11px] text-foreground/70 leading-relaxed lg:text-sm whitespace-nowrap">
                By continuing, you agree to our{' '}
                <Link href="/privacy-policy" className="font-medium underline underline-offset-4 hover:text-foreground transition-colors">Terms of Service</Link>{' '}
                and{' '}
                <Link href="/privacy-policy" className="font-medium underline underline-offset-4 hover:text-foreground transition-colors">Privacy Policy</Link>.
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
