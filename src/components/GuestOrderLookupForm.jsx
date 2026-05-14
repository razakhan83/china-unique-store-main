'use client';

import { useState, useTransition } from 'react';
import { ClipboardList, Loader2, Phone, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { trackGuestOrderAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
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
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Search className="size-5" />
          </div>
          <div className="space-y-1">
            <CardTitle>Track your order</CardTitle>
            <CardDescription>
              Enter your order ID and checkout phone number to view your order safely without signing in.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field data-invalid={submitError ? 'true' : undefined}>
              <FieldLabel htmlFor="guest-order-id">Order ID</FieldLabel>
              <FieldDescription>
                Use the order ID you received after checkout, for example `ORD-ABC123`.
              </FieldDescription>
              <InputGroup className="min-h-11 rounded-xl">
                <InputGroupAddon align="inline-start" className="pl-3 text-muted-foreground">
                  <InputGroupText>
                    <ClipboardList />
                  </InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="guest-order-id"
                  type="text"
                  placeholder="ORD-ABC123"
                  value={orderId}
                  onChange={(event) => setOrderId(event.target.value.toUpperCase())}
                  className="h-11"
                  disabled={isPending}
                  aria-invalid={Boolean(submitError)}
                  required
                />
              </InputGroup>
            </Field>

            <Field data-invalid={submitError ? 'true' : undefined}>
              <FieldLabel htmlFor="guest-order-phone">Phone number</FieldLabel>
              <FieldDescription>
                Enter the same number you used at checkout, for example `0300 1234567`.
              </FieldDescription>
              <InputGroup className="min-h-11 rounded-xl">
                <InputGroupAddon align="inline-start" className="pl-3 text-muted-foreground">
                  <InputGroupText>
                    <Phone />
                  </InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="guest-order-phone"
                  type="tel"
                  placeholder="0300 1234567"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="h-11"
                  disabled={isPending}
                  aria-invalid={Boolean(submitError)}
                  required
                />
                <InputGroupAddon align="inline-end" className="pr-2">
                  <InputGroupButton
                    type="submit"
                    size="sm"
                    className="h-8 min-w-[116px] rounded-lg px-4"
                    disabled={isPending || !orderId.trim() || !phone.trim()}
                  >
                    {isPending ? <Loader2 className="animate-spin" /> : 'Track Order'}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              <FieldError>{submitError}</FieldError>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
