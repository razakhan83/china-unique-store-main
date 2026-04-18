import { Geist, Geist_Mono } from "next/font/google";
import { cacheLife, cacheTag } from 'next/cache';
import "./globals.css";
import { getStoreSettings } from "@/lib/data";
import TrackingScripts from "@/components/TrackingScripts";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXTAUTH_URL || 'https://china-unique-items.vercel.app';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'China Unique Store',
    template: '%s | China Unique Store',
  },
  description: 'Premium kitchenware, home decor, and lifestyle products for modern Pakistani homes.',
  openGraph: {
    title: 'China Unique Store',
    description: 'Premium kitchenware, home decor, and lifestyle products for modern Pakistani homes.',
    type: 'website',
    url: siteUrl,
    siteName: 'China Unique Store',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({ children }) {
  'use cache';
  cacheLife('foreverish');
  cacheTag('settings');

  const settings = await getStoreSettings();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="google" content="notranslate" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        {children}
        <TrackingScripts
          enabled={settings.trackingEnabled === true}
          facebookPixelId={settings.facebookPixelId}
          tiktokPixelId={settings.tiktokPixelId}
        />
        <Toaster position="bottom-center" richColors />
      </body>
    </html>
  );
}
