'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Search, 
  X, 
  HelpCircle, 
  Truck, 
  Wallet, 
  ShieldCheck, 
  Package, 
  MessageSquare,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { CATEGORIES, FULL_FAQS } from '@/lib/faqs';
import { createWhatsAppUrl } from '@/lib/whatsapp';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';

const ICON_MAP = {
  Truck: Truck,
  Wallet: Wallet,
  ShieldCheck: ShieldCheck,
  HelpCircle: HelpCircle,
  Package: Package,
};

export default function FaqPageClient({ whatsappNumber, storeName, pageTitle, pageDescription }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const whatsappLink = createWhatsAppUrl(whatsappNumber);

  // Filter FAQs based on search query and selected category
  const filteredFaqs = useMemo(() => {
    return FULL_FAQS.filter((faq) => {
      const matchesCategory = selectedCategory === 'all' || faq.categoryId === selectedCategory;
      const matchesSearch = 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="relative min-h-screen bg-background pb-24 pt-8 md:pt-16">
      {/* Background Decorative Gradient */}
      <div className="absolute inset-x-0 top-0 -z-10 h-[500px] bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="absolute top-[10%] left-[-15%] -z-10 size-[300px] rounded-full bg-primary/3 blur-[100px]" />
      <div className="absolute top-[20%] right-[-15%] -z-10 size-[300px] rounded-full bg-primary/3 blur-[100px]" />

      <div className="container mx-auto max-w-5xl px-4 sm:px-6">
        
        {/* Breadcrumb - Left aligned on PC, Centered on Mobile */}
        <nav className="mb-8 flex items-center justify-center lg:justify-start gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="size-3 text-muted-foreground/60" />
          <span className="text-foreground font-medium">FAQ</span>
        </nav>

        {/* ── Hero Header: Text on Left, SVG on Right on PC ── */}
        <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-12 lg:gap-12 lg:items-center mb-8 sm:mb-12 lg:mb-16">
          
          {/* Text content - Left-aligned on PC, Centered on Mobile. Order-last on PC so it renders on the right */}
          <div className="lg:col-span-7 lg:order-last text-center lg:text-left space-y-3 sm:space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <HelpCircle className="size-3.5" />
              Help Center
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl leading-tight">
              {pageTitle || 'Frequently Asked Questions'}
            </h1>
            <p className="mx-auto lg:mx-0 max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-base">
              {pageDescription || 'Everything you need to know about delivery, returns, payments, and gadget usage. Can\'t find what you are looking for? Reach out on WhatsApp.'}
            </p>
          </div>

          {/* SVG Illustration - Left-aligned and order-first on PC */}
          <div className="lg:col-span-5 lg:order-first flex justify-center lg:justify-start">
            <div className="relative max-w-[160px] sm:max-w-[220px] lg:max-w-[280px] w-full">
              <Image
                src="/undraw_questions_52ic.svg"
                alt="Frequently Asked Questions"
                width={280}
                height={220}
                className="h-auto w-full select-none opacity-95 transition-opacity hover:opacity-100"
                priority
              />
            </div>
          </div>

        </div>

        {/* ── Search & Filter Panel - Wide PC Alignment ── */}
        <div className="max-w-4xl mx-auto mb-8 sm:mb-10 space-y-4 sm:space-y-5">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search questions or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search frequently asked questions"
              className="w-full rounded-xl border border-border bg-card py-3 sm:py-3.5 pl-11 pr-10 text-xs sm:text-sm outline-none transition-all placeholder:text-muted-foreground/75 focus:border-primary focus:ring-2 focus:ring-primary/10 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Category Tabs - Swipeable row on mobile, centered wrap on desktop */}
          <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 py-1 hide-scrollbar sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`shrink-0 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-card border border-border/80 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              All FAQs
            </button>
            {CATEGORIES.map((cat) => {
              const IconComp = ICON_MAP[cat.icon] || HelpCircle;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-card border border-border/80 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <IconComp className="size-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── FAQ Results Accordion - Wide PC Alignment ── */}
        <div className="max-w-4xl mx-auto space-y-6">
          {filteredFaqs.length > 0 ? (
            <Accordion type="single" collapsible="true" className="w-full space-y-3">
              {filteredFaqs.map((faq) => (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className="rounded-xl border border-border/70 bg-card px-4 sm:px-5 py-0.5 transition-all duration-300 hover:border-primary/30 shadow-2xs"
                >
                  <AccordionTrigger className="w-full py-3.5 sm:py-4 hover:no-underline [&[data-state=open]]:text-primary transition-colors text-left text-xs sm:text-sm md:text-base font-semibold">
                    <span className="pr-3 leading-snug">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/30 mt-2">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/80 bg-card py-12 px-4 text-center">
              <div className="mx-auto mb-4 flex items-center justify-center">
                <Image
                  src="/undraw_questions_52ic.svg"
                  alt="No FAQs found"
                  width={160}
                  height={120}
                  className="h-auto w-[140px] sm:w-[160px] object-contain opacity-90 select-none"
                />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">No questions found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5 px-4">
                We couldn&apos;t find any FAQs matching &ldquo;{searchQuery}&rdquo;. Try using different keywords or clear the filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98]"
              >
                Reset Search
              </button>
            </div>
          )}
        </div>

        {/* ── Compact & Clean WhatsApp Help Bar (No Gradients) ── */}
        <div className="max-w-4xl mx-auto mt-10 rounded-xl border border-border/80 bg-card p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#25D366]/10 text-[#25D366]">
              <WhatsAppIcon className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Still need help?</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Chat with our support team directly on WhatsApp for quick answers.
              </p>
            </div>
          </div>
          
          <a
            href={whatsappLink || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-2 text-xs font-semibold shadow-xs transition-colors active:scale-95"
          >
            <WhatsAppIcon className="size-3.5" />
            Chat on WhatsApp
          </a>
        </div>

      </div>
    </div>
  );
}
