import { ShieldCheck, Lock, Cookie, CreditCard, Mail } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy',
  description: 'How we protect your data and ensure a secure shopping experience at China Unique Store.',
};

export default function PrivacyPolicyPage() {
  const sections = [
    {
      icon: ShieldCheck,
      title: "Data Protection",
      content: "At China Unique Store, we are committed to protecting your personal information and your right to privacy. We only collect data that is necessary for processing your orders, including your name, shipping address, and contact details. We do not sell or share your data with third parties for marketing purposes."
    },
    {
      icon: Cookie,
      title: "Cookies and Analytics",
      content: "We use cookies to enhance your browsing experience, remember your cart items, and analyze website traffic. This helps us understand your preferences and improve our services. You can manage your cookie preferences through your browser settings at any time."
    },
    {
      icon: Lock,
      title: "Information Security",
      content: "We implement a variety of security measures to maintain the safety of your personal information when you place an order or enter, submit, or access your personal information. Your data is stored on secure servers and is encrypted during transmission."
    },
    {
      icon: CreditCard,
      title: "Secure Checkout",
      content: "All payment transactions are processed through secure, PCI-compliant payment gateways. Your sensitive payment information (like credit card numbers) is handled by our payment processors and is never stored on our servers."
    },
    {
      icon: Mail,
      title: "Contact Us",
      content: "If you have any questions or concerns about our Privacy Policy or data practices, please reach out to us via our official WhatsApp or email. Our team is here to ensure your peace of mind while shopping with us."
    }
  ];

  return (
    <div className="bg-background pb-16 pt-24 md:pt-32">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-12 text-center">
            <div className="mb-4 inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Lock className="size-8" />
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">Privacy Policy</h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Your trust is our priority. Learn how we protect your information.
            </p>
        </div>

        <div className="space-y-12">
          {sections.map((section, index) => (
            <section key={index} className="group relative overflow-hidden rounded-3xl border border-border bg-card p-8 transition-all hover:border-primary/20 hover:shadow-lg">
                <div className="flex flex-col gap-6 md:flex-row md:items-start">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <section.icon className="size-6" />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-2xl font-semibold text-foreground">{section.title}</h2>
                        <p className="leading-relaxed text-muted-foreground">
                            {section.content}
                        </p>
                    </div>
                </div>
                {/* Decorative background element */}
                <div className="absolute -right-8 -bottom-8 size-32 rounded-full bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </section>
          ))}
        </div>

        <div className="mt-16 text-center text-sm text-muted-foreground">
            <p>Last updated: March 18, 2026</p>
        </div>
      </div>
    </div>
  );
}
