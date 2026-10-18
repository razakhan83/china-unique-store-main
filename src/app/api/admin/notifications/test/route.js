import { NextResponse } from 'next/server';
import { requireApiAdmin } from '@/lib/requireAdmin';
import { Resend } from 'resend';
import { getStoreSettings } from '@/lib/data';

export async function POST(req) {
  try {
    const auth = await requireApiAdmin({ mutation: true });
    if (auth.error) return auth.error;

    const body = await req.json();
    const { channel = 'email', to, triggerKey = 'order_placed', subject = '', bodyText = '' } = body;

    if (!to || !to.trim()) {
      return NextResponse.json(
        { success: false, error: channel === 'email' ? 'Recipient email is required' : 'Recipient phone number is required' },
        { status: 400 }
      );
    }

    const settings = await getStoreSettings();
    const storeName = settings?.storeName || process.env.NEXT_PUBLIC_STORE_NAME || 'Store';

    if (channel === 'email') {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        return NextResponse.json({
          success: true,
          simulated: true,
          message: `[Simulated] Email preview dispatched to ${to} (Subject: "${subject}"). Set RESEND_API_KEY in environment for live inbox delivery.`,
        });
      }

      const resend = new Resend(apiKey);
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'notifications@store.com';

      // Convert line breaks to HTML paragraphs/breaks if plain text
      const htmlBody = bodyText.includes('<') && bodyText.includes('>')
        ? bodyText
        : `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; line-height: 1.6;">
            <div style="border-bottom: 2px solid #10b981; padding-bottom: 12px; margin-bottom: 20px;">
              <h2 style="margin: 0; color: #064e3b; font-size: 20px;">${storeName}</h2>
              <span style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Test Notification Preview</span>
            </div>
            <div style="white-space: pre-wrap; font-size: 14px; color: #334155;">
              ${bodyText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
            </div>
            <div style="margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center;">
              This is a test notification generated from ${storeName} Admin Panel.
            </div>
          </div>`;

      const result = await resend.emails.send({
        from: `${storeName} <${fromEmail}>`,
        to: [to.trim()],
        subject: subject || `[Test Notification] ${storeName}`,
        html: htmlBody,
      });

      if (result.error) {
        return NextResponse.json({
          success: false,
          error: result.error.message || 'Failed to dispatch email via Resend',
        }, { status: 502 });
      }

      return NextResponse.json({
        success: true,
        message: `Live test email successfully dispatched to ${to}! (Resend ID: ${result.data?.id || 'OK'})`,
      });
    }

    if (channel === 'sms') {
      // Pakistani phone formatting
      const cleanPhone = to.replace(/\D/g, '');
      return NextResponse.json({
        success: true,
        simulated: true,
        message: `SMS preview payload generated for +${cleanPhone}: "${bodyText}". In production, this routes via SMS Gateway API.`,
      });
    }

    return NextResponse.json({ success: false, error: 'Unsupported notification channel' }, { status: 400 });
  } catch (error) {
    console.error('Test notification API error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
