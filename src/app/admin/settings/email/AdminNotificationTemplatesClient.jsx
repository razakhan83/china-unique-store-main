'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Bell,
  Mail,
  MessageSquare,
  Save,
  Send,
  Eye,
  Check,
  Copy,
  Info,
  Sparkles,
  Smartphone,
  CheckCircle2,
  PackageCheck,
  Truck,
  XCircle,
  Clock,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export const DEFAULT_NOTIFICATION_TEMPLATES = {
  order_placed: {
    name: 'Order Placed / Confirmation',
    shortName: 'Placed',
    icon: PackageCheck,
    color: 'emerald',
    description: 'Triggered immediately when a customer places an order.',
    subject: 'Order Confirmed #{orderId} - {storeName}',
    emailBody: `Dear {customerName},

Thank you for shopping with {storeName}! We have received your order #{orderId} and are currently preparing it for dispatch.

Order Details:
• Order ID: #{orderId}
• Total Amount: Rs. {totalAmount}
• Payment Method: {paymentMethod}

You can track your order status in real time anytime using the link below:
{orderUrl}

If you have any questions or require modifications, please reply directly to this email or reach us on WhatsApp at {whatsappNumber}.

Warm regards,
{storeName} Team`,
    smsBody: 'Salam {customerName}! Your order #{orderId} of Rs. {totalAmount} has been confirmed at {storeName}. Track your parcel: {orderUrl}',
    isEnabled: true,
  },
  order_shipped: {
    name: 'Order Shipped / Dispatched',
    shortName: 'Shipped',
    icon: Truck,
    color: 'blue',
    description: 'Triggered when the order status is updated to Shipped.',
    subject: 'Your Order #{orderId} Has Been Shipped! - {storeName}',
    emailBody: `Dear {customerName},

Great news! Your order #{orderId} has been carefully inspected, packed, and handed over to our courier partner.

Shipment Details:
• Courier: {courierName}
• Tracking CN / Number: {trackingNumber}
• Estimated Delivery: 2 to 4 business days

Click the link below to track your delivery progress live:
{trackingUrl}

Please keep Rs. {totalAmount} ready in cash upon arrival if your order is Cash on Delivery (COD).

Thank you for choosing {storeName}!`,
    smsBody: 'Salam {customerName}! Order #{orderId} is dispatched via {courierName}. Tracking: {trackingNumber}. Total payable: Rs. {totalAmount}. Track: {trackingUrl} - {storeName}',
    isEnabled: true,
  },
  order_delivered: {
    name: 'Order Delivered',
    shortName: 'Delivered',
    icon: CheckCircle2,
    color: 'green',
    description: 'Triggered when courier marks the shipment as successfully delivered.',
    subject: 'Order #{orderId} Delivered - Thank you for shopping with {storeName}',
    emailBody: `Dear {customerName},

Your order #{orderId} has been delivered! We hope you love your new purchase from {storeName}.

If you have a moment, we would love to hear your feedback. Did everything arrive in perfect condition?

If you encounter any issues or need support, reply to this email or chat with our team on WhatsApp at {whatsappNumber}.

Warm regards,
{storeName} Customer Happiness`,
    smsBody: 'Salam {customerName}! Order #{orderId} was delivered. Thank you for shopping with {storeName}! Reach us on WhatsApp for any help: {whatsappNumber}',
    isEnabled: true,
  },
  order_cancelled: {
    name: 'Order Cancelled',
    shortName: 'Cancelled',
    icon: XCircle,
    color: 'rose',
    description: 'Triggered when an order is cancelled by staff or customer.',
    subject: 'Order #{orderId} Has Been Cancelled - {storeName}',
    emailBody: `Dear {customerName},

This email is to notify you that order #{orderId} has been cancelled.

Reason / Notes:
{notes}

If this cancellation was unintended, or if you would like assistance selecting alternative items, our team is standing by to help.

You can contact our WhatsApp support at {whatsappNumber} or browse our latest arrivals here:
{storeUrl}

Warm regards,
{storeName} Team`,
    smsBody: 'Salam {customerName}! Your order #{orderId} has been cancelled. If you need any assistance, please contact WhatsApp {whatsappNumber} - {storeName}',
    isEnabled: true,
  },
};

const SAMPLE_VARIABLES = {
  customerName: 'Muhammad Hamza',
  orderId: 'CU-84920',
  totalAmount: '3,850',
  paymentMethod: 'Cash on Delivery (COD)',
  courierName: 'NOC Express',
  trackingNumber: 'NOC-99283716',
  trackingUrl: 'https://chinauniquestore.com/orders/CU-84920?track=live',
  orderUrl: 'https://chinauniquestore.com/orders/CU-84920',
  storeName: 'China Unique Store',
  storeUrl: 'https://chinauniquestore.com',
  whatsappNumber: '03228252592',
  notes: 'Customer requested cancellation due to address change.',
};

const AVAILABLE_PLACEHOLDERS = [
  { key: '{customerName}', desc: "Customer's full name" },
  { key: '{orderId}', desc: 'Order ID / reference' },
  { key: '{totalAmount}', desc: 'Final total amount (e.g. 3,850)' },
  { key: '{paymentMethod}', desc: 'Payment method selected' },
  { key: '{courierName}', desc: 'Courier service name' },
  { key: '{trackingNumber}', desc: 'Tracking number / CN' },
  { key: '{trackingUrl}', desc: 'Direct parcel tracking link' },
  { key: '{orderUrl}', desc: 'Customer order tracking URL' },
  { key: '{storeName}', desc: 'Your store name' },
  { key: '{whatsappNumber}', desc: 'Support WhatsApp number' },
  { key: '{notes}', desc: 'Cancellation notes/reason' },
];

export default function AdminNotificationTemplatesClient({ initialSettings }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('order_placed');
  const [previewMode, setPreviewMode] = useState('email'); // 'email' | 'sms'
  const [copiedKey, setCopiedKey] = useState(null);

  // Initial templates with fallbacks
  const [templates, setTemplates] = useState(() => {
    const saved = initialSettings?.emailTemplates || {};
    const merged = {};
    for (const key of Object.keys(DEFAULT_NOTIFICATION_TEMPLATES)) {
      merged[key] = {
        ...DEFAULT_NOTIFICATION_TEMPLATES[key],
        ...(saved[key] || {}),
      };
    }
    return merged;
  });

  // Test Dialog State
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [testChannel, setTestChannel] = useState('email');
  const [testRecipient, setTestRecipient] = useState(initialSettings?.supportEmail || '');
  const [isSendingTest, setIsSendingTest] = useState(false);

  const currentTemplate = templates[activeTab] || DEFAULT_NOTIFICATION_TEMPLATES[activeTab];

  const handleFieldChange = (field, value) => {
    setTemplates((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [field]: value,
      },
    }));
  };

  const handleCopyPlaceholder = (placeholder) => {
    navigator.clipboard.writeText(placeholder);
    setCopiedKey(placeholder);
    toast.success(`Copied ${placeholder} to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const interpolate = (text) => {
    if (!text) return '';
    let result = String(text);
    for (const [key, val] of Object.entries(SAMPLE_VARIABLES)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), val);
    }
    return result;
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailTemplates: templates,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save notification templates');
      }

      toast.success('All notification templates saved successfully!');
      router.refresh();
    } catch (err) {
      toast.error(err.message || 'Error saving templates');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testRecipient.trim()) {
      toast.error(testChannel === 'email' ? 'Please enter a valid email address' : 'Please enter a valid phone number');
      return;
    }

    setIsSendingTest(true);
    try {
      const interpolatedSubject = interpolate(currentTemplate.subject);
      const interpolatedBody = interpolate(testChannel === 'email' ? currentTemplate.emailBody : currentTemplate.smsBody);

      const res = await fetch('/api/admin/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: testChannel,
          to: testRecipient.trim(),
          triggerKey: activeTab,
          subject: interpolatedSubject,
          bodyText: interpolatedBody,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send test notification');
      }

      toast.success(data.message || 'Test notification sent!');
      setIsTestOpen(false);
    } catch (err) {
      toast.error(err.message || 'Test dispatch failed');
    } finally {
      setIsSendingTest(false);
    }
  };

  // SMS calculation helper
  const smsLength = currentTemplate.smsBody?.length || 0;
  const smsSegments = Math.max(1, Math.ceil(smsLength / 160));

  return (
    <div className="w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Bell className="size-6 text-primary" /> Notification Templates
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage and personalize customer email and SMS notifications triggered across each stage of order fulfillment.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setTestChannel('email');
              setIsTestOpen(true);
            }}
            className="rounded-xl border-border bg-card font-semibold text-xs sm:text-sm"
          >
            <Send className="mr-1.5 size-4 text-primary" /> Test Send
          </Button>
          <Button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="rounded-xl font-bold text-xs sm:text-sm bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Save className="mr-1.5 size-4" /> {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Main Trigger Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {Object.entries(DEFAULT_NOTIFICATION_TEMPLATES).map(([key, def]) => {
          const Icon = def.icon;
          const isActive = activeTab === key;
          const isEnabled = templates[key]?.isEnabled !== false;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex flex-col items-start gap-1 p-3.5 rounded-2xl border text-left transition-all',
                isActive
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs'
                  : 'border-border bg-card hover:bg-muted/40 text-muted-foreground'
              )}
            >
              <div className="flex w-full items-center justify-between">
                <div
                  className={cn(
                    'size-8 rounded-xl flex items-center justify-center text-xs font-bold',
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <Badge
                  variant={isEnabled ? 'default' : 'secondary'}
                  className={cn(
                    'text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md',
                    isEnabled ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {isEnabled ? 'Active' : 'Muted'}
                </Badge>
              </div>
              <span className={cn('text-sm font-bold mt-1', isActive ? 'text-foreground' : 'text-foreground/80')}>
                {def.shortName}
              </span>
              <span className="text-[11px] text-muted-foreground line-clamp-1">{def.name}</span>
            </button>
          );
        })}
      </div>

      {/* Trigger Configuration Body & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="rounded-2xl border-border bg-card shadow-xs">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    {currentTemplate.name}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {DEFAULT_NOTIFICATION_TEMPLATES[activeTab]?.description}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {currentTemplate.isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <Switch
                    checked={currentTemplate.isEnabled !== false}
                    onCheckedChange={(checked) => handleFieldChange('isEnabled', checked)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Dynamic Variables Bank */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-amber-500" /> Dynamic Variables (Click to copy)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_PLACEHOLDERS.map(({ key, desc }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleCopyPlaceholder(key)}
                      title={desc}
                      className="group inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-1 rounded-lg border border-border/80 bg-muted/60 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors cursor-pointer select-none"
                    >
                      {copiedKey === key ? (
                        <Check className="size-3 text-emerald-600 animate-in zoom-in-50" />
                      ) : (
                        <Copy className="size-3 text-muted-foreground group-hover:text-primary opacity-60" />
                      )}
                      <span>{key}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Email Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Mail className="size-3.5 text-blue-500" /> Email Subject Line
                </label>
                <Input
                  value={currentTemplate.subject || ''}
                  onChange={(e) => handleFieldChange('subject', e.target.value)}
                  placeholder="e.g. Order Confirmed #{orderId}"
                  className="rounded-xl text-sm"
                />
              </div>

              {/* Email Body */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Mail className="size-3.5 text-blue-500" /> Email Message Content
                  </label>
                  <span className="text-[11px] text-muted-foreground">Markdown / Plain text supported</span>
                </div>
                <Textarea
                  value={currentTemplate.emailBody || ''}
                  onChange={(e) => handleFieldChange('emailBody', e.target.value)}
                  rows={9}
                  className="rounded-xl text-xs sm:text-sm font-sans leading-relaxed resize-y"
                  placeholder="Enter email content with placeholder tags..."
                />
              </div>

              {/* SMS Body */}
              <div className="space-y-1.5 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Smartphone className="size-3.5 text-emerald-500" /> SMS Text Template
                  </label>
                  <span
                    className={cn(
                      'text-[11px] font-mono font-semibold',
                      smsLength > 160 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
                    )}
                  >
                    {smsLength} chars ({smsSegments} {smsSegments === 1 ? 'segment' : 'segments'})
                  </span>
                </div>
                <Textarea
                  value={currentTemplate.smsBody || ''}
                  onChange={(e) => handleFieldChange('smsBody', e.target.value)}
                  rows={3}
                  className="rounded-xl text-xs sm:text-sm font-sans leading-relaxed resize-y"
                  placeholder="Enter short SMS message for local carrier delivery..."
                />
                <p className="text-[11px] text-muted-foreground">
                  Standard SMS messages are 160 characters per segment. Keep concise for optimal delivery rates across Pakistani telecom networks (Jazz, Zong, Telenor, Ufone).
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Realistic Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="rounded-2xl border-border bg-card shadow-xs sticky top-20">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Eye className="size-4 text-primary" /> Live Customer Preview
                </CardTitle>
                <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('email')}
                    className={cn(
                      'px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1',
                      previewMode === 'email'
                        ? 'bg-card text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Mail className="size-3.5" /> Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('sms')}
                    className={cn(
                      'px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1',
                      previewMode === 'sms'
                        ? 'bg-card text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Smartphone className="size-3.5" /> SMS
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              {previewMode === 'email' ? (
                /* Email Preview Mockup */
                <div className="rounded-xl border border-border/80 bg-background overflow-hidden text-xs shadow-xs">
                  {/* Email Chrome Header */}
                  <div className="border-b border-border/60 bg-muted/40 p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span><strong>From:</strong> {initialSettings?.storeName || 'China Unique Store'}</span>
                      <span className="flex items-center gap-1 text-[10px]">
                        <Clock className="size-3" /> Just now
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      <span><strong>To:</strong> {SAMPLE_VARIABLES.customerName} &lt;customer@example.com&gt;</span>
                    </div>
                    <div className="text-xs font-bold text-foreground truncate pt-0.5">
                      <strong>Subject:</strong> {interpolate(currentTemplate.subject)}
                    </div>
                  </div>

                  {/* Email Body Content */}
                  <div className="p-4 bg-card space-y-3.5">
                    <div className="flex items-center justify-between pb-3 border-b border-border/50">
                      <span className="font-bold text-sm tracking-tight text-primary">
                        {initialSettings?.storeName || 'China Unique Store'}
                      </span>
                      <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-500/10 border-emerald-500/20">
                        {currentTemplate.shortName} Notice
                      </Badge>
                    </div>

                    <div className="whitespace-pre-wrap leading-relaxed text-foreground text-xs font-sans">
                      {interpolate(currentTemplate.emailBody)}
                    </div>

                    <div className="pt-3 border-t border-border/50 text-[10px] text-muted-foreground text-center">
                      Cash on Delivery Available Across Pakistan • Support WhatsApp: {SAMPLE_VARIABLES.whatsappNumber}
                    </div>
                  </div>
                </div>
              ) : (
                /* SMS Phone Bubble Mockup */
                <div className="rounded-2xl border-4 border-slate-800 bg-slate-900 p-3 sm:p-4 shadow-md max-w-sm mx-auto">
                  {/* Phone Speaker Notch */}
                  <div className="w-16 h-1 bg-slate-700 rounded-full mx-auto mb-3" />

                  {/* SMS Bubble Screen */}
                  <div className="rounded-xl bg-slate-950 p-4 min-h-[220px] flex flex-col justify-between">
                    <div className="space-y-1 text-center mb-3">
                      <p className="text-[11px] font-bold text-slate-200">
                        {initialSettings?.storeName || 'China Unique'}
                      </p>
                      <p className="text-[9px] text-slate-500">SMS Notification</p>
                    </div>

                    {/* Chat Bubble */}
                    <div className="bg-emerald-700 text-white p-3 rounded-2xl rounded-bl-xs text-xs font-sans leading-relaxed shadow-xs">
                      {interpolate(currentTemplate.smsBody)}
                      <div className="text-[9px] text-emerald-200 text-right mt-1">12:30 PM • Sent</div>
                    </div>

                    <div className="text-[10px] text-slate-500 text-center mt-4">
                      Simulated carrier handset view
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Test Send Dialog */}
      <Dialog open={isTestOpen} onOpenChange={setIsTestOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Send className="size-4 text-primary" /> Send Test Notification
            </DialogTitle>
            <DialogDescription className="text-xs">
              Preview this template by sending a test message with interpolated sample data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex rounded-xl border border-border p-1 bg-muted/40">
              <button
                type="button"
                onClick={() => {
                  setTestChannel('email');
                  setTestRecipient(initialSettings?.supportEmail || '');
                }}
                className={cn(
                  'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all',
                  testChannel === 'email' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'
                )}
              >
                Email Channel
              </button>
              <button
                type="button"
                onClick={() => {
                  setTestChannel('sms');
                  setTestRecipient('03001234567');
                }}
                className={cn(
                  'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all',
                  testChannel === 'sms' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'
                )}
              >
                SMS Channel
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                {testChannel === 'email' ? 'Recipient Email Address' : 'Recipient Phone Number'}
              </label>
              <Input
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder={testChannel === 'email' ? 'you@example.com' : '03001234567'}
                className="rounded-xl text-sm"
              />
            </div>

            <div className="rounded-xl border border-border/80 bg-muted/30 p-3 text-[11px] text-muted-foreground space-y-1">
              <p><strong>Selected Trigger:</strong> {currentTemplate.name}</p>
              <p>
                <strong>Preview:</strong>{' '}
                {interpolate(testChannel === 'email' ? currentTemplate.subject : currentTemplate.smsBody)}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTestOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSendTest}
              disabled={isSendingTest}
              className="rounded-xl font-bold bg-primary text-primary-foreground"
            >
              <Send className="mr-1.5 size-4" /> {isSendingTest ? 'Sending...' : 'Dispatch Test'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
