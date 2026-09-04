import { Suspense } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { getMetadataBase } from "@/lib/siteUrl";
import AuthProvider from "@/components/AuthProvider";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

import VisitorTracker from "@/components/VisitorTracker";


const fontSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const socialPreviewAlt = 'China Unique Store social preview image';

export const metadata = {
  metadataBase: getMetadataBase(),
  applicationName: 'China Unique Store',
  title: {
    default: 'China Unique Store | Premium Kitchenware & Lifestyle Products in Pakistan',
    template: '%s | China Unique Store',
  },
  description: 'Shop premium kitchenware, innovative home decor, gadgets, and lifestyle essentials at China Unique Store Pakistan. Fast delivery across Pakistan with Cash on Delivery.',
  keywords: [
    'China Unique Store',
    'China Unique Items',
    'Kitchenware Pakistan',
    'Home Decor Pakistan',
    'Kitchen Gadgets',
    'Online Shopping Pakistan',
    'Cash on Delivery',
    'Aam Samaan',
  ],
  authors: [{ name: 'China Unique Store', url: 'https://www.chinauniquestore.com' }],
  creator: 'China Unique Store',
  publisher: 'China Unique Store',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/Chaina-Store-fav-icon.png?v=3', sizes: '192x192', type: 'image/png' },
      { url: '/favicon.ico?v=3' },
    ],
    shortcut: '/Chaina-Store-fav-icon.png?v=3',
    apple: [
      { url: '/Chaina-Store-fav-icon.png?v=3', sizes: '180x180', type: 'image/png' },
    ],
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'China Unique Store | Premium Kitchenware & Lifestyle Products in Pakistan',
    description: 'Shop premium kitchenware, innovative home decor, gadgets, and lifestyle essentials at China Unique Store Pakistan. Fast delivery across Pakistan with Cash on Delivery.',
    type: 'website',
    url: 'https://www.chinauniquestore.com',
    siteName: 'China Unique Store',
    locale: 'en_PK',
    images: [
      {
        url: 'https://www.chinauniquestore.com/opengraph-image.png',
        secureUrl: 'https://www.chinauniquestore.com/opengraph-image.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: socialPreviewAlt,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'China Unique Store | Premium Kitchenware & Lifestyle Products in Pakistan',
    description: 'Shop premium kitchenware, innovative home decor, gadgets, and lifestyle essentials at China Unique Store Pakistan. Fast delivery across Pakistan with Cash on Delivery.',
    images: [
      {
        url: 'https://www.chinauniquestore.com/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: socialPreviewAlt,
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#064e3b',
};

export default function RootLayout({ children }) {
  const siteUrl = 'https://www.chinauniquestore.com';
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'OnlineStore',
        '@id': `${siteUrl}/#organization`,
        name: 'China Unique Store',
        url: siteUrl,
        logo: `${siteUrl}/Chaina-Store-fav-icon.png`,
        description:
          'Shop premium kitchenware, innovative home decor, gadgets, and lifestyle essentials at China Unique Store Pakistan with Cash on Delivery.',
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'PK',
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'China Unique Store',
        publisher: {
          '@id': `${siteUrl}/#organization`,
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteUrl}/products?search={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <html lang="en" className="bg-background" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${fontSans.variable} font-sans bg-background text-foreground antialiased`} suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <AuthProvider>
          {children}
          <VisitorTracker />
          <Toaster position="bottom-center" richColors />
          <ServiceWorkerRegister />
        </AuthProvider>
      </body>
    </html>
  );
}
