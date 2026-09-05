import { Suspense } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { getMetadataBase } from "@/lib/siteUrl";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE_DEFAULT } from "@/lib/siteSeo";
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
  applicationName: SITE_NAME,
  title: {
    default: SITE_TITLE_DEFAULT,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
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
      { url: '/favicon.ico' },
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: SITE_TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
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
    title: SITE_TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
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
        name: SITE_NAME,
        url: siteUrl,
        logo: `${siteUrl}/favicon-192.png`,
        description: SITE_DESCRIPTION,
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
