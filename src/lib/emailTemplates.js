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

const EMAIL_COLORS = {
  page: '#f5f3ef',
  card: '#fffdf9',
  panel: '#f3f6f4',
  panelStrong: '#edf4f1',
  border: '#dbe5df',
  text: '#1d2b27',
  muted: '#60706a',
  primary: '#21584e',
  primaryStrong: '#173f38',
  primaryTint: '#e7f0ec',
  accent: '#b98d46',
  white: '#ffffff',
};

function escapeHtml(value) {
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

  return date.toLocaleString('en-PK', {
    dateStyle: 'medium',
    ...options,
  });
}

function getItems(order) {
  if (!Array.isArray(order?.items)) return [];

  return order.items.map((item, index) => {
    const quantity = Math.max(1, getNumber(item?.quantity, 1));
    const unitPrice = getNumber(item?.price);
    const lineTotal = unitPrice * quantity;
    const name = getText(item?.name || item?.Name, `Item ${index + 1}`);
    const image = getText(item?.image || item?.Image || item?.imageUrl);
    const variant = getText(item?.variant);

    return {
      key: `${name}-${index}`,
      name,
      image,
      quantity,
      unitPrice,
      lineTotal,
      variant,
    };
  });
}

function getPricing(order, items) {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const total = Math.max(getNumber(order?.totalAmount, subtotal), subtotal);
  const shipping = Math.max(total - subtotal, 0);

  return {
    subtotal,
    shipping,
    total,
  };
}

function buildOrderUrl(order, baseUrl) {
  const orderId = getText(order?._id);
  const secureToken = getText(order?.secureToken);

  if (orderId && secureToken) {
    return `${baseUrl}/orders/${orderId}?token=${encodeURIComponent(secureToken)}`;
  }

  if (orderId) {
    return `${baseUrl}/orders/${orderId}`;
  }

  return `${baseUrl}/orders`;
}

function getLogoUrl(branding) {
  return getText(branding?.lightLogoUrl || branding?.darkLogoUrl);
}

function renderLogo(branding) {
  const logoUrl = getLogoUrl(branding);
  const alt = escapeHtml(getText(branding?.storeName, DEFAULT_BRANDING.storeName));

  if (!logoUrl) return '';

  return `
    <tr>
      <td align="center" style="padding: 32px 32px 12px;">
        <img src="${escapeHtml(logoUrl)}" alt="${alt}" width="180" style="display: block; width: auto; max-width: 180px; height: auto; border: 0; outline: none; text-decoration: none;">
      </td>
    </tr>
  `;
}

function renderSocialLinks(branding) {
  const socialLinks = [
    {
      href: normalizeSocialUrl(branding?.facebookPageUrl),
      label: 'Facebook',
    },
    {
      href: normalizeSocialUrl(branding?.instagramUrl),
      label: 'Instagram',
    },
    {
      href: createWhatsAppUrl(branding?.whatsappNumber),
      label: 'WhatsApp',
    },
  ].filter((item) => item.href);

  if (socialLinks.length === 0) return '';

  return `
    <tr>
      <td align="center" style="padding: 0 32px 12px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 20px; color: ${EMAIL_COLORS.muted};">
        ${socialLinks
          .map(
            (item) =>
              `<a href="${escapeHtml(item.href)}" style="color: ${EMAIL_COLORS.primary}; text-decoration: none; font-weight: 600;">${escapeHtml(item.label)}</a>`,
          )
          .join(`<span style="color: ${EMAIL_COLORS.border}; padding: 0 8px;">|</span>`)}
      </td>
    </tr>
  `;
}

function renderPricingRows(pricing) {
  return `
    <tr>
      <td style="padding: 6px 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 20px; color: #6b7280;">Subtotal</td>
      <td align="right" style="padding: 6px 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 20px; color: #111827;">${escapeHtml(formatCurrency(pricing.subtotal))}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 20px; color: #6b7280;">Shipping</td>
      <td align="right" style="padding: 6px 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 20px; color: #111827;">${escapeHtml(formatCurrency(pricing.shipping))}</td>
    </tr>
    <tr>
      <td style="padding: 12px 0 0; border-top: 1px solid #e5e7eb; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 22px; font-weight: 700; color: #111827;">Total</td>
      <td align="right" style="padding: 12px 0 0; border-top: 1px solid #e5e7eb; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 22px; font-weight: 700; color: #111827;">${escapeHtml(formatCurrency(pricing.total))}</td>
    </tr>
  `;
}

function renderLineItems(items) {
  if (items.length === 0) {
    return `
      <tr>
        <td colspan="4" style="padding: 18px 16px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 20px; color: #6b7280; text-align: center;">
          Order items were unavailable for this email.
        </td>
      </tr>
    `;
  }

  return items
    .map((item) => {
      const imageCell = item.image
        ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" width="48" height="48" style="display: block; width: 48px; height: 48px; border-radius: 10px; object-fit: cover; border: 1px solid #e5e7eb;">`
        : `<div style="width: 48px; height: 48px; border-radius: 10px; border: 1px solid #e5e7eb; background-color: #f3f4f6; font-family: Arial, Helvetica, sans-serif; font-size: 10px; line-height: 48px; text-align: center; color: #9ca3af;">N/A</div>`;

      return `
        <tr>
          <td width="50%" style="width: 50%; min-width: 250px; padding: 14px 16px; border-bottom: 1px solid ${EMAIL_COLORS.border}; vertical-align: top;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td width="64" style="width: 64px; padding: 0 16px 0 0; vertical-align: top;">
                  ${imageCell}
                </td>
                <td style="vertical-align: top; word-break: break-word;">
                  <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 20px; font-weight: 600; color: ${EMAIL_COLORS.text}; word-break: break-word;">${escapeHtml(item.name)}</div>
                  ${item.variant ? `<div style="padding-top: 4px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 18px; color: ${EMAIL_COLORS.muted}; word-break: break-word;">${escapeHtml(item.variant)}</div>` : ''}
                </td>
              </tr>
            </table>
          </td>
          <td width="15%" align="right" style="width: 15%; padding: 14px 12px; border-bottom: 1px solid ${EMAIL_COLORS.border}; vertical-align: top; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 20px; color: ${EMAIL_COLORS.text}; text-align: right;">${item.quantity}</td>
          <td width="35%" align="right" style="width: 35%; padding: 14px 16px; border-bottom: 1px solid ${EMAIL_COLORS.border}; vertical-align: top; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 20px; color: ${EMAIL_COLORS.text}; text-align: right;">${escapeHtml(formatCurrency(item.lineTotal))}</td>
        </tr>
      `;
    })
    .join('');
}

function renderSupportBlock(branding) {
  const supportEmail = getText(branding?.supportEmail);
  const whatsappUrl = createWhatsAppUrl(branding?.whatsappNumber);
  const businessAddress = getText(branding?.businessAddress);

  const supportLines = [
    supportEmail
      ? `Email us at <a href="mailto:${escapeHtml(supportEmail)}" style="color: ${EMAIL_COLORS.primary}; text-decoration: none; font-weight: 600;">${escapeHtml(supportEmail)}</a>`
      : '',
    whatsappUrl
      ? `Chat on <a href="${escapeHtml(whatsappUrl)}" style="color: ${EMAIL_COLORS.primary}; text-decoration: none; font-weight: 600;">WhatsApp</a>`
      : '',
    businessAddress ? escapeHtml(businessAddress) : '',
  ].filter(Boolean);

  if (supportLines.length === 0) {
    return `
      <tr>
        <td style="padding: 0 32px 12px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 20px; color: ${EMAIL_COLORS.muted};">
          Need help with your order? Reply to this email and our team will assist you.
        </td>
      </tr>
    `;
  }

  return `
    <tr>
      <td style="padding: 0 32px 12px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 20px; color: ${EMAIL_COLORS.muted};">
        ${supportLines.join('<br>')}
      </td>
    </tr>
  `;
}

function renderEmailShell({ previewText, content }) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="x-apple-disable-message-reformatting">
        <title>${escapeHtml(previewText)}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: ${EMAIL_COLORS.page};">
        <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">${escapeHtml(previewText)}</div>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${EMAIL_COLORS.page}; margin: 0; padding: 24px 12px; width: 100%;">
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 640px; width: 100%;">
                <tr>
                  <td style="background-color: ${EMAIL_COLORS.card}; border: 1px solid ${EMAIL_COLORS.border}; border-radius: 24px; overflow: hidden;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export async function getEmailBranding() {
  try {
    await mongooseConnect();
    const settings = await Settings.findOne({ singletonKey: SETTINGS_KEY }).lean();

    if (!settings) {
      return { ...DEFAULT_BRANDING };
    }

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

export function generateOrderEmailHtml(order, brandingInput = {}) {
  const branding = { ...DEFAULT_BRANDING, ...brandingInput };
  const items = getItems(order);
  const pricing = getPricing(order, items);
  const adminUrl = `${branding.baseUrl}/admin/orders`;
  const customerName = getText(order?.customerName, 'Customer');
  const customerPhone = getText(order?.customerPhone, 'Not provided');
  const customerEmail = getText(order?.customerEmail, 'Not provided');
  const customerAddress = getText(order?.customerAddress, 'Not provided');
  const notes = getText(order?.notes);
  const orderId = getText(order?.orderId, 'Pending');
  const createdAt = formatDate(order?.createdAt, { timeStyle: 'short' });

  const content = `
    ${renderLogo(branding)}
    <tr>
      <td style="padding: 8px 32px 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 18px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #0f766e;">
        New order received
      </td>
    </tr>
    <tr>
      <td style="padding: 8px 32px 0; font-family: Arial, Helvetica, sans-serif; font-size: 28px; line-height: 34px; font-weight: 700; color: #111827;">
        ${escapeHtml(customerName)} placed a new order
      </td>
    </tr>
    <tr>
      <td style="padding: 12px 32px 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px; color: #4b5563;">
        Order <strong>${escapeHtml(orderId)}</strong> was received on ${escapeHtml(createdAt)}.
      </td>
    </tr>
    <tr>
      <td style="padding: 24px 32px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border: 1px solid #e5e7eb; border-radius: 16px;">
          <tr>
            <td style="padding: 18px 20px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 20px; color: #6b7280;">
              <strong style="display: block; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af;">Customer</strong>
              <span style="display: block; padding-top: 6px; font-size: 15px; color: #111827; font-weight: 600;">${escapeHtml(customerName)}</span>
              <span style="display: block; padding-top: 4px;">${escapeHtml(customerPhone)}</span>
              <span style="display: block; padding-top: 4px;">${escapeHtml(customerEmail)}</span>
              <span style="display: block; padding-top: 4px;">${escapeHtml(customerAddress)}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px 32px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
          <tr style="background-color: #f9fafb;">
            <th align="left" style="padding: 12px 16px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 18px; font-weight: 700; color: #6b7280;">Item</th>
            <th align="center" style="padding: 12px 8px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 18px; font-weight: 700; color: #6b7280;">Qty</th>
            <th align="right" style="padding: 12px 16px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 18px; font-weight: 700; color: #6b7280;">Price</th>
          </tr>
          ${items
            .map(
              (item) => `
                <tr>
                  <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 20px; color: #111827;">
                    <strong>${escapeHtml(item.name)}</strong>
                    ${item.variant ? `<div style="padding-top: 4px; font-size: 12px; color: #6b7280;">${escapeHtml(item.variant)}</div>` : ''}
                  </td>
                  <td align="center" style="padding: 14px 8px; border-bottom: 1px solid #e5e7eb; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 20px; color: #111827;">${item.quantity}</td>
                  <td align="right" style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 20px; color: #111827;">${escapeHtml(formatCurrency(item.lineTotal))}</td>
                </tr>
              `,
            )
            .join('')}
          <tr>
            <td colspan="2" align="right" style="padding: 16px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 22px; font-weight: 700; color: #111827;">Order Total</td>
            <td align="right" style="padding: 16px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 22px; font-weight: 700; color: #111827;">${escapeHtml(formatCurrency(pricing.total))}</td>
          </tr>
        </table>
      </td>
    </tr>
    ${
      notes
        ? `
          <tr>
            <td style="padding: 24px 32px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px;">
                <tr>
                  <td style="padding: 18px 20px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 20px; color: #4b5563;">
                    <strong style="display: block; padding-bottom: 6px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af;">Special instructions</strong>
                    ${escapeHtml(notes)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `
        : ''
    }
    <tr>
      <td align="center" style="padding: 28px 32px 18px;">
        <a href="${escapeHtml(adminUrl)}" style="display: inline-block; padding: 14px 28px; border-radius: 999px; background-color: #0f766e; color: #ffffff; text-decoration: none; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 20px; font-weight: 700;">Manage Order</a>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 32px 32px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 18px; color: #9ca3af; text-align: center;">
        Automated notification from ${escapeHtml(branding.storeName)}.
      </td>
    </tr>
  `;

  return renderEmailShell({
    previewText: `New order ${orderId} from ${customerName}`,
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
  const orderDate = formatDate(order?.createdAt);
  const shippingAddress = getText(order?.customerAddress, 'Shipping address will be confirmed by our team.');
  const customerCity = getText(order?.customerCity);
  const customerPhone = getText(order?.customerPhone);
  const landmark = getText(order?.landmark);
  const notes = getText(order?.notes);
  const orderUrl = buildOrderUrl(order, branding.baseUrl);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const itemSummary = itemCount === 1 ? '1 item' : `${itemCount} items`;
  const shippingLines = [shippingAddress, customerCity, landmark ? `Landmark: ${landmark}` : ''].filter(Boolean);

  const content = `
    ${renderLogo(branding)}
    <tr>
      <td style="padding: 8px 32px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${EMAIL_COLORS.primaryTint}; border: 1px solid ${EMAIL_COLORS.border}; border-radius: 24px;">
          <tr>
            <td style="padding: 28px 24px 10px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 18px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: ${EMAIL_COLORS.primary}; text-align: center;">
              Order confirmed
            </td>
          </tr>
          <tr>
            <td style="padding: 0 24px; font-family: Arial, Helvetica, sans-serif; font-size: 32px; line-height: 38px; font-weight: 700; color: ${EMAIL_COLORS.text}; text-align: center;">
              Thank you, ${escapeHtml(customerName)}.
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 24px 0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 24px; color: ${EMAIL_COLORS.muted}; text-align: center;">
              Hi ${escapeHtml(firstName)}, your order is in. We&apos;re reviewing your items now and will keep you posted as soon as it moves to dispatch.
            </td>
          </tr>
          <tr>
            <td style="padding: 22px 24px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td width="33.33%" style="padding-right: 6px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${EMAIL_COLORS.white}; border: 1px solid ${EMAIL_COLORS.border}; border-radius: 16px;">
                      <tr>
                        <td style="padding: 14px 12px; text-align: center; font-family: Arial, Helvetica, sans-serif;">
                          <div style="font-size: 11px; line-height: 16px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: ${EMAIL_COLORS.primary};">Step 1</div>
                          <div style="padding-top: 6px; font-size: 14px; line-height: 20px; font-weight: 700; color: ${EMAIL_COLORS.text};">Confirmed</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="33.33%" style="padding: 0 3px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${EMAIL_COLORS.white}; border: 1px solid ${EMAIL_COLORS.border}; border-radius: 16px;">
                      <tr>
                        <td style="padding: 14px 12px; text-align: center; font-family: Arial, Helvetica, sans-serif;">
                          <div style="font-size: 11px; line-height: 16px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: ${EMAIL_COLORS.muted};">Step 2</div>
                          <div style="padding-top: 6px; font-size: 14px; line-height: 20px; font-weight: 700; color: ${EMAIL_COLORS.text};">Preparing</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="33.33%" style="padding-left: 6px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${EMAIL_COLORS.white}; border: 1px solid ${EMAIL_COLORS.border}; border-radius: 16px;">
                      <tr>
                        <td style="padding: 14px 12px; text-align: center; font-family: Arial, Helvetica, sans-serif;">
                          <div style="font-size: 11px; line-height: 16px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: ${EMAIL_COLORS.muted};">Step 3</div>
                          <div style="padding-top: 6px; font-size: 14px; line-height: 20px; font-weight: 700; color: ${EMAIL_COLORS.text};">Dispatch</div>
                        </td>
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
    <tr>
      <td style="padding: 20px 32px 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px; color: ${EMAIL_COLORS.muted}; text-align: center;">
        Keep this email for your records. Your confirmation number is <strong style="color: ${EMAIL_COLORS.text};">${escapeHtml(orderId)}</strong>.
      </td>
    </tr>
    <tr>
      <td style="padding: 24px 32px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td width="33.33%" style="padding-right: 8px; vertical-align: top;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${EMAIL_COLORS.panel}; border: 1px solid ${EMAIL_COLORS.border}; border-radius: 18px;">
                <tr>
                  <td style="padding: 18px 18px 16px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 18px; color: ${EMAIL_COLORS.muted};">
                    <strong style="display: block; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: ${EMAIL_COLORS.muted};">Order ID</strong>
                    <span style="display: block; padding-top: 6px; font-size: 15px; line-height: 22px; font-weight: 700; color: ${EMAIL_COLORS.text};">${escapeHtml(orderId)}</span>
                  </td>
                </tr>
              </table>
            </td>
            <td width="33.33%" style="padding: 0 4px; vertical-align: top;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${EMAIL_COLORS.panel}; border: 1px solid ${EMAIL_COLORS.border}; border-radius: 18px;">
                <tr>
                  <td style="padding: 18px 18px 16px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 18px; color: ${EMAIL_COLORS.muted};">
                    <strong style="display: block; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: ${EMAIL_COLORS.muted};">Order Date</strong>
                    <span style="display: block; padding-top: 6px; font-size: 15px; line-height: 22px; font-weight: 700; color: ${EMAIL_COLORS.text};">${escapeHtml(orderDate)}</span>
                  </td>
                </tr>
              </table>
            </td>
            <td width="33.33%" style="padding-left: 8px; vertical-align: top;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${EMAIL_COLORS.panel}; border: 1px solid ${EMAIL_COLORS.border}; border-radius: 18px;">
                <tr>
                  <td style="padding: 18px 18px 16px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 18px; color: ${EMAIL_COLORS.muted};">
                    <strong style="display: block; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: ${EMAIL_COLORS.muted};">Items</strong>
                    <span style="display: block; padding-top: 6px; font-size: 15px; line-height: 22px; font-weight: 700; color: ${EMAIL_COLORS.text};">${escapeHtml(itemSummary)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px 32px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="padding: 0 0 12px; font-family: Arial, Helvetica, sans-serif; font-size: 20px; line-height: 28px; font-weight: 700; color: ${EMAIL_COLORS.text};">
              Your order summary
            </td>
          </tr>
        </table>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; border: 1px solid ${EMAIL_COLORS.border}; border-radius: 16px; overflow: hidden; table-layout: fixed;">
          <tr style="background-color: ${EMAIL_COLORS.panelStrong};">
            <th width="50%" align="left" style="width: 50%; min-width: 250px; padding: 12px 16px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 18px; font-weight: 700; color: ${EMAIL_COLORS.muted}; text-align: left;">Product</th>
            <th width="15%" align="right" style="width: 15%; padding: 12px 12px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 18px; font-weight: 700; color: ${EMAIL_COLORS.muted}; text-align: right;">Qty</th>
            <th width="35%" align="right" style="width: 35%; padding: 12px 16px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 18px; font-weight: 700; color: ${EMAIL_COLORS.muted}; text-align: right;">Price</th>
          </tr>
          ${renderLineItems(items)}
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 32px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border: 1px solid ${EMAIL_COLORS.border}; border-radius: 16px; background-color: ${EMAIL_COLORS.card};">
          <tr>
            <td style="padding: 18px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                ${renderPricingRows(pricing)}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 32px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${EMAIL_COLORS.panel}; border: 1px solid ${EMAIL_COLORS.border}; border-radius: 18px;">
          <tr>
            <td style="padding: 18px 20px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 21px; color: ${EMAIL_COLORS.muted};">
              <strong style="display: block; padding-bottom: 8px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: ${EMAIL_COLORS.muted};">Delivery details</strong>
              ${shippingLines.map((line) => `<div>${escapeHtml(line)}</div>`).join('')}
              ${customerPhone ? `<div style="padding-top: 6px;">Phone: ${escapeHtml(customerPhone)}</div>` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ${
      notes
        ? `
          <tr>
            <td style="padding: 20px 32px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #faf6ec; border: 1px solid #ead8b4; border-radius: 18px;">
                <tr>
                  <td style="padding: 18px 20px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 21px; color: #725426;">
                    <strong style="display: block; padding-bottom: 8px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #9a6b11;">Order notes</strong>
                    ${escapeHtml(notes)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `
        : ''
    }
    <tr>
      <td style="padding: 20px 32px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${EMAIL_COLORS.panel}; border: 1px solid ${EMAIL_COLORS.border}; border-radius: 18px;">
          <tr>
            <td style="padding: 20px 20px 8px; font-family: Arial, Helvetica, sans-serif; font-size: 17px; line-height: 24px; font-weight: 700; color: ${EMAIL_COLORS.text};">
              What happens next
            </td>
          </tr>
          <tr>
            <td style="padding: 0 20px 20px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 21px; color: ${EMAIL_COLORS.muted};">
              <div style="padding-bottom: 8px;"><strong style="color: ${EMAIL_COLORS.primaryStrong};">1.</strong> Our team reviews your order and confirms stock.</div>
              <div style="padding-bottom: 8px;"><strong style="color: ${EMAIL_COLORS.primaryStrong};">2.</strong> We prepare your package and update tracking when it is ready.</div>
              <div><strong style="color: ${EMAIL_COLORS.primaryStrong};">3.</strong> You can use the button below any time to check your order details.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 28px 32px 20px;">
        <a href="${escapeHtml(orderUrl)}" style="display: inline-block; padding: 14px 28px; border-radius: 999px; background-color: ${EMAIL_COLORS.primary}; color: ${EMAIL_COLORS.white}; text-decoration: none; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 20px; font-weight: 700;">View Order Details</a>
      </td>
    </tr>
    ${renderSupportBlock(branding)}
    ${renderSocialLinks(branding)}
    <tr>
      <td style="padding: 0 32px 32px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 18px; color: ${EMAIL_COLORS.muted}; text-align: center;">
        You received this email because you placed an order with ${escapeHtml(branding.storeName)}. We appreciate your trust.
      </td>
    </tr>
  `;

  return renderEmailShell({
    previewText: `Order ${orderId} confirmed`,
    content,
  });
}
