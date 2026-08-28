'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { HOME_FAQS } from '@/lib/faqs';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';

export default function HomeFaqSection() {
  const displayedFaqs = HOME_FAQS.slice(0, 5);

  return (
    <section 
      className="border-t border-border/70 bg-background py-12 sm:py-16 lg:py-20"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 350px' }}
    >
      <div className="container mx-auto max-w-4xl px-4 sm:px-6">
        
        {/* ── Section Header ── */}
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10 space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Quick answers about shipping, Cash on Delivery, and our open parcel policy.
          </p>
        </div>

        {/* ── 5 Clean Accordion Items ── */}
        <div className="rounded-2xl border border-border/80 bg-card/60 p-2 sm:p-4 shadow-sm divide-y divide-border/50">
          <Accordion type="single" collapsible="true" defaultValue="h1" className="w-full">
            {displayedFaqs.map((faq, index) => {
              const itemNumber = String(index + 1).padStart(2, '0');

              return (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className="border-none px-2 sm:px-4 py-1"
                >
                  <AccordionTrigger className="w-full py-3.5 hover:no-underline text-left text-[14.5px] sm:text-base font-semibold text-foreground transition-colors hover:text-primary data-[state=open]:text-primary [&>svg]:size-4 [&>svg]:text-muted-foreground [&>svg]:transition-transform [&>svg]:duration-300 data-[state=open]:[&>svg]:text-primary">
                    <div className="flex items-start gap-3 sm:gap-4 pr-3 text-left">
                      <span className="shrink-0 text-xs font-mono font-bold text-primary/70 data-[state=open]:text-primary pt-0.5">
                        {itemNumber}
                      </span>
                      <span className="leading-snug">{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-0 pb-4 pl-7 sm:pl-8 pr-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>

        {/* ── Clean Horizontal Bottom Bar (No Clunky Box) ── */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl bg-muted/40 px-5 py-3.5 text-xs sm:text-sm text-muted-foreground">
          <span className="text-center sm:text-left">
            Have more questions about your order?
          </span>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <a
              href="https://wa.me/923180211186"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-[#25D366] hover:text-[#1eb354] transition-colors"
            >
              <WhatsAppIcon className="size-4 shrink-0" />
              <span>WhatsApp Support</span>
            </a>

            <span className="text-border">|</span>

            <Link href="/faq" prefetch={false} className="inline-flex items-center gap-1 font-semibold text-primary hover:text-primary/80 transition-colors">
              <span>View all FAQs</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
