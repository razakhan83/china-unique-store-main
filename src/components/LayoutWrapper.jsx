import { Suspense } from 'react';
import Link from 'next/link';
import { ChevronRight, CreditCard, MapPin, Truck } from 'lucide-react';

import FacebookIcon from '@/components/icons/FacebookIcon';
import InstagramIcon from '@/components/icons/InstagramIcon';
import Navbar from '@/components/Navbar';
import StoreDeferredChrome from '@/components/StoreDeferredChrome';
import StoreLogo from '@/components/StoreLogo';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';
import { normalizeSocialUrl } from '@/lib/social';
import { createWhatsAppUrl } from '@/lib/whatsapp';

function NavbarFallback() {
  return <div className="sticky top-0 z-40 h-[100px] bg-card" aria-hidden="true" />;
}

export default function LayoutWrapper({ children, categories, settings }) {
  const whatsappLink = createWhatsAppUrl(settings.whatsappNumber);
  const facebookUrl = normalizeSocialUrl(settings.facebookPageUrl);
  const instagramUrl = normalizeSocialUrl(settings.instagramUrl);
  const socialLinks = [
    { href: facebookUrl, label: 'Facebook', icon: FacebookIcon },
    { href: instagramUrl, label: 'Instagram', icon: InstagramIcon },
    { href: whatsappLink, label: 'WhatsApp', icon: WhatsAppIcon },
  ];

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

        <main className="flex-grow">{children}</main>

        <footer className="mt-auto border-t border-border bg-primary pb-[calc(env(safe-area-inset-bottom)+var(--mobile-bottom-nav-offset))] pt-12 text-primary-foreground md:pb-6">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div>
                <StoreLogo
                  storeName={settings.storeName}
                  lightLogoUrl={settings.lightLogoUrl}
                  darkLogoUrl={settings.darkLogoUrl}
                  logoScalePercent={settings.logoScalePercent}
                  variant="dark-surface"
                  compact
                  className="mb-4"
                />
                <p className="max-w-sm leading-relaxed text-primary-foreground/76">
                  A premium destination for kitchenware, home decor, and lifestyle pieces chosen for everyday elegance.
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
                      className={`inline-flex size-10 items-center justify-center rounded-lg border border-white/10 bg-white/8 transition-[transform,border-color,background-color,color,opacity] duration-300 ${
                        href ? 'hover:-translate-y-1 hover:border-white/20 hover:bg-white/14 hover:text-white' : 'cursor-not-allowed opacity-45'
                      }`}
                    >
                      <Icon className={label === 'WhatsApp' ? 'size-5' : 'size-4'} />
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">Quick Links</h3>
                <ul className="flex flex-col gap-3 text-primary-foreground/78">
                  {[
                    { href: '/about-us', label: 'About Us' },
                    { href: '/refund-policy', label: 'Refund Policy' },
                    { href: '/privacy-policy', label: 'Privacy Policy' },
                    { href: '/shipping-policy', label: 'Shipping Policy' },
                  ].map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="inline-flex items-center gap-2 transition-colors hover:text-primary-foreground">
                        <ChevronRight className="size-4" />
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">Contact</h3>
                <ul className="flex flex-col gap-4 text-primary-foreground/78">
                  <li className="flex items-start gap-3">
                    <WhatsAppIcon className="mt-1 size-4 shrink-0" />
                    <div>
                      <span className="block font-semibold text-primary-foreground">WhatsApp</span>
                      <a href={whatsappLink || '#'} className="transition-colors hover:text-primary-foreground">
                        {settings.whatsappNumber}
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <MapPin className="mt-0.5 size-4" />
                    <div>
                      <span className="block font-semibold text-primary-foreground">Location</span>
                      <span>Karachi, Pakistan</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Truck className="mt-0.5 size-4" />
                    <div>
                      <span className="block font-semibold text-primary-foreground">Delivery</span>
                      <span>Nationwide shipping and order support via WhatsApp</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-primary-foreground/60 md:flex-row">
              <p>&copy; China Unique Store. All rights reserved.</p>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2">
                  <CreditCard className="size-4" />
                  Secure checkout
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
      <StoreDeferredChrome whatsappNumber={settings.whatsappNumber} storeName={settings.storeName} />
    </>
  );
}
