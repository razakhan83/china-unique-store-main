import 'server-only';

import mongooseConnect from '@/lib/mongooseConnect';
import { getSiteUrl } from '@/lib/siteUrl';
import { normalizeSocialUrl } from '@/lib/social';
import { createWhatsAppUrl } from '@/lib/whatsapp';
import Settings from '@/models/Settings';

const SETTINGS_KEY = 'site-settings';
const DEFAULT_BASE_URL = getSiteUrl();

const DEFAULT_BRANDING = {
  baseUrl: DEFAULT_BASE_URL,
  storeName: 'China Unique Store',
  supportEmail: '',
  businessAddress: '',
  lightLogoUrl: '',
  darkLogoUrl: '',
  emailLogoScalePercent: 100,
  facebookPageUrl: '',
  instagramUrl: '',
  whatsappNumber: '',
};

const C = {
  page: '#f4f5f6',
  card: '#ffffff',
  panel: '#f8faf9',
  border: '#e2e8f0',
  borderSoft: '#edf2f7',
  text: '#0f172a',
  textSecondary: '#334155',
  muted: '#64748b',
  light: '#94a3b8',
  accent: '#0f766e',
  accentDark: '#115e59',
  accentLight: '#14b8a6',
  accentTint: '#f0fdfa',
  accentBorder: '#ccfbf1',
  white: '#ffffff',
  goldTint: '#fffbeb',
  goldBorder: '#fde68a',
  goldText: '#92400e',
  goldLabel: '#b45309',
  greenBg: '#ecfdf5',
  greenText: '#065f46',
  greenBorder: '#a7f3d0',
};

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

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

function toAbsoluteEmailUrl(url, baseUrl = DEFAULT_BASE_URL) {
  const cleanUrl = String(url || '').trim();
  if (!cleanUrl) return '';
  if (/^https?:\/\//i.test(cleanUrl)) return cleanUrl;
  if (cleanUrl.startsWith('//')) return `https:${cleanUrl}`;
  const cleanBase = String(baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
  const cleanPath = cleanUrl.replace(/^\/+/, '');
  return `${cleanBase}/${cleanPath}`;
}

function getItems(order, baseUrl = DEFAULT_BASE_URL) {
  if (!Array.isArray(order?.items)) return [];

  return order.items.map((item, index) => {
    const quantity = Math.max(1, getNumber(item?.quantity, 1));
    const unitPrice = getNumber(item?.price);
    const rawImage = getText(item?.image || item?.Image || item?.imageUrl);

    return {
      name: getText(item?.name || item?.Name, `Item ${index + 1}`),
      image: toAbsoluteEmailUrl(rawImage, baseUrl),
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
    };
  });
}

function getPricing(order, items) {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const total = Math.max(getNumber(order?.totalAmount, subtotal), subtotal);
  const discountAmount = getNumber(order?.discountAmount, 0);
  const shipping = getNumber(order?.shippingAmount, Math.max(total - subtotal + discountAmount, 0));
  return { subtotal, shipping, discountAmount, total };
}

function buildOrderUrl(order, baseUrl) {
  const orderId = getText(order?._id);
  const secureToken = getText(order?.secureToken);

  if (orderId && secureToken) return `${baseUrl}/orders/${orderId}?token=${encodeURIComponent(secureToken)}`;
  if (orderId) return `${baseUrl}/orders/${orderId}`;
  return `${baseUrl}/orders`;
}

function getLogoUrl(branding) {
  const raw = getText(branding?.darkLogoUrl || branding?.lightLogoUrl);
  if (!raw) return '';
  return toAbsoluteEmailUrl(raw, branding?.baseUrl);
}

function getFooterDarkLogoUrl(branding) {
  const customFooterLogo = getText(branding?.darkLogoUrl || branding?.lightLogoUrl);
  if (customFooterLogo) {
    return toAbsoluteEmailUrl(customFooterLogo, branding?.baseUrl);
  }
  const baseUrl = getText(branding?.baseUrl, DEFAULT_BASE_URL).replace(/\/+$/, '');
  return `${baseUrl}/email-footer-logo-dark-cropped.png`;
}

function getEmailLogoScalePercent(branding) {
  return Math.min(200, Math.max(40, getNumber(branding?.emailLogoScalePercent, 100)));
}

function renderEmailLogo(branding, align = 'center') {
  const logoUrl = getLogoUrl(branding);
  const storeName = esc(branding?.storeName || 'China Unique');

  if (!logoUrl) {
    return `<div style="font-family:${FONT};font-size:20px;font-weight:800;color:${C.accent};text-align:${align};letter-spacing:-0.02em;">${storeName}</div>`;
  }

  const scale = getEmailLogoScalePercent(branding) / 100;
  const width = Math.round(160 * scale);
  const maxHeight = Math.round(54 * scale);

  return `<img src="${esc(logoUrl)}" alt="${storeName}" width="${width}" style="display:inline-block;width:auto;max-width:${width}px;max-height:${maxHeight}px;height:auto;border:0;outline:none;-ms-interpolation-mode:bicubic;vertical-align:middle;">`;
}

function renderProductRowMobile(item) {
  const imageHtml = item.image
    ? `<img src="${esc(item.image)}" alt="${esc(item.name)}" width="52" height="52" style="display:block;width:52px;height:52px;border-radius:8px;object-fit:cover;border:1px solid ${C.borderSoft};">`
    : `<table cellpadding="0" cellspacing="0" border="0" width="52" height="52" style="width:52px;height:52px;background:${C.panel};border:1px solid ${C.borderSoft};border-radius:8px;"><tr><td align="center" valign="middle" style="font-family:${FONT};font-size:10px;color:${C.light};font-weight:600;">ITEM</td></tr></table>`;

  return `
    <tr>
      <td style="padding:10px 14px;border-top:1px solid ${C.borderSoft};">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td width="58" valign="top" style="padding-right:10px;vertical-align:top;">
              ${imageHtml}
            </td>
            <td valign="top" align="left" style="vertical-align:top;">
              <div style="font-family:${FONT};font-size:13px;line-height:18px;font-weight:600;color:${C.text};word-break:break-word;">${esc(item.name)}</div>
              <div style="padding-top:2px;font-family:${FONT};font-size:12px;line-height:16px;color:${C.muted};">
                Qty: <strong style="color:${C.textSecondary};">${item.quantity}</strong> &times; ${esc(formatCurrency(item.unitPrice))}
              </div>
            </td>
            <td width="80" valign="top" align="right" style="vertical-align:top;white-space:nowrap;padding-left:8px;">
              <div style="font-family:${FONT};font-size:13px;line-height:18px;font-weight:700;color:${C.text};">${esc(formatCurrency(item.lineTotal))}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function renderPricingSummaryMobile(pricing) {
  return `
    <tr>
      <td style="padding:12px 14px;background:${C.panel};border-top:1px solid ${C.border};">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="padding:3px 0;font-family:${FONT};font-size:13px;line-height:18px;color:${C.muted};">Subtotal</td>
            <td align="right" style="padding:3px 0;font-family:${FONT};font-size:13px;line-height:18px;font-weight:600;color:${C.text};">${esc(formatCurrency(pricing.subtotal))}</td>
          </tr>
          ${pricing.discountAmount > 0 ? `
          <tr>
            <td style="padding:3px 0;font-family:${FONT};font-size:13px;line-height:18px;color:#16a34a;">Discount</td>
            <td align="right" style="padding:3px 0;font-family:${FONT};font-size:13px;line-height:18px;font-weight:600;color:#16a34a;">-${esc(formatCurrency(pricing.discountAmount))}</td>
          </tr>` : ''}
          <tr>
            <td style="padding:3px 0;font-family:${FONT};font-size:13px;line-height:18px;color:${C.muted};">Shipping Fee</td>
            <td align="right" style="padding:3px 0;font-family:${FONT};font-size:13px;line-height:18px;font-weight:600;color:${C.text};">${pricing.shipping > 0 ? esc(formatCurrency(pricing.shipping)) : '<span style="color:#16a34a;font-weight:700;">FREE</span>'}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding:6px 0 0;">
              <div style="border-top:1px solid ${C.border};"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0 0;font-family:${FONT};font-size:15px;line-height:20px;font-weight:800;color:${C.text};">Grand Total</td>
            <td align="right" style="padding:8px 0 0;font-family:${FONT};font-size:17px;line-height:20px;font-weight:800;color:${C.accent};">${esc(formatCurrency(pricing.total))}</td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function renderSocialButtons(branding) {
  const links = [
    { href: normalizeSocialUrl(branding?.facebookPageUrl), label: 'Facebook', bg: '#1877F2' },
    { href: normalizeSocialUrl(branding?.instagramUrl), label: 'Instagram', bg: '#E4405F' },
    { href: createWhatsAppUrl(branding?.whatsappNumber), label: 'WhatsApp', bg: '#25D366' },
  ].filter((link) => link.href);

  if (!links.length) return '';

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:12px auto 0;">
      <tr>
        ${links.map((link) => `
          <td style="padding:0 4px;">
            <a href="${esc(link.href)}" target="_blank" style="display:inline-block;padding:6px 12px;border-radius:6px;background:${link.bg};color:#ffffff;text-decoration:none;font-family:${FONT};font-size:11px;font-weight:700;line-height:14px;">${esc(link.label)}</a>
          </td>
        `).join('')}
      </tr>
    </table>`;
}

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
      emailLogoScalePercent: Math.min(200, Math.max(40, Number(settings.emailLogoScalePercent || 100))),
      facebookPageUrl: getText(settings.facebookPageUrl),
      instagramUrl: getText(settings.instagramUrl),
      whatsappNumber: getText(settings.whatsappNumber),
    };
  } catch (error) {
    console.error('Failed to load email branding settings:', error);
    return { ...DEFAULT_BRANDING };
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. ADMIN ORDER NOTIFICATION EMAIL (Mobile 1st Approach)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function generateOrderEmailHtml(order, brandingInput = {}) {
  const branding = { ...DEFAULT_BRANDING, ...brandingInput };
  const items = getItems(order, branding.baseUrl);
  const pricing = getPricing(order, items);
  const adminUrl = `${branding.baseUrl}/admin/orders`;
  const customerName = getText(order?.customerName, 'Customer');
  const customerPhone = getText(order?.customerPhone, 'Not provided');
  const customerEmail = getText(order?.customerEmail, 'Not provided');
  const customerAddress = getText(order?.customerAddress, 'Not provided');
  const customerCity = getText(order?.customerCity);
  const landmark = getText(order?.landmark);
  const notes = getText(order?.notes);
  const orderId = getText(order?.orderId, 'Pending');
  const createdAt = formatDate(order?.createdAt, { timeStyle: 'short' });
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const rawPhoneDigits = customerPhone.replace(/\D/g, '');
  const cleanPhoneForWhatsApp = rawPhoneDigits.startsWith('03') ? `92${rawPhoneDigits.slice(1)}` : rawPhoneDigits;
  const whatsappUrl = rawPhoneDigits ? `https://wa.me/${cleanPhoneForWhatsApp}` : '';
  const phoneCallUrl = rawPhoneDigits ? `tel:${customerPhone}` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <title>${esc(`New Order Alert: ${orderId} - ${customerName}`)}</title>
  <!--[if mso]><style>table,td{font-family:Arial,Helvetica,sans-serif!important;}</style><![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    @media only screen and (max-width: 580px) {
      .container { width: 100% !important; max-width: 100% !important; padding: 8px !important; }
      .card { border-radius: 12px !important; }
      .p-mobile { padding: 14px 12px !important; }
      .btn-full { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; }
      .action-col { display: block !important; width: 100% !important; padding: 4px 0 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${C.page};font-family:${FONT};color:${C.text};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(`New Order ${orderId} from ${customerName} - ${formatCurrency(pricing.total)}`)}</div>
  
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${C.page};padding:16px 0;">
    <tr>
      <td align="center" valign="top">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="container" style="width:100%;max-width:540px;margin:0 auto;">
          
          <!-- Logo & Admin Badge -->
          <tr>
            <td align="center" style="padding:8px 12px 14px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="left" valign="middle">
                    ${renderEmailLogo(branding, 'left')}
                  </td>
                  <td align="right" valign="middle">
                    <span style="display:inline-block;padding:4px 10px;border-radius:20px;background:${C.accentTint};border:1px solid ${C.accentBorder};color:${C.accentDark};font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">Admin Notification</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card Container -->
          <tr>
            <td>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="card" style="background-color:${C.card};border:1px solid ${C.border};border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
                
                <!-- Order Alert Banner -->
                <tr>
                  <td style="padding:16px 16px 14px;background:${C.accentTint};border-bottom:1px solid ${C.accentBorder};">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td valign="top">
                          <div style="font-size:11px;line-height:14px;font-weight:700;color:${C.accentDark};letter-spacing:0.08em;text-transform:uppercase;">🎉 New Order Received</div>
                          <div style="font-size:18px;line-height:24px;font-weight:800;color:${C.text};padding-top:2px;">${esc(customerName)}</div>
                          <div style="font-size:12px;line-height:16px;color:${C.muted};padding-top:2px;">
                            ID: <strong style="color:${C.text};">${esc(orderId)}</strong> &middot; ${esc(createdAt)}
                          </div>
                        </td>
                        <td align="right" valign="top" style="white-space:nowrap;padding-left:8px;">
                          <div style="font-size:18px;line-height:22px;font-weight:800;color:${C.accent};">${esc(formatCurrency(pricing.total))}</div>
                          <div style="font-size:11px;line-height:14px;font-weight:600;color:${C.muted};">${itemCount} item${itemCount !== 1 ? 's' : ''} (COD)</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Quick Action Buttons for Admin on Phone -->
                <tr>
                  <td class="p-mobile" style="padding:12px 16px;background:${C.panel};border-bottom:1px solid ${C.border};">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        ${phoneCallUrl ? `
                        <td class="action-col" width="50%" style="padding-right:4px;">
                          <a href="${esc(phoneCallUrl)}" class="btn-full" style="display:block;padding:9px 12px;border-radius:8px;background:#ffffff;border:1px solid ${C.border};color:${C.text};text-decoration:none;font-size:12px;font-weight:700;text-align:center;">
                            📞 Call Customer
                          </a>
                        </td>` : ''}
                        ${whatsappUrl ? `
                        <td class="action-col" width="50%" style="${phoneCallUrl ? 'padding-left:4px;' : ''}">
                          <a href="${esc(whatsappUrl)}" target="_blank" class="btn-full" style="display:block;padding:9px 12px;border-radius:8px;background:#25D366;color:#ffffff;text-decoration:none;font-size:12px;font-weight:700;text-align:center;">
                            💬 WhatsApp Chat
                          </a>
                        </td>` : ''}
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Customer Details Block -->
                <tr>
                  <td class="p-mobile" style="padding:14px 16px;">
                    <div style="font-size:11px;line-height:14px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${C.muted};margin-bottom:8px;">Customer & Delivery Info</div>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.panel};border:1px solid ${C.borderSoft};border-radius:10px;">
                      <tr>
                        <td style="padding:12px 14px;font-size:13px;line-height:20px;color:${C.textSecondary};">
                          <div style="font-weight:700;color:${C.text};font-size:14px;padding-bottom:4px;">${esc(customerName)}</div>
                          <div><strong>Phone:</strong> <a href="${esc(phoneCallUrl || '#')}" style="color:${C.accent};text-decoration:none;font-weight:600;">${esc(customerPhone)}</a></div>
                          <div><strong>Email:</strong> ${esc(customerEmail)}</div>
                          <div style="padding-top:4px;border-top:1px dashed ${C.borderSoft};margin-top:6px;">
                            <strong>Address:</strong> ${esc(customerAddress)}
                          </div>
                          ${customerCity ? `<div><strong>City:</strong> ${esc(customerCity)}</div>` : ''}
                          ${landmark ? `<div><strong>Landmark:</strong> ${esc(landmark)}</div>` : ''}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Customer Notes (if present) -->
                ${notes ? `
                <tr>
                  <td class="p-mobile" style="padding:0 16px 14px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.goldTint};border:1px solid ${C.goldBorder};border-radius:10px;">
                      <tr>
                        <td style="padding:10px 12px;font-size:12px;line-height:18px;color:${C.goldText};">
                          <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${C.goldLabel};padding-bottom:2px;">Order Note from Customer:</div>
                          ${esc(notes)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>` : ''}

                <!-- Order Items List -->
                <tr>
                  <td class="p-mobile" style="padding:0 16px 16px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ${C.border};border-radius:10px;overflow:hidden;">
                      <tr>
                        <td style="padding:10px 14px;background:${C.panel};font-size:12px;line-height:16px;font-weight:700;color:${C.textSecondary};text-transform:uppercase;letter-spacing:0.05em;">
                          Items Ordered (${itemCount})
                        </td>
                      </tr>
                      ${items.length > 0 ? items.map(renderProductRowMobile).join('') : `<tr><td style="padding:12px;font-size:13px;color:${C.muted};text-align:center;">No items recorded.</td></tr>`}
                      ${renderPricingSummaryMobile(pricing)}
                    </table>
                  </td>
                </tr>

                <!-- Direct Admin Portal CTA Button -->
                <tr>
                  <td class="p-mobile" style="padding:0 16px 20px;" align="center">
                    <a href="${esc(adminUrl)}" class="btn-full" style="display:block;padding:12px 20px;border-radius:10px;background:${C.accent};color:#ffffff;text-decoration:none;font-size:14px;line-height:20px;font-weight:700;text-align:center;">
                      Open in Admin Orders Portal &rarr;
                    </a>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer Notice -->
          <tr>
            <td align="center" style="padding:16px 12px 24px;font-size:11px;line-height:16px;color:${C.light};">
              This is an automated administrative notification sent from ${esc(branding.storeName)}.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 2. CUSTOMER ORDER CONFIRMATION / RESEND EMAIL (Mobile 1st Approach)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function generateCustomerOrderConfirmationHtml(order, brandingInput = {}) {
  const branding = { ...DEFAULT_BRANDING, ...brandingInput };
  const items = getItems(order, branding.baseUrl);
  const pricing = getPricing(order, items);
  const customerName = getText(order?.customerName, 'Valued Customer');
  const firstName = customerName.split(/\s+/)[0] || customerName;
  const orderId = getText(order?.orderId, 'Pending');
  const shippingAddress = getText(order?.customerAddress, 'Address will be confirmed.');
  const customerCity = getText(order?.customerCity);
  const customerPhone = getText(order?.customerPhone);
  const landmark = getText(order?.landmark);
  const notes = getText(order?.notes);
  const orderUrl = buildOrderUrl(order, branding.baseUrl);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const itemSummary = itemCount === 1 ? '1 item' : `${itemCount} items`;
  const supportEmail = getText(branding?.supportEmail);
  const whatsappHref = createWhatsAppUrl(branding?.whatsappNumber);
  const businessAddress = getText(branding?.businessAddress);
  const storeName = esc(branding.storeName || 'China Unique');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <title>${esc(`Order Confirmed: ${orderId} - ${storeName}`)}</title>
  <!--[if mso]><style>table,td{font-family:Arial,Helvetica,sans-serif!important;}</style><![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    @media only screen and (max-width: 580px) {
      .container { width: 100% !important; max-width: 100% !important; padding: 6px !important; }
      .card { border-radius: 12px !important; }
      .p-mobile { padding: 14px 12px !important; }
      .hero-pad { padding: 22px 14px 18px !important; }
      .btn-full { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; }
      .stack-col { display: block !important; width: 100% !important; box-sizing: border-box !important; padding-left: 0 !important; padding-right: 0 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${C.page};font-family:${FONT};color:${C.text};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(`Order ${orderId} confirmed! ${itemSummary} totaling ${formatCurrency(pricing.total)}.`)}</div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${C.page};padding:12px 0;">
    <tr>
      <td align="center" valign="top">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="container" style="width:100%;max-width:540px;margin:0 auto;">
          
          <!-- Top Header: Logo + Contact link -->
          <tr>
            <td style="padding:10px 12px 14px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="left" valign="middle">
                    ${renderEmailLogo(branding, 'left')}
                  </td>
                  <td align="right" valign="middle">
                    <a href="${esc(orderUrl)}" target="_blank" style="font-size:12px;line-height:16px;color:${C.accent};font-weight:700;text-decoration:none;padding:5px 10px;border-radius:6px;background:${C.accentTint};border:1px solid ${C.accentBorder};display:inline-block;">
                      Track Order &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="card" style="background-color:${C.card};border:1px solid ${C.border};border-radius:16px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.03);">
                
                <!-- Hero Header Banner -->
                <tr>
                  <td class="hero-pad" align="center" style="padding:30px 20px 24px;background:linear-gradient(180deg, ${C.accentTint} 0%, #ffffff 100%);text-align:center;border-bottom:1px solid ${C.borderSoft};">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 12px;">
                      <tr>
                        <td align="center" valign="middle" style="width:48px;height:48px;background:${C.accent};border-radius:50%;color:#ffffff;font-size:24px;line-height:48px;font-weight:700;text-align:center;">
                          &#10003;
                        </td>
                      </tr>
                    </table>
                    <div style="font-size:11px;line-height:14px;font-weight:700;color:${C.accent};letter-spacing:0.12em;text-transform:uppercase;margin-bottom:4px;">Order Confirmed</div>
                    <div style="font-size:22px;line-height:28px;font-weight:800;color:${C.text};margin-bottom:6px;">Thank You, ${esc(firstName)}!</div>
                    <div style="font-size:13px;line-height:20px;color:${C.muted};max-width:380px;margin:0 auto 16px;">
                      We have received your order and are currently preparing it for dispatch.
                    </div>
                    <a href="${esc(orderUrl)}" target="_blank" class="btn-full" style="display:inline-block;padding:12px 28px;border-radius:10px;background:${C.accent};color:#ffffff;font-size:14px;line-height:20px;font-weight:700;text-decoration:none;text-align:center;box-shadow:0 2px 6px rgba(15,118,110,0.25);">
                      View & Track Your Order
                    </a>
                  </td>
                </tr>

                <!-- Status Progress Ribbon -->
                <tr>
                  <td style="padding:10px 16px;background:${C.panel};border-bottom:1px solid ${C.border};">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="left" style="font-size:12px;line-height:16px;color:${C.muted};">
                          Order Number: <strong style="color:${C.text};">${esc(orderId)}</strong>
                        </td>
                        <td align="right" style="font-size:12px;line-height:16px;color:${C.accentDark};font-weight:700;">
                          ● Processing
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Items Ordered Section -->
                <tr>
                  <td class="p-mobile" style="padding:16px;">
                    <div style="font-size:11px;line-height:14px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${C.muted};margin-bottom:10px;">
                      Your Ordered Items (${itemCount})
                    </div>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ${C.border};border-radius:10px;overflow:hidden;">
                      ${items.length > 0 ? items.map(renderProductRowMobile).join('') : `<tr><td style="padding:14px;font-size:13px;color:${C.muted};text-align:center;">Order details are being processed.</td></tr>`}
                      ${renderPricingSummaryMobile(pricing)}
                    </table>
                  </td>
                </tr>

                <!-- Delivery & Shipping Details -->
                <tr>
                  <td class="p-mobile" style="padding:0 16px 16px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td class="stack-col" valign="top" style="background:${C.panel};border:1px solid ${C.borderSoft};border-radius:10px;padding:12px 14px;">
                          <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${C.muted};margin-bottom:6px;">Delivery Details</div>
                          <div style="font-weight:700;color:${C.text};font-size:14px;margin-bottom:2px;">${esc(customerName)}</div>
                          <div style="font-size:13px;line-height:18px;color:${C.textSecondary};">${esc(shippingAddress)}</div>
                          ${customerCity ? `<div style="font-size:13px;line-height:18px;color:${C.textSecondary};">${esc(customerCity)}</div>` : ''}
                          ${landmark ? `<div style="font-size:12px;line-height:16px;color:${C.muted};margin-top:2px;">Landmark: ${esc(landmark)}</div>` : ''}
                          ${customerPhone ? `<div style="font-size:13px;line-height:18px;color:${C.textSecondary};margin-top:4px;"><strong>Phone:</strong> ${esc(customerPhone)}</div>` : ''}
                          <div style="font-size:12px;line-height:16px;color:${C.muted};margin-top:4px;"><strong>Payment:</strong> Cash on Delivery (COD)</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Order Notes if available -->
                ${notes ? `
                <tr>
                  <td class="p-mobile" style="padding:0 16px 16px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.goldTint};border:1px solid ${C.goldBorder};border-radius:10px;">
                      <tr>
                        <td style="padding:10px 12px;font-size:12px;line-height:18px;color:${C.goldText};">
                          <strong>Order Note:</strong> ${esc(notes)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>` : ''}

                <!-- Customer Support Help Box -->
                <tr>
                  <td class="p-mobile" style="padding:0 16px 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.panel};border:1px dashed ${C.border};border-radius:10px;text-align:center;">
                      <tr>
                        <td style="padding:14px 12px;text-align:center;">
                          <div style="font-size:13px;font-weight:700;color:${C.text};margin-bottom:4px;">Need help with your order?</div>
                          <div style="font-size:12px;line-height:18px;color:${C.muted};margin-bottom:10px;">
                            Our friendly support team is here to assist you anytime.
                          </div>
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                            <tr>
                              ${whatsappHref ? `
                              <td style="padding:0 4px;">
                                <a href="${esc(whatsappHref)}" target="_blank" style="display:inline-block;padding:7px 14px;border-radius:6px;background:#25D366;color:#ffffff;font-size:12px;font-weight:700;text-decoration:none;">
                                  WhatsApp Us
                                </a>
                              </td>` : ''}
                              ${supportEmail ? `
                              <td style="padding:0 4px;">
                                <a href="mailto:${esc(supportEmail)}" style="display:inline-block;padding:7px 14px;border-radius:6px;background:#ffffff;border:1px solid ${C.border};color:${C.text};font-size:12px;font-weight:700;text-decoration:none;">
                                  Email Support
                                </a>
                              </td>` : ''}
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer Block -->
          <tr>
            <td align="center" style="padding:20px 12px 24px;text-align:center;">
              <div style="font-size:13px;font-weight:700;color:${C.textSecondary};margin-bottom:4px;">${storeName}</div>
              ${businessAddress ? `<div style="font-size:12px;line-height:16px;color:${C.muted};margin-bottom:6px;">${esc(businessAddress)}</div>` : ''}
              ${renderSocialButtons(branding)}
              <div style="font-size:11px;line-height:16px;color:${C.light};margin-top:12px;">
                You received this email because you placed an order on our store.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
