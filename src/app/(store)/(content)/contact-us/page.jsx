import { getStoreSettings } from '@/lib/data';
import { createWhatsAppUrl } from '@/lib/whatsapp';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';
import InstagramIcon from '@/components/icons/InstagramIcon';
import FacebookIcon from '@/components/icons/FacebookIcon';
import { Phone, Mail, MapPin, Clock, ChevronRight, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Contact Us | China Unique',
  description: 'Contact China Unique customer support on WhatsApp, Phone, or Email for order assistance and inquiries.',
};

export default async function ContactUsPage() {
  const settings = await getStoreSettings();

  const storeName = settings.storeName || 'China Unique Store';
  const whatsappNumber = settings.whatsappNumber || '03052622043';
  const cleanPhone = whatsappNumber.replace(/[^0-9+]/g, '');
  const whatsappUrl = createWhatsAppUrl(whatsappNumber, `Hello ${storeName}, I need assistance with an order/product.`);
  const supportEmail = settings.supportEmail || 'support@chinaunique.pk';
  const businessAddress = settings.businessAddress || 'Shop No B-41, Gul Tijarah Mall, Karachi, Pakistan';

  let instagramUrl = settings.instagramUrl || 'https://instagram.com';
  let instagramHandle = '@chinauniquestore';
  if (instagramUrl.includes('instagram.com/')) {
    const handle = instagramUrl.split('instagram.com/')[1]?.replace(/\/$/, '');
    if (handle) instagramHandle = `@${handle}`;
  }

  let facebookUrl = settings.facebookPageUrl || 'https://facebook.com';

  return (
    <div className="min-h-screen bg-background pb-24 pt-6 sm:pt-10">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6">
        
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="size-3 text-muted-foreground/60" />
          <span className="text-foreground font-medium">Contact Us</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Contact Us
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">
            Have questions about products, delivery, or an existing order? Get in touch with our team directly.
          </p>
        </div>

        {/* WhatsApp Featured Row - Clean Box (No Gradient Tint) */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <WhatsAppIcon className="size-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-foreground">WhatsApp Hotline</h2>
                <span className="size-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-sm font-bold text-foreground font-mono mt-0.5">
                {whatsappNumber}
              </p>
            </div>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <WhatsAppIcon className="size-4" />
            Chat on WhatsApp
          </a>
        </div>

        {/* Channels Grid (Phone, Email, Instagram, Facebook) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          
          {/* Phone Call */}
          <a
            href={`tel:${cleanPhone}`}
            className="p-5 rounded-2xl border border-border bg-card hover:border-foreground/30 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="size-10 rounded-xl bg-muted flex items-center justify-center text-foreground shrink-0 group-hover:bg-foreground group-hover:text-background transition-colors">
                <Phone className="size-4.5" />
              </div>
              <div>
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Direct Call</span>
                <span className="text-sm font-bold text-foreground font-mono mt-0.5 block">{whatsappNumber}</span>
              </div>
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </a>

          {/* Email */}
          <a
            href={`mailto:${supportEmail}`}
            className="p-5 rounded-2xl border border-border bg-card hover:border-foreground/30 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="size-10 rounded-xl bg-muted flex items-center justify-center text-foreground shrink-0 group-hover:bg-foreground group-hover:text-background transition-colors">
                <Mail className="size-4.5" />
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</span>
                <span className="text-sm font-bold text-foreground truncate mt-0.5 block">{supportEmail}</span>
              </div>
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
          </a>

          {/* Instagram */}
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 rounded-2xl border border-border bg-card hover:border-foreground/30 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="size-10 rounded-xl bg-muted flex items-center justify-center text-foreground shrink-0 group-hover:bg-foreground group-hover:text-background transition-colors">
                <InstagramIcon className="size-4.5" />
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Instagram</span>
                <span className="text-sm font-bold text-foreground truncate mt-0.5 block">{instagramHandle}</span>
              </div>
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
          </a>

          {/* Facebook */}
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 rounded-2xl border border-border bg-card hover:border-foreground/30 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="size-10 rounded-xl bg-muted flex items-center justify-center text-foreground shrink-0 group-hover:bg-foreground group-hover:text-background transition-colors">
                <FacebookIcon className="size-4.5" />
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Facebook</span>
                <span className="text-sm font-bold text-foreground truncate mt-0.5 block">{storeName}</span>
              </div>
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
          </a>

        </div>

        {/* Store Location & Timings */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-3.5">
            <div className="size-10 rounded-xl bg-muted flex items-center justify-center text-foreground shrink-0 mt-0.5">
              <MapPin className="size-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Store Location</span>
              <p className="text-sm font-medium text-foreground mt-0.5">{businessAddress}</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 md:border-l md:border-border md:pl-6">
            <div className="size-10 rounded-xl bg-muted flex items-center justify-center text-foreground shrink-0 mt-0.5">
              <Clock className="size-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Working Hours</span>
              <p className="text-sm font-medium text-foreground mt-0.5">Mon – Sat: 10:00 AM – 9:00 PM</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
