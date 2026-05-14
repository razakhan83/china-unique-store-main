import { Geist, Geist_Mono } from "next/font/google";
import { headers } from 'next/headers';
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { getSiteUrlFromHeaders } from "@/lib/siteUrl";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const socialPreviewAlt = 'China Unique Store social preview image';

export async function generateMetadata() {
  const siteUrl = getSiteUrlFromHeaders(await headers());

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: 'China Unique Store',
      template: '%s | China Unique Store',
    },
    description: 'Premium kitchenware, home decor, and lifestyle products for modern Pakistani homes.',
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title: 'China Unique Store',
      description: 'Premium kitchenware, home decor, and lifestyle products for modern Pakistani homes.',
      type: 'website',
      url: '/',
      siteName: 'China Unique Store',
      images: [
        {
          url: '/opengraph-image.png',
          width: 1200,
          height: 630,
          alt: socialPreviewAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'China Unique Store',
      description: 'Premium kitchenware, home decor, and lifestyle products for modern Pakistani homes.',
      images: [
        {
          url: '/opengraph-image.png',
          alt: socialPreviewAlt,
        },
      ],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <meta name="google" content="notranslate" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        {children}
        <Toaster position="bottom-center" richColors />
      </body>
    </html>
  );
}
