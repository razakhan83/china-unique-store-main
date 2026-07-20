'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, HelpCircle, Truck, Wallet, ShieldCheck, Sparkles, MessageSquare } from 'lucide-react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { HOME_FAQS } from '@/lib/faqs';

const ICON_MAP = {
  h1: Wallet,      // Cash on Delivery
  h2: Truck,       // Delivery time
  h3: HelpCircle,  // Parcel checking
  h4: ShieldCheck, // Replacement guarantee
  h5: Sparkles,    // Original quality
  h6: HelpCircle,  // Unique items usage
  h7: MessageSquare // Order cancellation
};

export default function HomeFaqSection() {
  return (
    <section className="relative overflow-hidden border-t border-border bg-background py-16 sm:py-24">
      {/* Decorative background mesh */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      
      <div className="container mx-auto max-w-4xl px-4 sm:px-6">
        
        {/* ── Centered Header Text Section ── */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <HelpCircle className="size-3.5" />
            Got Questions?
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            Have questions before buying? We have answered the most common questions about delivery, payments, and product checks below.
          </p>
        </div>

        {/* ── Mobile-only SVG Placement (centered, hidden on PC) ── */}
        <div className="flex justify-center lg:hidden my-6">
          <div className="relative max-w-[220px] sm:max-w-[260px] w-full">
            <Image
              src="/undraw_questions_52ic.svg"
              alt="FAQ Illustration Mobile"
              width={280}
              height={220}
              className="h-auto w-full select-none opacity-95"
              priority
            />
          </div>
        </div>

        {/* ── Centered Accordion Component (max-w-4xl on PC) ── */}
        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible="true" className="w-full space-y-3.5">
            {HOME_FAQS.map((faq) => {
              const IconComponent = ICON_MAP[faq.id] || HelpCircle;
              return (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className="rounded-xl border border-border/60 bg-card/65 px-4 py-1.5 transition-all duration-300 hover:border-primary/30 hover:bg-card/90 shadow-sm"
                >
                  <AccordionTrigger className="w-full py-3.5 hover:no-underline [&[data-state=open]]:text-primary transition-colors text-left text-sm sm:text-base font-semibold">
                    <div className="flex items-start gap-3.5 pr-4">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                        <IconComponent className="size-4" />
                      </div>
                      <span className="leading-snug">{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-4 text-xs sm:text-sm text-muted-foreground leading-relaxed pl-10 border-t border-border/30 mt-2">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>

        {/* ── Centered CTA Button ── */}
        <div className="mt-10 text-center">
          <Link
            href="/faq"
            className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-300 hover:bg-primary/90 hover:shadow-lg active:scale-[0.98]"
          >
            See All FAQs
            <ChevronRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </div>

      </div>
    </section>
  );
}
