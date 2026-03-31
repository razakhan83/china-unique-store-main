'use client';

import { usePathname } from 'next/navigation';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';
import { createWhatsAppUrl } from '@/lib/whatsapp';

export default function FloatingWhatsApp({ whatsappNumber = '', storeName = 'China Unique Store' }) {
    const pathname = usePathname();
    const whatsappUrl = createWhatsAppUrl(whatsappNumber, `Hello ${storeName}!`);

    // Hide on product detail pages and checkout to avoid duplicate buttons
    if ((pathname?.startsWith('/products/') && pathname !== '/products') || pathname?.startsWith('/product/') || pathname === '/checkout') {
        return null;
    }

    if (!whatsappUrl) {
        return null;
    }

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-float fixed bottom-8 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-xl border border-success/20 bg-success text-success-foreground shadow-[0_18px_45px_rgba(28,142,95,0.28)] transition-transform duration-300 hover:-translate-y-1"
            aria-label="Contact us on WhatsApp"
        >
            <WhatsAppIcon className="size-6" />
        </a>
    );
}
