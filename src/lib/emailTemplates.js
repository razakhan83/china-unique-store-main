import 'server-only';

const EMAIL_THEME = {
  background: 'oklch(0.975 0.008 95)',
  foreground: 'oklch(0.24 0.02 160)',
  card: 'oklch(0.992 0.004 95)',
  primary: 'oklch(0.34 0.07 166)',
  primaryForeground: 'oklch(0.985 0.004 95)',
  secondary: 'oklch(0.94 0.012 95)',
  secondaryForeground: 'oklch(0.29 0.02 160)',
  muted: 'oklch(0.955 0.01 95)',
  mutedForeground: 'oklch(0.52 0.02 160)',
  accent: 'oklch(0.78 0.11 92)',
  accentForeground: 'oklch(0.23 0.02 160)',
  border: 'oklch(0.9 0.01 95)',
  success: 'oklch(0.72 0.13 155)',
  destructive: 'oklch(0.62 0.2 27)',
  radiusSm: '0.5rem',
  radiusLg: '0.75rem',
  radiusXl: '1rem',
};

/**
 * Generates a clean HTML template for order notification emails.
 * 
 * @param {Object} order - The order object from MongoDB
 * @returns {string} HTML string
 */
export function generateOrderEmailHtml(order) {
  const {
    orderId,
    customerName,
    customerPhone,
    customerAddress,
    items,
    totalAmount,
    notes,
    createdAt
  } = order;

  // Format date
  const dateStr = new Date(createdAt).toLocaleString('en-PK', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  // Generate items table rows
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid var(--email-border);">
        <div style="font-weight: 600; color: var(--email-foreground);">${item.name || item.Name}</div>
        ${item.variant ? `<div style="font-size: 12px; color: var(--email-muted-foreground);">Variant: ${item.variant}</div>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid var(--email-border); text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid var(--email-border); text-align: right;">PKR ${Number(item.price).toLocaleString('en-PK')}</td>
    </tr>
  `).join('');

  const adminUrl = `${process.env.NEXTAUTH_URL || 'https://chinaunique.pk'}/admin/orders`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        :root {
          --email-background: ${EMAIL_THEME.background};
          --email-foreground: ${EMAIL_THEME.foreground};
          --email-card: ${EMAIL_THEME.card};
          --email-primary: ${EMAIL_THEME.primary};
          --email-primary-foreground: ${EMAIL_THEME.primaryForeground};
          --email-secondary: ${EMAIL_THEME.secondary};
          --email-secondary-foreground: ${EMAIL_THEME.secondaryForeground};
          --email-muted: ${EMAIL_THEME.muted};
          --email-muted-foreground: ${EMAIL_THEME.mutedForeground};
          --email-accent: ${EMAIL_THEME.accent};
          --email-accent-foreground: ${EMAIL_THEME.accentForeground};
          --email-border: ${EMAIL_THEME.border};
          --email-success: ${EMAIL_THEME.success};
          --email-destructive: ${EMAIL_THEME.destructive};
          --email-radius-sm: ${EMAIL_THEME.radiusSm};
          --email-radius-lg: ${EMAIL_THEME.radiusLg};
          --email-radius-xl: ${EMAIL_THEME.radiusXl};
        }
        body { font-family: 'Geist', system-ui, sans-serif; line-height: 1.6; color: var(--email-foreground); margin: 0; padding: 0; background: var(--email-background); }
        .container { max-width: 600px; margin: 20px auto; border: 1px solid var(--email-border); border-radius: var(--email-radius-xl); overflow: hidden; background: var(--email-card); }
        .header { background: var(--email-primary); color: var(--email-primary-foreground); padding: 24px; text-align: center; }
        .content { padding: 24px; }
        .section { margin-bottom: 24px; }
        .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--email-primary); margin-bottom: 12px; border-bottom: 2px solid color-mix(in oklab, var(--email-primary) 18%, var(--email-card)); padding-bottom: 4px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
        .info-card { background: var(--email-muted); padding: 16px; border-radius: var(--email-radius-sm); }
        .label { font-size: 12px; color: var(--email-muted-foreground); margin-bottom: 4px; }
        .value { font-weight: 600; color: var(--email-foreground); }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        .total-row { background: color-mix(in oklab, var(--email-success) 14%, var(--email-card)); font-weight: 700; font-size: 18px; color: var(--email-primary); }
        .footer { background: var(--email-secondary); padding: 20px; text-align: center; font-size: 14px; color: var(--email-muted-foreground); }
        .button { display: inline-block; background: var(--email-primary); color: var(--email-primary-foreground); padding: 12px 24px; border-radius: var(--email-radius-sm); text-decoration: none; font-weight: 600; margin-top: 16px; transition: background 0.2s; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 20px;">New Order Received</h1>
          <p style="margin: 4px 0 0; opacity: 0.9; font-size: 14px;">Order ID: ${orderId}</p>
        </div>
        
        <div class="content">
          <div class="section">
            <div class="section-title">Customer Information</div>
            <div style="background: var(--email-muted); border-radius: var(--email-radius-xl); padding: 20px; border: 1px solid var(--email-border);">
              <div style="margin-bottom: 12px;">
                <div class="label">Name</div>
                <div class="value" style="font-size: 16px;">${customerName}</div>
              </div>
              <div style="margin-bottom: 12px;">
                <div class="label">Phone</div>
                <div class="value">${customerPhone}</div>
              </div>
              <div>
                <div class="label">Shipping Address</div>
                <div class="value" style="line-height: 1.4;">${customerAddress}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Order Details</div>
            <table>
              <thead>
                <tr style="text-align: left; font-size: 12px; color: var(--email-muted-foreground);">
                  <th style="padding: 12px;">Product</th>
                  <th style="padding: 12px; text-align: center;">Qty</th>
                  <th style="padding: 12px; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
                <tr class="total-row">
                  <td colspan="2" style="padding: 16px; text-align: right;">Grand Total</td>
                  <td style="padding: 16px; text-align: right;">PKR ${totalAmount.toLocaleString('en-PK')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          ${notes ? `
          <div class="section">
            <div class="section-title">Order Notes</div>
            <div style="background: color-mix(in oklab, var(--email-accent) 16%, var(--email-card)); border-left: 4px solid var(--email-accent); padding: 12px; font-style: italic; color: var(--email-accent-foreground);">
              "${notes}"
            </div>
          </div>
          ` : ''}

          <div style="text-align: center; margin-top: 32px;">
            <a href="${adminUrl}" class="button">Manage Order in Admin Panel</a>
            <div style="margin-top: 12px; font-size: 12px; color: var(--email-muted-foreground);">
              Received on ${dateStr}
            </div>
          </div>
        </div>

        <div class="footer">
          <strong>China Unique - Home and Lifestyle Store</strong><br>
          Automated System Notification
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generates a professional 'Thank You' email for customers with an HTML invoice.
 * 
 * @param {Object} order - The order object from MongoDB
 * @returns {string} HTML string
 */
export function generateCustomerOrderConfirmationHtml(order) {
  const {
    orderId,
    customerName,
    customerAddress,
    items,
    totalAmount,
    createdAt
  } = order;

  // Format date
  const dateStr = new Date(createdAt).toLocaleString('en-PK', {
    dateStyle: 'full',
  });

  // Generate items table rows
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid var(--email-border);">
        <div style="font-weight: 600; color: var(--email-foreground);">${item.name || item.Name}</div>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid var(--email-border); text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid var(--email-border); text-align: right;">Rs. ${Number(item.price).toLocaleString('en-PK')}</td>
    </tr>
  `).join('');

  const myOrderUrl = `${process.env.NEXTAUTH_URL || 'https://chinaunique.pk'}/orders/${order._id}?token=${order.secureToken}`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thank You for Your Order</title>
      <style>
        :root {
          --email-background: ${EMAIL_THEME.background};
          --email-foreground: ${EMAIL_THEME.foreground};
          --email-card: ${EMAIL_THEME.card};
          --email-primary: ${EMAIL_THEME.primary};
          --email-primary-foreground: ${EMAIL_THEME.primaryForeground};
          --email-secondary: ${EMAIL_THEME.secondary};
          --email-muted: ${EMAIL_THEME.muted};
          --email-muted-foreground: ${EMAIL_THEME.mutedForeground};
          --email-border: ${EMAIL_THEME.border};
          --email-success: ${EMAIL_THEME.success};
          --email-radius-sm: ${EMAIL_THEME.radiusSm};
          --email-radius-lg: ${EMAIL_THEME.radiusLg};
          --email-radius-xl: ${EMAIL_THEME.radiusXl};
        }
        body { font-family: 'Geist', system-ui, sans-serif; line-height: 1.6; color: var(--email-foreground); margin: 0; padding: 0; background-color: var(--email-background); }
        .wrapper { width: 100%; padding: 20px 0; background-color: var(--email-background); }
        .container { max-width: 600px; margin: 0 auto; background: var(--email-card); border-radius: var(--email-radius-xl); overflow: hidden; box-shadow: 0 4px 6px -1px color-mix(in oklab, var(--email-foreground) 10%, transparent); }
        .header { background: var(--email-success); padding: 40px 20px; text-align: center; color: var(--email-primary-foreground); }
        .content { padding: 32px 24px; }
        .invoice-card { border: 1px solid var(--email-border); border-radius: var(--email-radius-xl); padding: 24px; margin: 24px 0; }
        .item-table { width: 100%; border-collapse: collapse; }
        .total-row { font-weight: 700; font-size: 18px; color: var(--email-success); }
        .btn-container { text-align: center; margin-top: 32px; }
        .button { display: inline-block; background: var(--email-success); color: var(--email-primary-foreground) !important; padding: 14px 28px; border-radius: var(--email-radius-lg); text-decoration: none; font-weight: 600; font-size: 16px; }
        .footer { padding: 32px; text-align: center; font-size: 14px; color: var(--email-muted-foreground); border-top: 1px solid var(--email-border); }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <div style="font-size: 48px; margin-bottom: 16px;">✨</div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Thank You, ${customerName}!</h1>
            <p style="margin: 8px 0 0; opacity: 0.9;">We've received your order and are getting it ready.</p>
          </div>
          
          <div class="content">
            <p style="font-size: 16px; margin: 0;">Hi ${customerName.split(' ')[0]},</p>
            <p style="font-size: 16px;">Your order <strong>${orderId}</strong> has been placed successfully. We will notify you as soon as it's shipped!</p>
            
            <div class="invoice-card">
              <div style="display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid var(--email-border); padding-bottom: 12px;">
                <span style="font-size: 12px; font-weight: 700; color: var(--email-muted-foreground); text-transform: uppercase;">Order Invoice</span>
                <span style="font-size: 12px; color: var(--email-muted-foreground);">${dateStr}</span>
              </div>
              
              <table class="item-table">
                <thead>
                  <tr style="text-align: left; font-size: 12px; color: var(--email-muted-foreground); text-transform: uppercase;">
                    <th style="padding: 8px 0;">Item</th>
                    <th style="padding: 8px 0; text-align: center;">Qty</th>
                    <th style="padding: 8px 0; text-align: right;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                  <tr>
                    <td colspan="2" style="padding: 20px 0 0; text-align: right; font-weight: 600;">Total Amount</td>
                    <td style="padding: 20px 0 0; text-align: right; font-weight: 700; color: var(--email-success); font-size: 20px;">Rs. ${totalAmount.toLocaleString('en-PK')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style="background: color-mix(in oklab, var(--email-success) 14%, var(--email-card)); border-radius: var(--email-radius-xl); padding: 16px; border: 1px solid color-mix(in oklab, var(--email-success) 20%, var(--email-card)); margin-bottom: 24px;">
              <p style="margin: 0; font-size: 14px; color: var(--email-primary);">
                <strong>Shipping to:</strong><br>
                ${customerAddress}
              </p>
            </div>

            <div class="btn-container">
              <a href="${myOrderUrl}" class="button">View My Order</a>
            </div>
          </div>

          <div class="footer">
            <p style="margin: 0; font-weight: 700; color: var(--email-foreground);">China Unique - Home & Lifestyle</p>
            <p style="margin: 4px 0 0;">Building beautiful homes together.</p>
            <div style="margin-top: 20px; font-size: 12px; color: var(--email-muted-foreground);">
              You received this email because you placed an order on chinaunique.pk
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
