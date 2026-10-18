'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Save, Landmark, Banknote, Receipt } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

export default function AdminPaymentSettingsClient({ initialSettings }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    codEnabled: initialSettings?.codEnabled ?? true,
    bankDepositEnabled: initialSettings?.bankDepositEnabled ?? false,
    bankDepositAccountDetails: initialSettings?.bankDepositAccountDetails || '',
    taxEnabled: initialSettings?.taxEnabled ?? false,
    taxRatePercent: initialSettings?.taxRatePercent ?? 0,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codEnabled: formData.codEnabled,
          bankDepositEnabled: formData.bankDepositEnabled,
          bankDepositAccountDetails: formData.bankDepositAccountDetails,
          taxEnabled: formData.taxEnabled,
          taxRatePercent: Number(formData.taxRatePercent) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to save settings');
      }

      toast.success('Payment & Tax settings saved successfully.');
      router.refresh();
    } catch (error) {
      toast.error(error.message || 'Failed to save payment settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Payment & Tax Settings</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage store payment gateways, COD availability, and sales tax rules.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="min-w-32 shadow-sm cursor-pointer">
          {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Cash on Delivery (COD) */}
        <Card className="surface-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Banknote className="size-5 text-emerald-600 dark:text-emerald-400" />
              <CardTitle>Cash on Delivery (COD)</CardTitle>
            </div>
            <CardDescription>
              Allow customers across Pakistan to pay cash when courier delivers parcel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="space-y-0.5">
                <FieldLabel className="text-base font-semibold">Enable Cash on Delivery</FieldLabel>
                <FieldDescription>
                  When enabled, buyers can choose COD at checkout. If disabled, checkout will only offer Bank Deposit or online methods.
                </FieldDescription>
              </div>
              <Switch
                checked={formData.codEnabled}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, codEnabled: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sales Tax Configuration */}
        <Card className="surface-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Receipt className="size-5 text-sky-600 dark:text-sky-400" />
              <CardTitle>Sales Tax / GST</CardTitle>
            </div>
            <CardDescription>
              Configure standard sales tax or GST percentage applied to checkout order totals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="space-y-0.5">
                <FieldLabel className="text-base font-semibold">Apply Sales Tax at Checkout</FieldLabel>
                <FieldDescription>
                  Automatically calculate and add tax line to customer invoices and checkout totals.
                </FieldDescription>
              </div>
              <Switch
                checked={formData.taxEnabled}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, taxEnabled: checked }))}
              />
            </div>

            {formData.taxEnabled && (
              <Field className="animate-in fade-in slide-in-from-top-2 space-y-2">
                <FieldLabel htmlFor="taxRatePercent">Tax Rate Percentage (%)</FieldLabel>
                <div className="flex items-center gap-3 max-w-xs">
                  <Input
                    id="taxRatePercent"
                    name="taxRatePercent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.taxRatePercent}
                    onChange={handleChange}
                    className="font-mono text-base"
                    placeholder="e.g. 5 or 17"
                  />
                  <span className="text-sm font-bold text-muted-foreground">%</span>
                </div>
                <FieldDescription>
                  Applied on cart taxable subtotal (after discounts). Displayed on invoice slips and order breakdowns.
                </FieldDescription>
              </Field>
            )}
          </CardContent>
        </Card>

        {/* Bank Deposit / Transfer */}
        <Card className="surface-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Landmark className="size-5 text-primary" />
              <CardTitle>Bank Deposit / Manual Transfer</CardTitle>
            </div>
            <CardDescription>
              Allow customers to place orders by manually transferring funds to your bank, JazzCash, or EasyPaisa account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FieldGroup>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 p-4">
                <div className="space-y-0.5">
                  <FieldLabel className="text-base font-semibold">Enable Bank Deposit</FieldLabel>
                  <FieldDescription>
                    Show this payment option during checkout with your account details.
                  </FieldDescription>
                </div>
                <Switch
                  checked={formData.bankDepositEnabled}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, bankDepositEnabled: checked }))}
                />
              </div>

              {formData.bankDepositEnabled && (
                <Field className="animate-in fade-in slide-in-from-top-2 space-y-2">
                  <FieldLabel htmlFor="bankDepositAccountDetails">Account Details & Instructions</FieldLabel>
                  <Textarea
                    id="bankDepositAccountDetails"
                    name="bankDepositAccountDetails"
                    value={formData.bankDepositAccountDetails}
                    onChange={handleChange}
                    placeholder="Bank Name: Meezan Bank / HBL&#10;Account Title: China Unique Items&#10;IBAN / Account No: PK12MEZN0001234567890123&#10;JazzCash / EasyPaisa: 03001234567"
                    rows={5}
                  />
                  <FieldDescription>
                    These details will be shown to customers when they select Bank Deposit at checkout.
                  </FieldDescription>
                </Field>
              )}
            </FieldGroup>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
