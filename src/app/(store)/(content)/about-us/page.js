import Link from 'next/link';
import { Store, ShieldCheck, Heart, Star, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

export const metadata = {
  title: 'About Us',
  description: 'Our story at China Unique Store - bringing quality and elegance to modern Pakistani homes.',
};

export default function AboutUsPage() {
  return (
    <div className="bg-background pb-16 pt-24 md:pt-32">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Store className="size-8" />
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">Our Story</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Empowering modern Pakistani homes with premium kitchenware and lifestyle essentials.
          </p>
        </div>

        {/* Content Section */}
        <div className="prose prose-slate prose-lg max-w-none dark:prose-invert">
          <div className="grid gap-12 md:grid-cols-2">
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Quality Meets Elegance</h2>
              <p className="text-muted-foreground">
                Founded with a passion for excellence, China Unique Store began as a small initiative to bring high-quality, 
                internationally-sourced kitchenware and home decor to Pakistan. We believe that your home is a reflection 
                of your journey, and every piece you choose should tell a story of quality and style.
              </p>
              <p className="text-muted-foreground">
                Our team meticulously selects each product, ensuring it meets our rigid standards for durability and aesthetic 
                appeal. From professional-grade cookware to statement home accents, we bridge the gap between global 
                innovation and local lifestyle needs.
              </p>
            </div>
            <div className="relative overflow-hidden rounded-3xl bg-primary/5 p-8 border border-primary/10">
              <div className="absolute -right-8 -top-8 size-32 rounded-full bg-primary/10 blur-3xl opacity-50" />
              <h2 className="mb-6 text-2xl font-semibold">Our Commitment</h2>
              <ul className="space-y-4">
                {[
                  { icon: ShieldCheck, title: "Uncompromising Quality", desc: "Every product is tested for performance and longevity." },
                  { icon: Heart, title: "Customer Obsession", desc: "Your satisfaction is at the heart of everything we do." },
                  { icon: Star, title: "Premium Experience", desc: "From browsing to delivery, we ensure a seamless journey." }
                ].map((item, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm border border-border/50">
                      <item.icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-16 rounded-3xl bg-primary px-8 py-12 text-center text-primary-foreground md:px-16">
            <h2 className="mb-4 text-3xl font-bold text-white">Inspired Living</h2>
            <p className="mx-auto mb-8 max-w-xl text-primary-foreground/80">
              Join thousands of Pakistani families who have transformed their homes with China Unique Store. 
              We&apos;re more than just a brand; we&apos;re your partner in creating a home that feels like yours.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" variant="secondary" className="group h-14 rounded-2xl px-8 font-semibold" render={<Link href="/products" />} nativeButton={false}>
                  <div className="flex items-center gap-2">
                    Browse Collection
                    <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </div>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
