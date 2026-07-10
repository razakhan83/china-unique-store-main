'use client';

import { useState, useTransition } from 'react';
import { ClipboardList, Loader2, Phone, PackageSearch, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { trackGuestOrderAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';

export default function GuestOrderLookupForm() {
  const router = useRouter();
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event) {
    event.preventDefault();
    if (!orderId.trim() || !phone.trim()) return;
    setSubmitError('');

    startTransition(async () => {
      try {
        const result = await trackGuestOrderAction({
          orderId: orderId.trim(),
          phone: phone.trim(),
        });

        if (result?.success && result.redirectUrl) {
          toast.success('Order found. Opening tracking details.');
          router.push(result.redirectUrl);
          return;
        }

        const message = result?.message || 'We could not find an order matching those details.';
        setSubmitError(message);
        toast.error(message);
      } catch {
        const message = 'Something went wrong while checking your order.';
        setSubmitError(message);
        toast.error(message);
      }
    });
  }

  return (
    <Card className="border-border/60 shadow-lg bg-card/80 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-6 pt-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-inner">
            <PackageSearch className="size-8" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight">Track Your Order</CardTitle>
            <CardDescription className="text-base px-2 sm:px-6 leading-relaxed">
              Enter your order details below to check the current status and tracking information.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 sm:px-10 pb-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <FieldGroup className="space-y-5">
            <Field data-invalid={submitError ? 'true' : undefined}>
              <FieldLabel htmlFor="guest-order-id" className="text-sm font-semibold text-foreground mb-1.5">Order ID</FieldLabel>
              <InputGroup className="min-h-12 rounded-xl border-border/70 bg-background shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all duration-200">
                <InputGroupAddon align="inline-start" className="pl-4 text-muted-foreground">
                  <InputGroupText>
                    <ClipboardList className="size-5" />
                  </InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="guest-order-id"
                  type="text"
                  placeholder="e.g. ORD-ABC123"
                  value={orderId}
                  onChange={(event) => setOrderId(event.target.value.toUpperCase())}
                  className="h-12 px-3 text-base placeholder:text-muted-foreground/50 border-0 focus:ring-0 bg-transparent w-full"
                  disabled={isPending}
                  aria-invalid={Boolean(submitError)}
                  required
                />
              </InputGroup>
              <FieldDescription className="mt-2 text-xs text-muted-foreground/80">
                Found in your confirmation email or SMS.
              </FieldDescription>
            </Field>

            <Field data-invalid={submitError ? 'true' : undefined}>
              <FieldLabel htmlFor="guest-order-phone" className="text-sm font-semibold text-foreground mb-1.5">Phone Number</FieldLabel>
              <InputGroup className="min-h-12 rounded-xl border-border/70 bg-background shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all duration-200">
                <InputGroupAddon align="inline-start" className="pl-4 text-muted-foreground">
                  <InputGroupText>
                    <Phone className="size-5" />
                  </InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="guest-order-phone"
                  type="tel"
                  placeholder="e.g. 0300 1234567"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="h-12 px-3 text-base placeholder:text-muted-foreground/50 border-0 focus:ring-0 bg-transparent w-full"
                  disabled={isPending}
                  aria-invalid={Boolean(submitError)}
                  required
                />
              </InputGroup>
              <FieldDescription className="mt-2 text-xs text-muted-foreground/80">
                The exact phone number you provided during checkout.
              </FieldDescription>
              {submitError && <FieldError className="mt-2 text-sm font-medium">{submitError}</FieldError>}
            </Field>
          </FieldGroup>

          <Button 
            type="submit" 
            className="w-full h-14 text-base font-semibold rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 mt-8"
            disabled={isPending || !orderId.trim() || !phone.trim()}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-5 animate-spin" />
                Searching...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2 w-full">
                Track Order
                <ArrowRight className="size-5" />
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
