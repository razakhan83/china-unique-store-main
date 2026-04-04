import { Truck, Clock, CreditCard, Info, MapPin } from 'lucide-react';

export const metadata = {
  title: 'Shipping Policy',
  description: 'Learn about our shipping rates, delivery times, and tracking information at China Unique Store.',
};

export default function ShippingPolicyPage() {
  const shippingDetails = [
    {
      icon: Clock,
      title: "Delivery Time",
      content: "We strive to deliver your orders as quickly as possible. Standard delivery typically takes 3-5 working days across Pakistan. Please note that delivery times may vary slightly during peak seasons or public holidays."
    },
    {
      icon: CreditCard,
      title: "Shipping Charges",
      content: "We offer competitive shipping rates nationwide. Shipping charges are calculated at checkout based on your location and the weight of your order. Keep an eye out for special promotions that may include free shipping on select items or order values."
    },
    {
      icon: Info,
      title: "Tracking Information",
      content: "Once your order is dispatched, you will receive a tracking number via WhatsApp or SMS. You can use this number to monitor your package's journey and stay updated on its estimated arrival time."
    },
    {
      icon: MapPin,
      title: "Nationwide Coverage",
      content: "We deliver to all major cities and towns across Pakistan. Whether you're in Karachi, Lahore, Islamabad, or beyond, we ensure your premium kitchenware reaches you safely and securely."
    }
  ];

  return (
    <div className="bg-background pb-16 pt-24 md:pt-32">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-12 text-center">
            <div className="mb-4 inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Truck className="size-8" />
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">Shipping Policy</h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Reliable delivery across Pakistan, straight to your doorstep.
            </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {shippingDetails.map((detail, index) => (
            <div key={index} className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-8 transition-colors hover:bg-secondary/5">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/5 text-primary">
                <detail.icon className="size-6" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">{detail.title}</h2>
                <p className="leading-relaxed text-muted-foreground">
                  {detail.content}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-3xl bg-primary px-8 py-10 text-center text-primary-foreground">
            <h2 className="mb-3 text-2xl font-bold">Have questions about your delivery?</h2>
            <p className="mb-6 opacity-80">
                Our support team is available on WhatsApp to help you track your order or answer any shipping-related queries.
            </p>
            <p className="text-sm font-medium">Last updated: March 18, 2026</p>
        </div>
      </div>
    </div>
  );
}
