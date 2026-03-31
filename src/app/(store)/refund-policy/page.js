import { RotateCcw, ShieldCheck, AlertCircle, ShoppingBag, Clock } from 'lucide-react';

export const metadata = {
  title: 'Refund Policy',
  description: 'Our 7-day return and exchange policy for damaged or incorrect products at China Unique Store.',
};

export default function RefundPolicyPage() {
  const steps = [
    {
      icon: Clock,
      title: "7-Day Window",
      content: "We offer a 7-day return and exchange policy for all our products. If you receive a damaged or incorrect item, you must notify us within 7 days of receiving your order."
    },
    {
      icon: AlertCircle,
      title: "Damaged or Wrong Product",
      content: "Returns and exchanges are exclusively accepted for products that are received in a damaged condition or if the wrong product was shipped. We take great care in packaging, but accidental damage during transit can occur."
    },
    {
      icon: ShieldCheck,
      title: "Unused Condition",
      content: "To be eligible for a return or exchange, your item must be unused and in the same condition that you received it. It must also be in the original packaging. Items that show signs of use will not be eligible."
    },
    {
      icon: ShoppingBag,
      title: "Exchange Process",
      content: "Once we verify the damage or error, we will initiate an exchange for the correct or a new item. If the item is out of stock, we may offer a refund or store credit."
    }
  ];

  return (
    <div className="bg-background pb-16 pt-24 md:pt-32">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-12 text-center">
            <div className="mb-4 inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <RotateCcw className="size-8" />
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">Refund & Exchange</h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Easy returns and exchanges for your peace of mind.
            </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-8">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/5 text-primary">
                <step.icon className="size-6" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground">{step.title}</h2>
              <p className="leading-relaxed text-muted-foreground">
                {step.content}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-3xl bg-secondary/30 p-8 border border-border text-center">
            <h2 className="mb-4 text-2xl font-semibold">Need help with a return?</h2>
            <p className="mb-6 text-muted-foreground">
                Contact our customer support team via WhatsApp for immediate assistance with your return or exchange request.
            </p>
            <p className="text-sm font-medium text-primary">Last updated: March 18, 2026</p>
        </div>
      </div>
    </div>
  );
}
