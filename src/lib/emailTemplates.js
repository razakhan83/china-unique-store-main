import 'server-only';

import mongooseConnect from '@/lib/mongooseConnect';
import { normalizeSocialUrl } from '@/lib/social';
import { createWhatsAppUrl } from '@/lib/whatsapp';
import Settings from '@/models/Settings';

const SETTINGS_KEY = 'site-settings';
const DEFAULT_BASE_URL = process.env.NEXTAUTH_URL || 'https://chinaunique.pk';

const DEFAULT_BRANDING = {
  baseUrl: DEFAULT_BASE_URL,
  storeName: 'China Unique Store',
  supportEmail: '',
  businessAddress: '',
  lightLogoUrl: '',
  darkLogoUrl: '',
  facebookPageUrl: '',
  instagramUrl: '',
  whatsappNumber: '',
};

// ─── Color palette ────────────────────────────────────────────────────────────
const C = {
  page: '#f4f2ee',
  card: '#ffffff',
  panel: '#f7f8f7',
  border: '#e0e4e1',
  borderSoft: '#ebeeed',
  text: '#18201c',
  textSecondary: '#374740',
  muted: '#5e6e66',
  light: '#94a39b',
  accent: '#0f766e',
  accentDark: '#0a5a54',
  accentTint: '#e7f5f1',
  accentBadge: '#d1fae5',
  white: '#ffffff',
  goldTint: '#faf6ec',
  goldBorder: '#ead8b4',
  goldText: '#725426',
  goldLabel: '#9a6b11',
};

const FONT = 'Arial, Helvetica, sans-serif';

// ─── Utility helpers ──────────────────────────────────────────────────────────

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function getNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function formatCurrency(value) {
  return `Rs. ${getNumber(value).toLocaleString('en-PK')}`;
}

function formatDate(value, options = {}) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return date.toLocaleString('en-PK', { dateStyle: 'medium', ...options });
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function getItems(order) {
  if (!Array.isArray(order?.items)) return [];
  return order.items.map((item, index) => {
    const quantity = Math.max(1, getNumber(item?.quantity, 1));
    const unitPrice = getNumber(item?.price);
    return {
      name: getText(item?.name || item?.Name, `Item ${index + 1}`),
      image: getText(item?.image || item?.Image || item?.imageUrl),
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
    };
  });
}

function getPricing(order, items) {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const total = Math.max(getNumber(order?.totalAmount, subtotal), subtotal);
  const shipping = Math.max(total - subtotal, 0);
  return { subtotal, shipping, total };
}

function buildOrderUrl(order, baseUrl) {
  const orderId = getText(order?._id);
  const secureToken = getText(order?.secureToken);
  if (orderId && secureToken) return `${baseUrl}/orders/${orderId}?token=${encodeURIComponent(secureToken)}`;
  if (orderId) return `${baseUrl}/orders/${orderId}`;
  return `${baseUrl}/orders`;
}

function getLogoUrl(branding) {
  return getText(branding?.lightLogoUrl || branding?.darkLogoUrl);
}

// ─── Reusable email fragments ─────────────────────────────────────────────────

function renderLogo(branding) {
  const logoUrl = getLogoUrl(branding);
  if (!logoUrl) return '';
  return `
    <tr><td align="center" style="padding: 24px 20px 0;">
      <img src="${esc(logoUrl)}" alt="${esc(branding?.storeName || 'Store')}" width="140" style="display:block;width:auto;max-width:140px;height:auto;border:0;">
    </td></tr>`;
}

function renderProductRow(item) {
  const imageHtml = item.image
    ? `<img src="${esc(item.image)}" alt="${esc(item.name)}" width="56" height="56" style="display:block;width:56px;height:56px;border-radius:10px;object-fit:cover;border:1px solid ${C.borderSoft};">`
    : '';

  return `
    <tr><td style="padding:12px 14px;border-top:1px solid ${C.borderSoft};">
      ${imageHtml ? `<div style="padding-bottom:8px;">${imageHtml}</div>` : ''}
      <div style="font-family:${FONT};font-size:14px;line-height:20px;font-weight:600;color:${C.text};word-break:break-word;">${esc(item.name)}</div>
      <div style="padding-top:2px;font-family:${FONT};font-size:12px;line-height:18px;color:${C.muted};">Qty: ${item.quantity} × ${esc(formatCurrency(item.unitPrice))}</div>
      <div style="padding-top:2px;font-family:${FONT};font-size:14px;line-height:20px;font-weight:700;color:${C.text};">${esc(formatCurrency(item.lineTotal))}</div>
    </td></tr>`;
}

function renderPricingSummary(pricing) {
  return `
    <tr><td style="padding:12px 14px;background:${C.panel};border-top:1px solid ${C.border};">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:3px 0;font-family:${FONT};font-size:13px;line-height:20px;color:${C.muted};">Subtotal</td>
          <td align="right" style="padding:3px 0;font-family:${FONT};font-size:13px;line-height:20px;font-weight:600;color:${C.text};">${esc(formatCurrency(pricing.subtotal))}</td>
        </tr>
        <tr>
          <td style="padding:3px 0;font-family:${FONT};font-size:13px;line-height:20px;color:${C.muted};">Shipping</td>
          <td align="right" style="padding:3px 0;font-family:${FONT};font-size:13px;line-height:20px;font-weight:600;color:${C.text};">${esc(formatCurrency(pricing.shipping))}</td>
        </tr>
        <tr><td colspan="2" style="padding:6px 0 0;"><div style="border-top:1px solid ${C.border};"></div></td></tr>
        <tr>
          <td style="padding:6px 0 0;font-family:${FONT};font-size:15px;line-height:22px;font-weight:700;color:${C.accent};">Total</td>
          <td align="right" style="padding:6px 0 0;font-family:${FONT};font-size:15px;line-height:22px;font-weight:700;color:${C.accent};">${esc(formatCurrency(pricing.total))}</td>
        </tr>
      </table>
    </td></tr>`;
}

function renderSocialLinks(branding) {
  const links = [
    { href: normalizeSocialUrl(branding?.facebookPageUrl), label: 'Facebook' },
    { href: normalizeSocialUrl(branding?.instagramUrl), label: 'Instagram' },
    { href: createWhatsAppUrl(branding?.whatsappNumber), label: 'WhatsApp' },
  ].filter((l) => l.href);
  if (!links.length) return '';
  return `
    <tr><td align="center" style="padding:0 20px 8px;font-family:${FONT};font-size:12px;line-height:18px;color:${C.muted};">
      ${links.map((l) => `<a href="${esc(l.href)}" style="color:${C.accent};text-decoration:none;font-weight:600;">${esc(l.label)}</a>`).join(`<span style="color:${C.light};padding:0 4px;">·</span>`)}
    </td></tr>`;
}

// ─── Email wrapper shell ──────────────────────────────────────────────────────

function renderShell({ previewText, content }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${esc(previewText)}</title>
  <!--[if mso]><style>table,td{font-family:Arial,Helvetica,sans-serif!important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:${C.page};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(previewText)}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.page};padding:16px 8px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:520px;">
        <tr><td style="background:${C.card};border:1px solid ${C.border};border-radius:16px;overflow:hidden;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${content}
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Branding loader ──────────────────────────────────────────────────────────

export async function getEmailBranding() {
  try {
    await mongooseConnect();
    const settings = await Settings.findOne({ singletonKey: SETTINGS_KEY }).lean();
    if (!settings) return { ...DEFAULT_BRANDING };
    return {
      baseUrl: DEFAULT_BASE_URL,
      storeName: getText(settings.storeName, DEFAULT_BRANDING.storeName),
      supportEmail: getText(settings.supportEmail),
      businessAddress: getText(settings.businessAddress),
      lightLogoUrl: getText(settings.lightLogoUrl),
      darkLogoUrl: getText(settings.darkLogoUrl),
      facebookPageUrl: getText(settings.facebookPageUrl),
      instagramUrl: getText(settings.instagramUrl),
      whatsappNumber: getText(settings.whatsappNumber),
    };
  } catch (error) {
    console.error('Failed to load email branding settings:', error);
    return { ...DEFAULT_BRANDING };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN ORDER NOTIFICATION EMAIL
// ═══════════════════════════════════════════════════════════════════════════════

export function generateOrderEmailHtml(order, brandingInput = {}) {
  const branding = { ...DEFAULT_BRANDING, ...brandingInput };
  const items = getItems(order);
  const pricing = getPricing(order, items);
  const adminUrl = `${branding.baseUrl}/admin/orders`;
  const customerName = getText(order?.customerName, 'Customer');
  const customerPhone = getText(order?.customerPhone, 'Not provided');
  const customerEmail = getText(order?.customerEmail, 'Not provided');
  const customerAddress = getText(order?.customerAddress, 'Not provided');
  const customerCity = getText(order?.customerCity);
  const notes = getText(order?.notes);
  const orderId = getText(order?.orderId, 'Pending');
  const createdAt = formatDate(order?.createdAt, { timeStyle: 'short' });
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const content = `
    ${renderLogo(branding)}

    <!-- Header -->
    <tr><td style="padding:4px 20px 0;font-family:${FONT};font-size:11px;line-height:16px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${C.accent};">
      New order received
    </td></tr>
    <tr><td style="padding:6px 20px 0;font-family:${FONT};font-size:22px;line-height:28px;font-weight:700;color:${C.text};">
      ${esc(customerName)}
    </td></tr>
    <tr><td style="padding:6px 20px 0;font-family:${FONT};font-size:13px;line-height:20px;color:${C.muted};">
      Order <strong style="color:${C.text};">${esc(orderId)}</strong> · ${esc(createdAt)} · ${itemCount} item${itemCount !== 1 ? 's' : ''} · <strong style="color:${C.text};">${esc(formatCurrency(pricing.total))}</strong>
    </td></tr>

    <!-- Customer info — stacked rows, no columns -->
    <tr><td style="padding:16px 20px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ${C.border};border-radius:14px;overflow:hidden;">
        <tr><td style="padding:14px 16px;font-family:${FONT};font-size:13px;line-height:22px;color:${C.muted};">
          <div style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${C.light};font-weight:700;padding-bottom:6px;">Customer Details</div>
          <div style="font-size:14px;font-weight:700;color:${C.text};padding-bottom:2px;">${esc(customerName)}</div>
          <div>Phone: ${esc(customerPhone)}</div>
          <div>Email: ${esc(customerEmail)}</div>
          <div style="padding-top:4px;">${esc(customerAddress)}</div>
          ${customerCity ? `<div>${esc(customerCity)}</div>` : ''}
        </td></tr>
      </table>
    </td></tr>

    <!-- Products -->
    <tr><td style="padding:16px 20px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ${C.border};border-radius:14px;overflow:hidden;">
        <tr><td style="padding:14px 14px 8px;font-family:${FONT};font-size:15px;line-height:20px;font-weight:700;color:${C.text};">Order Items</td></tr>
        ${items.length > 0 ? items.map(renderProductRow).join('') : `<tr><td style="padding:12px 14px;border-top:1px solid ${C.borderSoft};font-family:${FONT};font-size:13px;color:${C.muted};text-align:center;">No items available.</td></tr>`}
        ${renderPricingSummary(pricing)}
      </table>
    </td></tr>

    ${notes ? `
    <!-- Notes -->
    <tr><td style="padding:14px 20px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.goldTint};border:1px solid ${C.goldBorder};border-radius:12px;">
        <tr><td style="padding:12px 14px;font-family:${FONT};font-size:13px;line-height:20px;color:${C.goldText};">
          <div style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${C.goldLabel};font-weight:700;padding-bottom:4px;">Order Notes</div>
          ${esc(notes)}
        </td></tr>
      </table>
    </td></tr>` : ''}

    <!-- CTA -->
    <tr><td align="center" style="padding:20px 20px 14px;">
      <a href="${esc(adminUrl)}" style="display:inline-block;padding:12px 24px;border-radius:10px;background:${C.accent};color:${C.white};text-decoration:none;font-family:${FONT};font-size:13px;line-height:20px;font-weight:700;">Manage Order</a>
    </td></tr>

    <!-- Footer -->
    <tr><td style="padding:0 20px 24px;font-family:${FONT};font-size:11px;line-height:16px;color:${C.light};text-align:center;">
      Automated notification from ${esc(branding.storeName)}.
    </td></tr>`;

  return renderShell({
    previewText: `New order ${orderId} from ${customerName} — ${formatCurrency(pricing.total)}`,
    content,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOMER ORDER CONFIRMATION EMAIL
// ═══════════════════════════════════════════════════════════════════════════════

export function generateCustomerOrderConfirmationHtml(order, brandingInput = {}) {
  const branding = { ...DEFAULT_BRANDING, ...brandingInput };
  const items = getItems(order);
  const pricing = getPricing(order, items);
  const customerName = getText(order?.customerName, 'Customer');
  const firstName = customerName.split(/\s+/)[0] || customerName;
  const orderId = getText(order?.orderId, 'Pending');
  const orderDate = formatDate(order?.createdAt);
  const shippingAddress = getText(order?.customerAddress, 'Address will be confirmed.');
  const customerCity = getText(order?.customerCity);
  const customerPhone = getText(order?.customerPhone);
  const landmark = getText(order?.landmark);
  const notes = getText(order?.notes);
  const orderUrl = buildOrderUrl(order, branding.baseUrl);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const itemSummary = itemCount === 1 ? '1 item' : `${itemCount} items`;
  const supportEmail = getText(branding?.supportEmail);

  const content = `
    ${renderLogo(branding)}

    <!-- Hero -->
    <tr><td style="padding:20px 20px 8px;text-align:center;">
      <div style="width:40px;height:40px;line-height:40px;border-radius:50%;background:${C.accentTint};font-family:${FONT};font-size:20px;font-weight:700;color:${C.accent};text-align:center;margin:0 auto 6px;">✓</div>
      <div style="font-family:${FONT};font-size:11px;line-height:14px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${C.accent};padding-bottom:4px;">Order Confirmed</div>
      <div style="font-family:${FONT};font-size:22px;line-height:28px;font-weight:700;color:${C.text};padding-bottom:8px;">Thank you, ${esc(firstName)}!</div>
      <div style="font-family:${FONT};font-size:13px;line-height:20px;color:${C.muted};">Your order is in and we&#39;re getting it ready. We&#39;ll update you as it moves to dispatch.</div>
    </td></tr>

    <!-- Progress — single line, no columns -->
    <tr><td align="center" style="padding:14px 20px 0;font-family:${FONT};font-size:13px;line-height:20px;color:${C.light};">
      <strong style="color:${C.accent};">● Confirmed</strong>
      <span style="padding:0 6px;color:${C.light};">→</span>
      <span style="color:${C.muted};font-weight:500;">Preparing</span>
      <span style="padding:0 6px;color:${C.light};">→</span>
      <span style="color:${C.muted};font-weight:500;">Dispatched</span>
    </td></tr>

    <!-- Order info — vertically stacked rows -->
    <tr><td style="padding:16px 20px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.panel};border:1px solid ${C.borderSoft};border-radius:12px;">
        <tr><td style="padding:14px 16px;font-family:${FONT};font-size:13px;line-height:22px;color:${C.text};">
          <div><span style="color:${C.light};font-weight:600;font-size:12px;">Order ID: </span><strong>${esc(orderId)}</strong></div>
          <div><span style="color:${C.light};font-weight:600;font-size:12px;">Date: </span><strong>${esc(orderDate)}</strong></div>
          <div><span style="color:${C.light};font-weight:600;font-size:12px;">Items: </span><strong>${esc(itemSummary)}</strong></div>
          <div><span style="color:${C.light};font-weight:600;font-size:12px;">Payment: </span><strong>${esc(getText(order?.paymentStatus, 'COD'))}</strong></div>
        </td></tr>
      </table>
    </td></tr>

    <!-- Products -->
    <tr><td style="padding:16px 20px 0;">
      <div style="font-family:${FONT};font-size:15px;line-height:20px;font-weight:700;color:${C.text};padding-bottom:8px;">Your order</div>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ${C.border};border-radius:14px;overflow:hidden;">
        ${items.length > 0 ? items.map(renderProductRow).join('') : `<tr><td style="padding:12px 14px;font-family:${FONT};font-size:13px;color:${C.muted};text-align:center;">Order details unavailable.</td></tr>`}
        ${renderPricingSummary(pricing)}
      </table>
    </td></tr>

    <!-- Delivery -->
    <tr><td style="padding:14px 20px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.panel};border:1px solid ${C.borderSoft};border-radius:12px;">
        <tr><td style="padding:14px 16px;font-family:${FONT};font-size:13px;line-height:20px;color:${C.muted};">
          <div style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${C.light};font-weight:700;padding-bottom:6px;">Delivery Details</div>
          <div style="color:${C.textSecondary};word-break:break-word;">${esc(shippingAddress)}</div>
          ${customerCity ? `<div style="color:${C.textSecondary};">${esc(customerCity)}</div>` : ''}
          ${landmark ? `<div style="color:${C.textSecondary};">Landmark: ${esc(landmark)}</div>` : ''}
          ${customerPhone ? `<div style="padding-top:4px;">Phone: ${esc(customerPhone)}</div>` : ''}
        </td></tr>
      </table>
    </td></tr>

    ${notes ? `
    <!-- Notes -->
    <tr><td style="padding:14px 20px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.goldTint};border:1px solid ${C.goldBorder};border-radius:12px;">
        <tr><td style="padding:12px 14px;font-family:${FONT};font-size:13px;line-height:20px;color:${C.goldText};">
          <div style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${C.goldLabel};font-weight:700;padding-bottom:4px;">Order Notes</div>
          ${esc(notes)}
        </td></tr>
      </table>
    </td></tr>` : ''}

    <!-- Next steps -->
    <tr><td style="padding:14px 20px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.panel};border:1px solid ${C.borderSoft};border-radius:12px;">
        <tr><td style="padding:14px 16px;font-family:${FONT};">
          <div style="font-size:14px;line-height:20px;font-weight:700;color:${C.text};padding-bottom:8px;">What happens next</div>
          <div style="font-size:13px;line-height:21px;color:${C.muted};padding-bottom:4px;"><strong style="color:${C.accentDark};">1.</strong> We review your order and confirm stock.</div>
          <div style="font-size:13px;line-height:21px;color:${C.muted};padding-bottom:4px;"><strong style="color:${C.accentDark};">2.</strong> We prepare your package and update tracking.</div>
          <div style="font-size:13px;line-height:21px;color:${C.muted};"><strong style="color:${C.accentDark};">3.</strong> Tap below anytime to check your order.</div>
        </td></tr>
      </table>
    </td></tr>

    <!-- CTA -->
    <tr><td align="center" style="padding:18px 20px 8px;">
      <a href="${esc(orderUrl)}" style="display:block;padding:12px 20px;border-radius:10px;background:${C.accent};color:${C.white};text-decoration:none;font-family:${FONT};font-size:14px;line-height:20px;font-weight:700;text-align:center;">View Order Details</a>
    </td></tr>

    <!-- Support -->
    <tr><td align="center" style="padding:12px 20px 0;font-family:${FONT};font-size:12px;line-height:18px;color:${C.muted};">
      Need help? ${supportEmail ? `Email <a href="mailto:${esc(supportEmail)}" style="color:${C.accent};text-decoration:none;font-weight:600;">${esc(supportEmail)}</a>` : 'Reply to this email.'}
    </td></tr>

    <!-- Footer -->
    <tr><td style="padding:14px 20px 0;"><div style="border-top:1px solid ${C.borderSoft};"></div></td></tr>
    ${renderSocialLinks(branding)}
    <tr><td align="center" style="padding:4px 20px 0;font-family:${FONT};font-size:13px;line-height:18px;font-weight:700;color:${C.text};">
      ${esc(branding.storeName)}
    </td></tr>
    <tr><td align="center" style="padding:0 20px 24px;font-family:${FONT};font-size:11px;line-height:16px;color:${C.light};">
      You received this because you placed an order. Thank you for your trust.
    </td></tr>`;

  return renderShell({
    previewText: `Order ${orderId} confirmed — ${itemSummary}`,
    content,
  });
}
