'use client';

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

export default function ProductDetailsTabs({ reviewCount, descriptionContent, reviewsContent }) {
  return (
    <div className="mt-8 md:mt-12 w-full max-w-4xl mx-auto px-4 md:px-0">
      <Accordion type="single" defaultValue="description" className="space-y-3">
        {/* Description Accordion Item */}
        <AccordionItem value="description" className="border border-border rounded-xl bg-card overflow-hidden">
          <AccordionTrigger className="w-full flex items-center justify-between px-5 py-4 text-base font-bold text-foreground hover:bg-muted/30 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-border">
            Description
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-4">
            {descriptionContent}
          </AccordionContent>
        </AccordionItem>

        {/* Reviews Accordion Item */}
        <AccordionItem value="reviews" className="border border-border rounded-xl bg-card overflow-hidden">
          <AccordionTrigger className="w-full flex items-center justify-between px-5 py-4 text-base font-bold text-foreground hover:bg-muted/30 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-border">
            Reviews ({reviewCount})
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-4">
            {reviewsContent}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
