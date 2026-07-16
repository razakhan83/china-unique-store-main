import { Suspense } from 'react';
import Link from 'next/link';
import { BadgeCheck, ChevronRight, CreditCard, MapPin, RefreshCcw, ShieldCheck, Truck, Code } from 'lucide-react';

import FacebookIcon from '@/components/icons/FacebookIcon';
import InstagramIcon from '@/components/icons/InstagramIcon';
import Navbar from '@/components/Navbar';
import StoreDeferredChrome from '@/components/StoreDeferredChrome';
import StoreLogo from '@/components/StoreLogo';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';
import AnimatedStats from '@/components/AnimatedStats';
import TiltedProductMarquee from '@/components/TiltedProductMarquee';
import { normalizeSocialUrl } from '@/lib/social';
import { createWhatsAppUrl } from '@/lib/whatsapp';

function NavbarFallback() {
  return <div className="sticky top-0 z-40 h-[100px] bg-card" aria-hidden="true" />;
}

const TRUST_BADGES = [
  { icon: ShieldCheck, title: 'Secure Payment', sub: '100% encrypted checkout' },
  { icon: Truck, title: 'Fast Delivery', sub: 'Nationwide shipping' },
  { icon: RefreshCcw, title: 'Easy Returns', sub: 'Hassle-free process' },
  { icon: BadgeCheck, title: '100% Authentic', sub: 'Verified quality items' },
];

export default function LayoutWrapper({ children, categories, settings }) {
  const whatsappLink = createWhatsAppUrl(settings.whatsappNumber);
  const facebookUrl = normalizeSocialUrl(settings.facebookPageUrl);
  const instagramUrl = normalizeSocialUrl(settings.instagramUrl);
  const socialLinks = [
    { href: facebookUrl, label: 'Facebook', icon: FacebookIcon },
    { href: instagramUrl, label: 'Instagram', icon: InstagramIcon },
    { href: whatsappLink, label: 'WhatsApp', icon: WhatsAppIcon },
  ];
  const quickLinks = Array.isArray(settings.customPages)
    ? settings.customPages.filter((page) => page?.isEnabled !== false && page?.showInFooter !== false)
    : [];
  const hasAnnouncementBar = settings.announcementBarEnabled && 
    (settings.announcementBarText || (Array.isArray(settings.announcementBarMessages) && settings.announcementBarMessages.length > 0));

  return (
    <>
      <div className="flex min-h-screen flex-col bg-background">
        <Suspense fallback={<NavbarFallback />}>
          <Navbar
            categories={categories}
            storeName={settings.storeName}
            lightLogoUrl={settings.lightLogoUrl}
            darkLogoUrl={settings.darkLogoUrl}
            logoScalePercent={settings.logoScalePercent}
            announcementBarEnabled={settings.announcementBarEnabled}
            announcementBarText={settings.announcementBarText}
            announcementBarMessages={settings.announcementBarMessages}
          />
        </Suspense>

        <main>{children}</main>

        <AnimatedStats />

        {/* ── Wholesale CTA ── */}
        <div className="mt-auto border-t border-border bg-primary/5 px-4 py-14 sm:py-16 text-center">
          <div className="mx-auto max-w-3xl">
            <h3 className="mb-3 text-lg font-bold text-primary sm:text-xl">
              Are You a Wholesaler or Retailer?
            </h3>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Wholesale & Bulk Orders
            </h2>
            <p className="mb-8 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Looking to stock premium imported gadgets, kitchenware, and lifestyle products? We supply top-notch quality items at competitive wholesale rates. Connect with us directly for <span className="font-semibold text-primary">bulk orders</span> and <span className="font-semibold text-primary">exclusive B2B pricing</span>.
            </p>
            <a
              href={whatsappLink || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#25D366] px-8 py-3.5 text-base font-semibold text-white shadow-sm ring-1 ring-inset ring-white/20 transition-all duration-300 hover:-translate-y-1 hover:bg-[#22c15c] hover:shadow-[0_10px_20px_-5px_rgba(37,211,102,0.6)] active:scale-[0.97] active:bg-[#1da851] active:shadow-sm"
            >
              <WhatsAppIcon className="size-5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
              Chat on WhatsApp
            </a>
          </div>
        </div>

        <Suspense fallback={<div className="h-[700px] w-full bg-background" />}>
          <TiltedProductMarquee />
        </Suspense>

        <footer className="border-t border-border bg-card pb-[calc(env(safe-area-inset-bottom)+var(--mobile-bottom-nav-offset))] pt-12 text-foreground shadow-[0_-1px_0_color-mix(in_oklab,var(--color-border)_72%,white)] md:pb-6">
          <div className="container mx-auto max-w-7xl px-4">

            {/* ── Trust Badge Strip ── */}
            <div className="mb-10 grid grid-cols-2 gap-5 border-b border-border/60 pb-10 md:grid-cols-4 md:gap-6">
              {TRUST_BADGES.map(({ icon: Icon, title, sub }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Main Footer Columns ── */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div>
                <div className="mb-5 w-fit origin-left scale-110 sm:scale-125">
                  <StoreLogo
                    storeName={settings.storeName}
                    lightLogoUrl={settings.lightLogoUrl}
                    darkLogoUrl={settings.darkLogoUrl}
                    logoScalePercent={settings.logoScalePercent}
                    variant="light-surface"
                    compact
                  />
                </div>
                <p className="max-w-sm leading-relaxed text-muted-foreground">
                  {settings.storeDescription || 'A premium destination for kitchenware, home decor, and lifestyle pieces chosen for everyday elegance.'}
                </p>
                <div className="mt-5 flex gap-3">
                  {socialLinks.map(({ href, label, icon: Icon }) => (
                    <a
                      key={label}
                      href={href || undefined}
                      target={href ? '_blank' : undefined}
                      rel={href ? 'noopener noreferrer' : undefined}
                      aria-label={label}
                      aria-disabled={!href}
                      className={`inline-flex size-11 items-center justify-center rounded-lg border border-border/60 bg-background/80 text-muted-foreground transition-[transform,border-color,background-color,color,opacity] duration-300 ${
                        href ? 'hover:-translate-y-1 hover:border-primary/18 hover:bg-background hover:text-foreground' : 'cursor-not-allowed opacity-45'
                      }`}
                    >
                      <Icon className={label === 'WhatsApp' ? 'size-5' : 'size-4'} />
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Quick Links</h3>
                <ul className="flex flex-col gap-3 text-muted-foreground">
                  {quickLinks.length > 0 ? (
                    quickLinks.map((item) => (
                      <li key={item.slug}>
                        <Link href={`/${item.slug}`} className="inline-flex items-center gap-2 transition-colors hover:text-foreground">
                          <ChevronRight className="size-4" />
                          {item.label || item.title}
                        </Link>
                      </li>
                    ))
                  ) : (
                    <>
                      <li>
                        <Link href="/products" className="inline-flex items-center gap-2 transition-colors hover:text-foreground">
                          <ChevronRight className="size-4" />
                          All Products
                        </Link>
                      </li>
                      <li>
                        <Link href="/products?category=new-arrivals" className="inline-flex items-center gap-2 transition-colors hover:text-foreground">
                          <ChevronRight className="size-4" />
                          New Arrivals
                        </Link>
                      </li>
                      <li>
                        <Link href="/products?category=special-offers" className="inline-flex items-center gap-2 transition-colors hover:text-foreground">
                          <ChevronRight className="size-4" />
                          Special Offers
                        </Link>
                      </li>
                    </>
                  )}
                </ul>
              </div>
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Contact</h3>
                <ul className="flex flex-col gap-4 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <WhatsAppIcon className="mt-1 size-4 shrink-0" />
                    <div>
                      <span className="block font-semibold text-foreground">WhatsApp</span>
                      <a href={whatsappLink || '#'} className="transition-colors hover:text-foreground">
                        {settings.whatsappNumber}
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <MapPin className="mt-0.5 size-4" />
                    <div>
                      <span className="block font-semibold text-foreground">Location</span>
                      <span>{settings.businessAddress || 'Shop No B-41, Gul Tijarah Mall, Karachi, Pakistan'}</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Truck className="mt-0.5 size-4" />
                    <div>
                      <span className="block font-semibold text-foreground">Delivery</span>
                      <span>Nationwide shipping and order support via WhatsApp</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/80 pt-6 text-xs text-muted-foreground md:flex-row">
              <p>&copy; China Unique Store. All rights reserved.</p>
              <div className="flex items-center gap-3">
                <div className="group flex cursor-default items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm transition-all duration-300 group-hover:-rotate-6 group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-[0_0_15px_-3px_color-mix(in_oklab,var(--color-primary)_50%,transparent)]">
                    <Code className="size-5" />
                  </span>
                  <div className="flex flex-col items-start gap-1 leading-none">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground/60 transition-colors group-hover:text-muted-foreground/90">
                      Powered by
                    </span>
                    <span className="text-lg font-bold tracking-tight text-foreground transition-colors duration-300 group-hover:text-primary">
                      Ahmed Raza
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
      <StoreDeferredChrome whatsappNumber={settings.whatsappNumber} storeName={settings.storeName} hasAnnouncementBar={hasAnnouncementBar} />
    </>
  );
}
