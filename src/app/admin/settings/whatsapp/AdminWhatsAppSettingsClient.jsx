'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MessageCircle, Save, Send, Sparkles, Phone, CheckCircle2, Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const DEFAULT_WHATSAPP_TEMPLATES = {
  order_placed: 'Salam {customerName}! Thank you for your order {orderId} at China Unique Store. Total amount: Rs. {totalAmount}. We are preparing your parcel for dispatch.',
  order_shipped: 'Salam {customerName}! Good news, your Order {orderId} has been shipped via {courierName}. Tracking CN: {trackingNumber}. Expected delivery within 2-4 business days.',
  order_delivered: 'Salam {customerName}! Your Order {orderId} from China Unique Store has been successfully delivered. We hope you love your items! If you need any assistance, reply here.',
  order_cancelled: 'Salam {customerName}, your Order {orderId} has been cancelled. If this was a mistake or you wish to re-order, please let us know.',
};

function formatPakistaniPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('92')) return digits;
  if (digits.startsWith('03')) return `92${digits.slice(1)}`;
  return `92${digits}`;
}

export default function AdminWhatsAppSettingsClient({ initialSettings }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState(initialSettings?.whatsappNumber || '03001234567');
  const [templates, setTemplates] = useState({
    order_placed: initialSettings?.whatsappTemplates?.order_placed || DEFAULT_WHATSAPP_TEMPLATES.order_placed,
    order_shipped: initialSettings?.whatsappTemplates?.order_shipped || DEFAULT_WHATSAPP_TEMPLATES.order_shipped,
    order_delivered: initialSettings?.whatsappTemplates?.order_delivered || DEFAULT_WHATSAPP_TEMPLATES.order_delivered,
    order_cancelled: initialSettings?.whatsappTemplates?.order_cancelled || DEFAULT_WHATSAPP_TEMPLATES.order_cancelled,
  });

  // Test send state
  const [testPhone, setTestPhone] = useState('03001234567');
  const [selectedTestTemplate, setSelectedTestTemplate] = useState('order_placed');

  const handleTemplateChange = (key, value) => {
    setTemplates((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsappNumber: whatsappNumber.trim(),
          whatsappTemplates: templates,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save WhatsApp settings');
      }

      toast.success('WhatsApp settings and message templates saved!');
      router.refresh();
    } catch (err) {
      toast.error(err.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const getInterpolatedMessage = (key) => {
    const raw = templates[key] || DEFAULT_WHATSAPP_TEMPLATES[key] || '';
    return raw
      .replace(/{customerName}/g, 'Muhammad Ali')
      .replace(/{orderId}/g, 'ORD-TEST123')
      .replace(/{totalAmount}/g, '2,450')
      .replace(/{courierName}/g, 'NOC Express')
      .replace(/{trackingNumber}/g, '16216206417422');
  };

  const handleTestSend = (e) => {
    e?.preventDefault();
    const cleanPhone = formatPakistaniPhone(testPhone);
    if (!cleanPhone) {
      toast.error('Please enter a valid Pakistani phone number (e.g. 03001234567).');
      return;
    }

    const message = getInterpolatedMessage(selectedTestTemplate);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    toast.success(`Opening WhatsApp with filled ${selectedTestTemplate.replace('_', ' ')} template!`);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <MessageCircle className="size-6 text-emerald-600 dark:text-emerald-400" />
            <span>WhatsApp Notifications & Templates</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure your business WhatsApp number, customize order status messages, and test instant delivery.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="min-w-32 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer">
          <Save className="mr-2 size-4" />
          {isSaving ? 'Saving...' : 'Save Templates'}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Business WhatsApp Number */}
        <Card className="surface-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Phone className="size-5 text-emerald-600" />
              <CardTitle>Store WhatsApp Contact Number</CardTitle>
            </div>
            <CardDescription>
              This number is used for customer chat widgets, order confirmations, and WhatsApp communication.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-md space-y-2">
              <FieldLabel htmlFor="whatsappNumber">Primary WhatsApp Number</FieldLabel>
              <Input
                id="whatsappNumber"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="e.g. 03001234567 or 923001234567"
                className="font-mono text-base"
              />
              <FieldDescription>
                Formatted for direct Pakistani WhatsApp routing (supports 03xx or 923xx format).
              </FieldDescription>
            </div>
          </CardContent>
        </Card>

        {/* Message Templates */}
        <Card className="surface-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="size-5 text-amber-500" />
                  <span>Order Status Message Templates</span>
                </CardTitle>
                <CardDescription className="mt-1">
                  Available tags: <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">&#123;customerName&#125;</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">&#123;orderId&#125;</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">&#123;totalAmount&#125;</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">&#123;courierName&#125;</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">&#123;trackingNumber&#125;</code>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Template 1: Order Placed */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FieldLabel className="font-bold flex items-center gap-1.5 text-xs text-foreground">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">1</Badge>
                  Order Placed Confirmation
                </FieldLabel>
                <span className="text-[11px] text-muted-foreground">Sent upon checkout completion</span>
              </div>
              <Textarea
                rows={3}
                value={templates.order_placed}
                onChange={(e) => handleTemplateChange('order_placed', e.target.value)}
                className="text-xs leading-relaxed"
              />
            </div>

            {/* Template 2: Order Shipped */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FieldLabel className="font-bold flex items-center gap-1.5 text-xs text-foreground">
                  <Badge variant="outline" className="bg-sky-500/10 text-sky-700 dark:text-sky-300">2</Badge>
                  Order Shipped & In Transit
                </FieldLabel>
                <span className="text-[11px] text-muted-foreground">Includes courier name & tracking CN</span>
              </div>
              <Textarea
                rows={3}
                value={templates.order_shipped}
                onChange={(e) => handleTemplateChange('order_shipped', e.target.value)}
                className="text-xs leading-relaxed"
              />
            </div>

            {/* Template 3: Order Delivered */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FieldLabel className="font-bold flex items-center gap-1.5 text-xs text-foreground">
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-300">3</Badge>
                  Order Delivered
                </FieldLabel>
                <span className="text-[11px] text-muted-foreground">Sent once parcel is marked Delivered</span>
              </div>
              <Textarea
                rows={3}
                value={templates.order_delivered}
                onChange={(e) => handleTemplateChange('order_delivered', e.target.value)}
                className="text-xs leading-relaxed"
              />
            </div>

            {/* Template 4: Order Cancelled */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FieldLabel className="font-bold flex items-center gap-1.5 text-xs text-foreground">
                  <Badge variant="outline" className="bg-rose-500/10 text-rose-700 dark:text-rose-300">4</Badge>
                  Order Cancelled
                </FieldLabel>
                <span className="text-[11px] text-muted-foreground">Sent upon cancellation</span>
              </div>
              <Textarea
                rows={3}
                value={templates.order_cancelled}
                onChange={(e) => handleTemplateChange('order_cancelled', e.target.value)}
                className="text-xs leading-relaxed"
              />
            </div>
          </CardContent>
        </Card>

        {/* Live Test-Send Sandbox */}
        <Card className="rounded-2xl border-emerald-500/30 bg-emerald-500/5 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Send className="size-5 text-emerald-600 dark:text-emerald-400" />
              <CardTitle>Test-Send WhatsApp Message</CardTitle>
            </div>
            <CardDescription>
              Preview live filled variables and trigger a test message directly to your phone via WhatsApp Web or Mobile app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleTestSend} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-5 space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Test Recipient Phone</label>
                <Input
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="03001234567"
                  className="bg-background text-sm font-mono h-9"
                  required
                />
              </div>

              <div className="sm:col-span-4 space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Select Template</label>
                <Select value={selectedTestTemplate} onValueChange={setSelectedTestTemplate}>
                  <SelectTrigger className="bg-background text-xs h-9">
                    <SelectValue placeholder="Select Template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order_placed">Order Placed</SelectItem>
                    <SelectItem value="order_shipped">Order Shipped</SelectItem>
                    <SelectItem value="order_delivered">Order Delivered</SelectItem>
                    <SelectItem value="order_cancelled">Order Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-3">
                <Button
                  type="submit"
                  className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-xs cursor-pointer"
                >
                  <Send className="size-3.5" />
                  <span>Send Test</span>
                </Button>
              </div>
            </form>

            <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-background/80 space-y-1.5">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Live Preview (What Customer Sees):
              </span>
              <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                {getInterpolatedMessage(selectedTestTemplate)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
