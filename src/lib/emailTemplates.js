import 'server-only';

import fs from 'node:fs';
import path from 'node:path';

import mongooseConnect from '@/lib/mongooseConnect';
import { getSiteUrl } from '@/lib/siteUrl';
import { normalizeSocialUrl } from '@/lib/social';
import { createWhatsAppUrl } from '@/lib/whatsapp';
import Settings from '@/models/Settings';

const SETTINGS_KEY = 'site-settings';
const DEFAULT_BASE_URL = getSiteUrl();
const FOOTER_DARK_LOGO_FILE = path.join(process.cwd(), 'public', 'email-footer-logo-dark-cropped.png');

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
  white: '#ffffff',
  goldTint: '#faf6ec',
  goldBorder: '#ead8b4',
  goldText: '#725426',
  goldLabel: '#9a6b11',
};

const FONT = 'Arial, Helvetica, sans-serif';
const EMAIL_THEME = {
  accent: C.accent,
  accentDark: C.accentDark,
  accentTint: C.accentTint,
  text: C.text,
  muted: C.muted,
  borderSoft: C.borderSoft,
};

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
  return getText(branding?.darkLogoUrl || branding?.lightLogoUrl);
}

function getFooterDarkLogoUrl(branding) {
  const baseUrl = getText(branding?.baseUrl, DEFAULT_BASE_URL).replace(/\/$/, '');
  return `${baseUrl}/email-footer-logo-dark-cropped.png`;
}

let cachedFooterDarkLogoDataUrl;

function getFooterDarkLogoSrc(branding) {
  if (typeof cachedFooterDarkLogoDataUrl === 'string') {
    return cachedFooterDarkLogoDataUrl;
  }

  try {
    if (fs.existsSync(FOOTER_DARK_LOGO_FILE)) {
      const imageBuffer = fs.readFileSync(FOOTER_DARK_LOGO_FILE);
      cachedFooterDarkLogoDataUrl = `data:image/png;base64,${imageBuffer.toString('base64')}`;
      return cachedFooterDarkLogoDataUrl;
    }
  } catch (error) {
    console.error('Failed to read cropped footer logo asset:', error);
  }

  return getText(branding?.lightLogoUrl || branding?.darkLogoUrl || getFooterDarkLogoUrl(branding));
}

function getEmailLogoScalePercent(branding) {
  return Math.min(200, Math.max(40, getNumber(branding?.emailLogoScalePercent, 100)));
}

function renderLogo(branding) {
  const logoUrl = getLogoUrl(branding);
  if (!logoUrl) return '';

  const scale = getEmailLogoScalePercent(branding) / 100;
  const width = Math.round(280 * scale);
  const maxHeight = Math.round(96 * scale);

  return `
    <tr><td align="center" style="padding:24px 20px 4px;">
      <img src="${esc(logoUrl)}" alt="${esc(branding?.storeName || 'Store')}" width="${width}" style="display:block;width:auto;max-width:${width}px;max-height:${maxHeight}px;height:auto;border:0;">
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
      <div style="padding-top:2px;font-family:${FONT};font-size:12px;line-height:18px;color:${C.muted};">Qty: ${item.quantity} x ${esc(formatCurrency(item.unitPrice))}</div>
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
  ].filter((link) => link.href);

  if (!links.length) return '';

  return `
    <tr><td align="center" style="padding:0 20px 8px;font-family:${FONT};font-size:12px;line-height:18px;color:${C.muted};">
      ${links.map((link) => `<a href="${esc(link.href)}" style="color:${C.accent};text-decoration:none;font-weight:600;">${esc(link.label)}</a>`).join('<span style="color:#94a39b;padding:0 4px;">&middot;</span>')}
    </td></tr>`;
}

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

function renderCustomerEmailLogo(branding) {
  const logoUrl = getLogoUrl(branding);
  const logoAlt = esc(branding?.storeName || 'Store');

  if (!logoUrl) {
    return `<div style="font-family:'Poppins',Arial,Helvetica,sans-serif;font-size:18px;font-weight:600;line-height:1.2;color:${EMAIL_THEME.text};text-align:left;">${logoAlt}</div>`;
  }

  const scale = getEmailLogoScalePercent(branding) / 100;
  const width = Math.round(104 * scale);

  return `<img src="${esc(logoUrl)}" alt="${logoAlt}" style="display:block;outline:0;line-height:100%;-ms-interpolation-mode:bicubic;object-fit:contain;width:${width}px;height:auto;max-width:${width}px;border:0" width="${width}" />`;
}

function renderCustomerEmailFooterLogo(branding) {
  const logoUrl = getFooterDarkLogoSrc(branding);
  const logoAlt = esc(branding?.storeName || 'Store');

  if (!logoUrl) {
    return `<div style="font-family:'Poppins',Arial,Helvetica,sans-serif;font-size:24px;font-weight:600;line-height:1.2;color:${C.white};text-align:center;">${logoAlt}</div>`;
  }

  const scale = getEmailLogoScalePercent(branding) / 100;
  const width = Math.round(116 * scale);

  return `<img src="${esc(logoUrl)}" alt="${logoAlt}" style="display:block;outline:0;line-height:100%;-ms-interpolation-mode:bicubic;object-fit:contain;width:${width}px;height:auto;max-width:${width}px;border:0;margin:0 auto;" width="${width}" />`;
}

function renderCustomerEmailItemCard(item) {
  const imageHtml = item.image
    ? `<img src="${esc(item.image)}" style="display:block;outline:0;line-height:100%;-ms-interpolation-mode:bicubic;width:100px;height:104px;border:0;object-fit:cover;border-radius:10px;" width="100" height="104" alt="${esc(item.name)}" />`
    : `<div style="width:100px;height:104px;border-radius:10px;background:${EMAIL_THEME.accentTint};font-family:'Poppins',Arial,Helvetica,sans-serif;font-size:13px;line-height:104px;text-align:center;color:${EMAIL_THEME.muted};">No image</div>`;

  return `
    <tr>
      <td style="padding:0 0 4px;">
        <table border="0" cellpadding="0" cellspacing="0" role="presentation" bgcolor="#ffffff" style="width:100%;background-color:#FFF;border-radius:10px;">
          <tr>
            <td align="left" valign="top" style="padding:16px;height:auto;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td valign="top" style="width:120px;padding:0 20px 0 0;">${imageHtml}</td>
                  <td valign="top">
                    <div style="padding:9px 0 4px;font-family:'Poppins',Arial,Helvetica,sans-serif;font-size:16px;line-height:1.4;font-weight:600;color:${EMAIL_THEME.text};">${esc(item.name)}</div>
                    <div style="font-family:'Poppins',Arial,Helvetica,sans-serif;font-size:14px;line-height:1.4;color:${EMAIL_THEME.muted};">Qty: ${item.quantity}</div>
                    <div style="font-family:'Poppins',Arial,Helvetica,sans-serif;font-size:14px;line-height:1.4;color:${EMAIL_THEME.muted};">Price: ${esc(formatCurrency(item.unitPrice))}</div>
                  </td>
                  <td align="right" valign="top" style="white-space:nowrap;padding-top:16px;">
                    <div style="font-family:'Poppins',Arial,Helvetica,sans-serif;font-size:16px;line-height:1.4;color:${EMAIL_THEME.text};text-align:right;">${esc(formatCurrency(item.lineTotal))}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function renderCustomerEmailFooterLinks(branding) {
  const links = [
    { href: normalizeSocialUrl(branding?.facebookPageUrl), label: 'Facebook' },
    { href: normalizeSocialUrl(branding?.instagramUrl), label: 'Instagram' },
    { href: createWhatsAppUrl(branding?.whatsappNumber), label: 'WhatsApp' },
  ].filter((link) => link.href);

  if (!links.length) return '';

  return `
    <div style="padding-top:16px;font-family:'Poppins',Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:${C.white};text-align:center;">
      ${links.map((link) => `<a href="${esc(link.href)}" target="_blank" style="color:${C.white};text-decoration:underline;">${esc(link.label)}</a>`).join('<span style="padding:0 8px;">|</span>')}
    </div>`;
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
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const content = `
    ${renderLogo(branding)}
    <tr><td style="padding:4px 20px 0;font-family:${FONT};font-size:11px;line-height:16px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${C.accent};">
      New order received
    </td></tr>
    <tr><td style="padding:6px 20px 0;font-family:${FONT};font-size:22px;line-height:28px;font-weight:700;color:${C.text};">
      ${esc(customerName)}
    </td></tr>
    <tr><td style="padding:6px 20px 0;font-family:${FONT};font-size:13px;line-height:20px;color:${C.muted};">
      Order <strong style="color:${C.text};">${esc(orderId)}</strong> &middot; ${esc(createdAt)} &middot; ${itemCount} item${itemCount !== 1 ? 's' : ''} &middot; <strong style="color:${C.text};">${esc(formatCurrency(pricing.total))}</strong>
    </td></tr>
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
    <tr><td style="padding:16px 20px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ${C.border};border-radius:14px;overflow:hidden;">
        <tr><td style="padding:14px 14px 8px;font-family:${FONT};font-size:15px;line-height:20px;font-weight:700;color:${C.text};">Order Items</td></tr>
        ${items.length > 0 ? items.map(renderProductRow).join('') : `<tr><td style="padding:12px 14px;border-top:1px solid ${C.borderSoft};font-family:${FONT};font-size:13px;color:${C.muted};text-align:center;">No items available.</td></tr>`}
        ${renderPricingSummary(pricing)}
      </table>
    </td></tr>
    ${notes ? `
    <tr><td style="padding:14px 20px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.goldTint};border:1px solid ${C.goldBorder};border-radius:12px;">
        <tr><td style="padding:12px 14px;font-family:${FONT};font-size:13px;line-height:20px;color:${C.goldText};">
          <div style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${C.goldLabel};font-weight:700;padding-bottom:4px;">Order Notes</div>
          ${esc(notes)}
        </td></tr>
      </table>
    </td></tr>` : ''}
    <tr><td align="center" style="padding:20px 20px 14px;">
      <a href="${esc(adminUrl)}" style="display:inline-block;padding:12px 24px;border-radius:10px;background:${C.accent};color:${C.white};text-decoration:none;font-family:${FONT};font-size:13px;line-height:20px;font-weight:700;">Manage Order</a>
    </td></tr>
    <tr><td style="padding:0 20px 24px;font-family:${FONT};font-size:11px;line-height:16px;color:${C.light};text-align:center;">
      Automated notification from ${esc(branding.storeName)}.
    </td></tr>`;

  return renderShell({
    previewText: `New order ${orderId} from ${customerName} - ${formatCurrency(pricing.total)}`,
    content,
  });
}

export function generateCustomerOrderConfirmationHtml(order, brandingInput = {}) {
  const branding = { ...DEFAULT_BRANDING, ...brandingInput };
  const items = getItems(order);
  const pricing = getPricing(order, items);
  const customerName = getText(order?.customerName, 'Customer');
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
  const contactLabel = supportEmail || getText(branding?.whatsappNumber, 'Customer support');
  const productCards = items.length
    ? items.map(renderCustomerEmailItemCard).join('')
    : `<tr><td style="padding:20px;font-family:'Poppins',Arial,Helvetica,sans-serif;font-size:14px;line-height:1.4;color:#53627a;text-align:center;background:#ffffff;border-radius:10px;">Order details unavailable.</td></tr>`;

  return `<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
  <meta name="x-apple-disable-message-reformatting" />
  <link href="https://fonts.googleapis.com/css?family=Poppins:ital,wght@0,400;0,500;0,600" rel="stylesheet" />
  <title>${esc(`Order ${orderId} confirmed - ${branding.storeName}`)}</title>
  <style>
    html,body{margin:0 !important;padding:0 !important;min-height:100% !important;width:100% !important;-webkit-font-smoothing:antialiased;background-color:#ffffff;}
    *{-ms-text-size-adjust:100%;}
    table,td,th{mso-table-lspace:0 !important;mso-table-rspace:0 !important;border-collapse:collapse;}
    body,td,th,p,div,li,a,span{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;mso-line-height-rule:exactly;}
    img{border:0;outline:0;line-height:100%;text-decoration:none;-ms-interpolation-mode:bicubic;}
    a[x-apple-data-detectors]{color:inherit !important;text-decoration:none !important;}
    @media (max-width:620px){
      .pc-container{width:100% !important;max-width:100% !important;}
      .pc-stack{display:block !important;width:100% !important;padding-left:0 !important;padding-right:0 !important;}
      .pc-p-24{padding:24px !important;}
      .pc-px-24{padding-left:24px !important;padding-right:24px !important;}
      .pc-hide-mobile{display:none !important;}
    }
  </style>
</head>
<body style="width:100% !important;min-height:100% !important;margin:0 !important;padding:0 !important;background-color:#ffffff;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(`Order ${orderId} confirmed. ${itemSummary} totaling ${formatCurrency(pricing.total)}.`)}</div>
  <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation" style="table-layout:fixed;width:100%;min-width:600px;background-color:#ffffff;">
    <tr>
      <td align="center" valign="top" style="padding:20px 0;">
        <table class="pc-container" width="600" border="0" cellspacing="0" cellpadding="0" role="presentation" style="width:600px;max-width:600px;">
          <tr>
            <td style="padding:0 0 24px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
                <tr>
                  <td valign="top" align="left" style="padding:0 12px 0 0;">${renderCustomerEmailLogo(branding)}</td>
                  <td valign="middle" align="right" style="font-family:'Poppins',Arial,Helvetica,sans-serif;font-size:14px;line-height:1.4;color:${EMAIL_THEME.text};">
                    <a href="${esc(orderUrl)}" target="_blank" style="color:${EMAIL_THEME.text};text-decoration:none;">Track Package</a>
                    <span style="padding:0 10px;color:#9aa8bf;">|</span>
                    ${supportEmail ? `<a href="mailto:${esc(supportEmail)}" style="color:${EMAIL_THEME.text};text-decoration:none;">Contact Us</a>` : whatsappHref ? `<a href="${esc(whatsappHref)}" target="_blank" style="color:${EMAIL_THEME.text};text-decoration:none;">Contact Us</a>` : '<span>Contact Us</span>'}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 44px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation" bgcolor="${EMAIL_THEME.accentTint}" style="background-color:${EMAIL_THEME.accentTint};border-radius:10px;">
                <tr>
                  <td class="pc-p-24" align="center" style="padding:44px;">
                    <div style="padding:0 0 18px;font-family:'Poppins',Arial,Helvetica,sans-serif;font-size:72px;line-height:1;color:${EMAIL_THEME.accent};">&#10003;</div>
                    <div style="padding:0 0 20px;font-family:'Poppins',Arial,Helvetica,sans-serif;font-size:40px;line-height:1;font-weight:600;letter-spacing:-0.03em;color:${EMAIL_THEME.text};">Thanks for the Order</div>
                    <div style="padding:0 0 20px;font-family:'Poppins',Arial,Helvetica,sans-serif;font-size:14px;line-height:1.4;color:${EMAIL_THEME.text};">
                      Great news, ${esc(firstName)}! Your order is confirmed and our team is preparing it with care.
                    </div>
                    <a href="${esc(orderUrl)}" target="_blank" style="display:inline-block;box-sizing:border-box;border-radius:500px;background-color:${EMAIL_THEME.accent};padding:14px 28px;font-family:'Poppins',Arial,Helvetica,sans-serif;font-weight:500;font-size:17px;line-height:24px;color:${C.white};text-align:center;text-decoration:none;">Track Your Order</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 44px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation" bgcolor="${EMAIL_THEME.accentTint}" style="background-color:${EMAIL_THEME.accentTint};border-radius:20px;">
                <tr>
                  <td class="pc-p-24" style="padding:40px 24px;">
                    <div style="padding:0 0 8px;font-family:'Poppins',Arial,Helvetica,sans-serif;font-size:24px;line-height:1;font-weight:600;letter-spacing:-0.03em;color:${EMAIL_THEME.text};text-align:center;">Your items in this order</div>
                    <div style="padding:0 0 30px;font-family:'Poppins',Arial,Helvetica,sans-serif;font-size:14px;line-height:1.4;color:${EMAIL_THEME.text};text-align:center;">Order number: ${esc(orderId)}</div>
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">${productCards}</table>
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation" style="padding-top:4px;">
                      <tr><td style="padding:0 0 4px;">
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation" bgcolor="#ffffff" style="background-color:#ffffff;border-radius:10px;">
                          <tr>
                            <td style="padding:16px 0 16px 16px;font-family:'Poppins',Arial,Helvetica,sans-serif;font-size:16px;line-height:1.4;color:${EMAIL_THEME.text};">Subtotal</td>
                            <td align="right" style="padding:16px;font-family:'Poppins',Arial,Helvetica,sans-serif;font-size:16px;line-height:1.4;color:${EMAIL_THEME.text};">${esc(formatCurrency(pricing.subtotal))}</td>
                          </tr>
                          <tr>
                            <td style="padding:16px 0 16px 16px;font-family:'Poppins',Arial,Helvetica,sans-serif;font-size:16px;line-height:1.4;color:${EMAIL_THEME.text};">Standard Delivery</td>
                            <td align="right" style="padding:16px;font-family:'Poppins',Arial,Helvetica,sans-serif;font-size:16px;line-height:1.4;color:${EMAIL_THEME.text};">${esc(formatCurrency(pricing.shipping))}</td>
                          </tr>
                        </table>
                      </td></tr>
                      <tr><td style="padding:0 0 32px;">
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation" bgcolor="#ffffff" style="background-color:#ffffff;border-radius:10px;">
                          <tr>
                            <td style="padding:16px 0 16px 16px;font-family:'Poppins',Arial,Helvetica,sans-serif;font-size:16px;line-height:1.4;font-weight:600;color:${EMAIL_THEME.text};">Total</td>
                            <td align="right" style="padding:16px;font-family:'Poppins',Arial,Helvetica,sans-serif;font-size:16px;line-height:1.4;font-weight:600;color:${EMAIL_THEME.text};">${esc(formatCurrency(pricing.total))}</td>
                          </tr>
                        </table>
                      </td></tr>
                    </table>
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
                      <tr>
                        <td class="pc-stack" valign="top" style="width:50%;padding-right:20px;">
                          <div style="padding:0 0 14px;font-family:'Poppins',Arial,Helvetica,sans-serif;font-size:16px;line-height:1.4;font-weight:600;color:${EMAIL_THEME.text};">Shipping Address</div>
                          <div style="border-bottom:1px solid #cecece;font-size:1px;line-height:1px;">&nbsp;</div>
                          <div style="padding-top:14px;font-family:'Poppins',Arial,Helvetica,sans-serif;font-size:14px;line-height:1.4;color:${EMAIL_THEME.text};word-break:break-word;">
                            ${esc(customerName)}<br/>
                            ${esc(shippingAddress)}
                            ${customerCity ? `<br/>${esc(customerCity)}` : ''}
                            ${landmark ? `<br/>Landmark: ${esc(landmark)}` : ''}
                          </div>
                        </td>
                        <td class="pc-stack" valign="top" style="width:50%;padding-left:20px;">
                          <div style="padding:0 0 14px;font-family:'Poppins',Arial,Helvetica,sans-serif;font-size:16px;line-height:1.4;font-weight:600;color:${EMAIL_THEME.text};">Order Details</div>
                          <div style="border-bottom:1px solid #cecece;font-size:1px;line-height:1px;">&nbsp;</div>
                          <div style="padding-top:14px;font-family:'Poppins',Arial,Helvetica,sans-serif;font-size:14px;line-height:1.4;color:${EMAIL_THEME.text};">
                            Payment: ${esc(getText(order?.paymentStatus, 'COD'))}<br/>
                            Items: ${esc(itemSummary)}<br/>
                            ${customerPhone ? `Phone: ${esc(customerPhone)}<br/>` : ''}
                            Support: ${esc(contactLabel)}
                          </div>
                        </td>
                      </tr>
                    </table>
                    ${notes ? `<div style="margin-top:24px;padding:16px;border-radius:10px;background:#fff7e8;font-family:'Poppins',Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#725426;"><strong>Order notes:</strong> ${esc(notes)}</div>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 4px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation" bgcolor="${EMAIL_THEME.accentDark}" style="background-color:${EMAIL_THEME.accentDark};border-radius:10px;">
                <tr>
                  <td class="pc-px-24" style="padding:24px;" align="center">
                    <div style="padding:0 0 12px;">${renderCustomerEmailFooterLogo(branding)}</div>
                    ${businessAddress ? `<div style="font-family:'Poppins',Arial,Helvetica,sans-serif;font-size:14px;line-height:1.43;color:#ffffff;text-align:center;">${esc(businessAddress)}</div>` : ''}
                    ${renderCustomerEmailFooterLinks(branding)}
                    <div style="padding-top:16px;font-family:'Poppins',Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#ffffff;text-align:center;">
                      You received this email because you placed an order with ${esc(branding.storeName)}.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
