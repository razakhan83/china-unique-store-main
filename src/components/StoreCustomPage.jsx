import Link from 'next/link';
import { CircleHelp, FileText, Lock, RotateCcw, Store, Truck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const PAGE_ICON_MAP = {
  'about-us': Store,
  faq: CircleHelp,
  'privacy-policy': Lock,
  'refund-policy': RotateCcw,
  'shipping-policy': Truck,
};

function getContentBlocks(content = '') {
  return String(content || '')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function getFaqItems(content = '') {
  return String(content || '')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => {
      const lines = block
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length === 0) return null;

      const questionLine = lines[0];
      const question = questionLine.replace(/^q\s*:\s*/i, '').trim();
      const answer = lines
        .slice(1)
        .join(' ')
        .replace(/^a\s*:\s*/i, '')
        .trim();

      if (!question || !answer) return null;

      return {
        id: `faq-${index + 1}`,
        question,
        answer,
      };
    })
    .filter(Boolean);
}

export default function StoreCustomPage({ page, storeName = 'China Unique Store' }) {
  const Icon = PAGE_ICON_MAP[page?.slug] || FileText;
  const blocks = getContentBlocks(page?.content);
  const faqItems = page?.slug === 'faq' ? getFaqItems(page?.content) : [];
  const isFaqPage = page?.slug === 'faq' && faqItems.length > 0;
  const leadBlock = !isFaqPage ? blocks[0] || '' : '';
  const bodyBlocks = !isFaqPage ? blocks.slice(1) : [];

  return (
    <div className="bg-background pb-16 pt-20 md:pt-24">
      <div className="container mx-auto max-w-4xl px-4">
        <header className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/80 bg-background px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Icon className="size-3.5 text-primary" />
            {storeName}
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-5xl">
            {page?.title || 'Store Page'}
          </h1>
          {page?.description ? (
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              {page.description}
            </p>
          ) : null}
          {!isFaqPage ? (
            <div className="mt-6 flex justify-center">
              <div className="h-px w-24 bg-border" />
            </div>
          ) : null}
        </header>

        <article className="mx-auto mt-8 max-w-3xl">
          {isFaqPage ? (
            <div className="rounded-3xl border border-border bg-card/70 px-5 py-4 shadow-[0_18px_48px_rgba(16,24,40,0.04)] md:px-8 md:py-6">
              <div className="flex flex-col">
                {faqItems.map((item, index) => (
                  <details
                    key={item.id}
                    className={index === faqItems.length - 1 ? 'group py-1' : 'group border-b border-border/70 py-1'}
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-base font-semibold text-foreground marker:hidden">
                      <span className="pr-3">{item.question}</span>
                      <span className="text-lg leading-none text-muted-foreground transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <div className="pb-4 text-[15px] leading-8 text-foreground/80">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ) : blocks.length > 0 ? (
            <div className="rounded-[2rem] border border-border/85 bg-card px-5 py-6 shadow-[0_22px_60px_rgba(16,24,40,0.05)] md:px-8 md:py-8">
              {leadBlock ? (
                <div className="border-b border-border/70 pb-6">
                  <p className="text-lg leading-9 text-foreground/95 md:text-[1.15rem]">
                    {leadBlock}
                  </p>
                </div>
              ) : null}

              {bodyBlocks.length > 0 ? (
                <div className="flex flex-col gap-6 pt-6">
                  {bodyBlocks.map((block, index) => (
                    <section
                      key={`${page?.slug || 'page'}-${index + 1}`}
                      className="rounded-2xl border border-border/70 bg-background px-5 py-5"
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-[0.16em]">
                          {String(index + 2).padStart(2, '0')}
                        </Badge>
                        <div className="h-px flex-1 bg-border/70" />
                      </div>
                      <p className="whitespace-pre-wrap text-[15px] leading-8 text-foreground/88 md:text-base">
                        {block}
                      </p>
                    </section>
                  ))}
                </div>
              ) : null}

              <div className="mt-8 rounded-2xl border border-border/70 bg-background px-5 py-5">
                <p className="text-sm font-semibold text-foreground">Need help with anything else?</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Our team is available for product questions, delivery support, and order updates.
                </p>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl px-4"
                    render={<Link href="/products" />}
                    nativeButton={false}
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-card/60 px-6 py-10 text-center text-muted-foreground">
              Content for this page has not been added yet.
            </div>
          )}
        </article>

        {!isFaqPage ? (
          <div className="mt-8 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl px-4 text-muted-foreground hover:text-foreground"
              render={<Link href="/products" />}
              nativeButton={false}
            >
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl px-4"
              render={<Link href="/products" />}
              nativeButton={false}
            >
              Browse Products
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
