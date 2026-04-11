'use client';

import { useState } from 'react';
import { Loader2, Save, Truck, Info } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function AdminShippingClient({ initialSettings }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState(initialSettings);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save shipping settings');
      }

      setSaved(true);
      toast.success('Shipping rates updated successfully.');
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save shipping settings', error);
      toast.error(error.message || 'Failed to save shipping settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Shipping & Delivery</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure delivery charges for different regions and set free shipping rules.
        </p>
      </div>

      <Card className="rounded-2xl shadow-sm border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-muted text-foreground">
              <Truck className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Delivery Rates</CardTitle>
              <CardDescription>Specify charges for Karachi and other cities.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <FieldGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="karachiFee">Karachi Delivery Fee</FieldLabel>
              <FieldContent>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rs.</span>
                <Input
                  id="karachiFee"
                  type="number"
                  min="0"
                  className="pl-10 h-11 rounded-xl"
                  value={form.karachiDeliveryFee}
                  onChange={(e) => handleChange('karachiDeliveryFee', Number(e.target.value))}
                />
              </div>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="outsideKarachiFee">Outside Karachi Fee</FieldLabel>
              <FieldContent>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rs.</span>
                <Input
                  id="outsideKarachiFee"
                  type="number"
                  min="0"
                  className="pl-10 h-11 rounded-xl"
                  value={form.outsideKarachiDeliveryFee}
                  onChange={(e) => handleChange('outsideKarachiDeliveryFee', Number(e.target.value))}
                />
              </div>
              </FieldContent>
            </Field>
          </FieldGroup>

          <Separator />

          <Field>
            <FieldLabel htmlFor="freeThreshold">Free Shipping Threshold</FieldLabel>
            <FieldContent>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rs.</span>
              <Input
                id="freeThreshold"
                type="number"
                min="0"
                className="pl-10 h-11 rounded-xl"
                value={form.freeShippingThreshold}
                onChange={(e) => handleChange('freeShippingThreshold', Number(e.target.value))}
              />
            </div>
            <FieldDescription className="pt-1 flex items-center gap-1.5">
              <Info className="size-3" />
              Orders exceeding this amount will have zero shipping charges.
            </FieldDescription>
            </FieldContent>
          </Field>

          <div className="pt-4">
            <Button 
                onClick={handleSave} 
                disabled={saving} 
                size="lg"
                className="w-full sm:w-auto px-8 rounded-xl font-semibold shadow-md active:scale-95 transition-all"
            >
              {saving ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : (
                <Save data-icon="inline-start" />
              )}
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Shipping Rates'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
