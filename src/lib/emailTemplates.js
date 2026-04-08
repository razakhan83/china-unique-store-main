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
      <td align="center" style="padding: 0 32px 12px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 20px; color: #6b7280;">
        ${socialLinks
          .map(
            (item) =>
              `<a href="${escapeHtml(item.href)}" style="color: #0f766e; text-decoration: none; font-weight: 600;">${escapeHtml(item.label)}</a>`,
          )
          .join('<span style="color: #d1d5db; padding: 0 8px;">|</span>')}
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
          <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; vertical-align: top;">${imageCell}</td>
          <td style="padding: 14px 16px 14px 0; border-bottom: 1px solid #e5e7eb; vertical-align: top;">
            <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 20px; font-weight: 600; color: #111827;">${escapeHtml(item.name)}</div>
            ${item.variant ? `<div style="padding-top: 4px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 18px; color: #6b7280;">${escapeHtml(item.variant)}</div>` : ''}
          </td>
          <td align="center" style="padding: 14px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 20px; color: #111827;">${item.quantity}</td>
          <td align="right" style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; vertical-align: top; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 20px; color: #111827;">${escapeHtml(formatCurrency(item.lineTotal))}</td>
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
      ? `Email us at <a href="mailto:${escapeHtml(supportEmail)}" style="color: #0f766e; text-decoration: none; font-weight: 600;">${escapeHtml(supportEmail)}</a>`
      : '',
    whatsappUrl
      ? `Chat on <a href="${escapeHtml(whatsappUrl)}" style="color: #0f766e; text-decoration: none; font-weight: 600;">WhatsApp</a>`
      : '',
    businessAddress ? escapeHtml(businessAddress) : '',
  ].filter(Boolean);

  if (supportLines.length === 0) {
    return `
      <tr>
        <td style="padding: 0 32px 12px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 20px; color: #6b7280;">
          Need help with your order? Reply to this email and our team will assist you.
        </td>
      </tr>
    `;
  }

  return `
    <tr>
      <td style="padding: 0 32px 12px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 20px; color: #6b7280;">
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
      <body style="margin: 0; padding: 0; background-color: #f3f4f6;">
        <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">${escapeHtml(previewText)}</div>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6; margin: 0; padding: 24px 12px; width: 100%;">
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 640px; width: 100%;">
                <tr>
                  <td style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 24px; overflow: hidden;">
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
  const orderUrl = buildOrderUrl(order, branding.baseUrl);

  const content = `
    ${renderLogo(branding)}
    <tr>
      <td style="padding: 8px 32px 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 18px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #0f766e; text-align: center;">
        Order confirmation
      </td>
    </tr>
    <tr>
      <td style="padding: 10px 32px 0; font-family: Arial, Helvetica, sans-serif; font-size: 30px; line-height: 36px; font-weight: 700; color: #111827; text-align: center;">
        Thank you for your order, ${escapeHtml(customerName)}!
      </td>
    </tr>
    <tr>
      <td style="padding: 12px 32px 0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 24px; color: #4b5563; text-align: center;">
        Hi ${escapeHtml(firstName)}, we have received your order and our team is preparing it now.
      </td>
    </tr>
    <tr>
      <td style="padding: 24px 32px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px;">
          <tr>
            <td style="padding: 18px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding-right: 12px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 18px; color: #6b7280;">
                    <strong style="display: block; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af;">Order ID</strong>
                    <span style="display: block; padding-top: 6px; font-size: 15px; line-height: 22px; font-weight: 700; color: #111827;">${escapeHtml(orderId)}</span>
                  </td>
                  <td align="right" style="padding-left: 12px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 18px; color: #6b7280;">
                    <strong style="display: block; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af;">Order Date</strong>
                    <span style="display: block; padding-top: 6px; font-size: 15px; line-height: 22px; font-weight: 700; color: #111827;">${escapeHtml(orderDate)}</span>
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
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
          <tr style="background-color: #f9fafb;">
            <th align="left" style="padding: 12px 16px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 18px; font-weight: 700; color: #6b7280;">Product</th>
            <th align="center" style="padding: 12px 8px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 18px; font-weight: 700; color: #6b7280;">Qty</th>
            <th align="right" style="padding: 12px 16px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 18px; font-weight: 700; color: #6b7280;">Price</th>
          </tr>
          ${renderLineItems(items)}
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 32px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border: 1px solid #e5e7eb; border-radius: 16px;">
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
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px;">
          <tr>
            <td style="padding: 18px 20px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 20px; color: #4b5563;">
              <strong style="display: block; padding-bottom: 6px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af;">Shipping address</strong>
              ${escapeHtml(shippingAddress)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 28px 32px 20px;">
        <a href="${escapeHtml(orderUrl)}" style="display: inline-block; padding: 14px 28px; border-radius: 999px; background-color: #0f766e; color: #ffffff; text-decoration: none; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 20px; font-weight: 700;">Track Order</a>
      </td>
    </tr>
    ${renderSupportBlock(branding)}
    ${renderSocialLinks(branding)}
    <tr>
      <td style="padding: 0 32px 32px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 18px; color: #9ca3af; text-align: center;">
        You received this email because you placed an order with ${escapeHtml(branding.storeName)}.
      </td>
    </tr>
  `;

  return renderEmailShell({
    previewText: `Order ${orderId} confirmed`,
    content,
  });
}
