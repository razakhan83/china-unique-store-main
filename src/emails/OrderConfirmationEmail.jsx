import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

import { normalizeSocialUrl } from '@/lib/social';
import { createWhatsAppUrl } from '@/lib/whatsapp';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryImage';

const theme = {
  page: '#f5f6f7',
  white: '#ffffff',
  text: '#1f2937',
  muted: '#6b7280',
  border: '#e5e7eb',
  soft: '#f9fafb',
  primary: '#0f766e',
  primaryText: '#ffffff',
};

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

function formatDate(value) {
  if (!value) return 'Date unavailable';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return date.toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
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

function getOptimizedEmailImage(url) {
  const source = getText(url);
  if (!source) return '';

  return optimizeCloudinaryUrl(source, {
    width: 96,
    height: 96,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    format: 'jpg',
    includeDpr: false,
  });
}

function getItems(order) {
  if (!Array.isArray(order?.items)) return [];

  return order.items.map((item, index) => {
    const quantity = Math.max(1, getNumber(item?.quantity, 1));
    const unitPrice = getNumber(item?.price);
    const lineTotal = unitPrice * quantity;

    return {
      id: `${item?.productId || item?.name || item?.Name || 'item'}-${index}`,
      name: getText(item?.name || item?.Name, `Item ${index + 1}`),
      quantity,
      lineTotal,
      image: getOptimizedEmailImage(item?.image || item?.Image || item?.imageUrl),
      variant: getText(item?.variant),
    };
  });
}

function getPricing(order, items) {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const total = Math.max(getNumber(order?.totalAmount, subtotal), subtotal);
  const shipping = Math.max(total - subtotal, 0);

  return { subtotal, shipping, total };
}

function InfoCard({ label, value }) {
  return (
    <Section style={styles.metaCard}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </Section>
  );
}

function ItemCard({ item }) {
  return (
    <Section style={styles.itemCard}>
      {item.image ? (
        <Img src={item.image} alt={item.name} width="64" height="64" style={styles.productImage} />
      ) : (
        <Section style={styles.productImageFallback}>
          <Text style={styles.productImageFallbackText}>N/A</Text>
        </Section>
      )}

      <Text style={styles.productName}>{item.name}</Text>
      {item.variant ? <Text style={styles.productMeta}>{item.variant}</Text> : null}

      <Section style={styles.itemMetaBox}>
        <Text style={styles.itemMetaRow}>
          <span style={styles.itemMetaLabel}>Qty</span>
          <span style={styles.itemMetaValue}>{item.quantity}</span>
        </Text>
        <Text style={styles.itemMetaRowLast}>
          <span style={styles.itemMetaLabel}>Price</span>
          <span style={styles.itemMetaValue}>{formatCurrency(item.lineTotal)}</span>
        </Text>
      </Section>
    </Section>
  );
}

export default function OrderConfirmationEmail({ order, branding }) {
  const customerName = getText(order?.customerName, 'Customer');
  const firstName = customerName.split(/\s+/)[0] || customerName;
  const orderId = getText(order?.orderId, 'Pending');
  const orderDate = formatDate(order?.createdAt);
  const orderUrl = buildOrderUrl(order, branding?.baseUrl);
  const items = getItems(order);
  const pricing = getPricing(order, items);
  const logoUrl = getText(branding?.lightLogoUrl || branding?.darkLogoUrl);
  const supportEmail = getText(branding?.supportEmail);
  const whatsappUrl = createWhatsAppUrl(branding?.whatsappNumber);
  const footerLinks = [
    { href: normalizeSocialUrl(branding?.facebookPageUrl), label: 'Facebook' },
    { href: normalizeSocialUrl(branding?.instagramUrl), label: 'Instagram' },
    { href: whatsappUrl, label: 'WhatsApp' },
  ].filter((item) => item.href);

  return (
    <Html>
      <Head />
      <Preview>{`Order ${orderId} confirmed`}</Preview>
      <Body style={styles.body}>
        <Container style={styles.outer}>
          <Section style={styles.card}>
            <Section style={styles.logoWrap}>
              {logoUrl ? (
                <Img
                  src={logoUrl}
                  alt={branding?.storeName || 'China Unique'}
                  width="180"
                  style={styles.logo}
                />
              ) : (
                <Text style={styles.logoFallback}>{branding?.storeName || 'China Unique Store'}</Text>
              )}
            </Section>

            <Section style={styles.hero}>
              <Text style={styles.eyebrow}>ORDER CONFIRMATION</Text>
              <Heading as="h1" style={styles.heading}>
                Thank you for your order, {customerName}!
              </Heading>
              <Text style={styles.lead}>
                Hi {firstName}, your order has been placed successfully. We&apos;ll keep you updated as it moves through fulfillment.
              </Text>
            </Section>

            <Section style={styles.metaSection}>
              <InfoCard label="Order ID" value={orderId} />
              <InfoCard label="Date" value={orderDate} />
            </Section>

            <Section style={styles.trackWrap}>
              <Button href={orderUrl} style={styles.trackButton}>
                Track Order
              </Button>
            </Section>

            <Section style={styles.orderBlock}>
              <Text style={styles.blockTitle}>Your order</Text>

              {items.length > 0 ? (
                items.map((item) => <ItemCard key={item.id} item={item} />)
              ) : (
                <Text style={styles.emptyText}>Order items were unavailable for this email.</Text>
              )}

              <Section style={styles.totalsWrap}>
                <Text style={styles.totalRow}>
                  <span>Subtotal</span>
                  <span>{formatCurrency(pricing.subtotal)}</span>
                </Text>
                <Text style={styles.totalRow}>
                  <span>Shipping</span>
                  <span>{formatCurrency(pricing.shipping)}</span>
                </Text>
                <Hr style={styles.totalDivider} />
                <Text style={styles.grandTotalRow}>
                  <span>Total</span>
                  <span>{formatCurrency(pricing.total)}</span>
                </Text>
              </Section>
            </Section>

            <Section style={styles.helpBlock}>
              <Text style={styles.blockTitle}>Need help?</Text>
              <Text style={styles.helpText}>
                If something looks off with your order, reach out and we&apos;ll sort it out quickly.
              </Text>
              <Text style={styles.helpText}>
                {supportEmail ? (
                  <>
                    Email us at{' '}
                    <Link href={`mailto:${supportEmail}`} style={styles.inlineLink}>
                      {supportEmail}
                    </Link>
                  </>
                ) : (
                  'Reply to this email for support.'
                )}
              </Text>
            </Section>

            <Hr style={styles.footerDivider} />

            <Section style={styles.footer}>
              <Text style={styles.footerStore}>{branding?.storeName || 'China Unique Store'}</Text>
              <Text style={styles.footerCopy}>
                {branding?.businessAddress || 'Thank you for shopping with China Unique.'}
              </Text>
              {footerLinks.length > 0 ? (
                <Text style={styles.footerLinks}>
                  {footerLinks.map((item, index) => (
                    <span key={item.label}>
                      {index > 0 ? ' | ' : ''}
                      <Link href={item.href} style={styles.inlineLink}>
                        {item.label}
                      </Link>
                    </span>
                  ))}
                </Text>
              ) : null}
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: theme.page,
    margin: 0,
    padding: '24px 12px',
    fontFamily: 'Helvetica Neue, Arial, sans-serif',
    color: theme.text,
  },
  outer: {
    maxWidth: '640px',
    margin: '0 auto',
  },
  card: {
    backgroundColor: theme.white,
    border: `1px solid ${theme.border}`,
    borderRadius: '20px',
    overflow: 'hidden',
  },
  logoWrap: {
    padding: '28px 20px 8px',
    textAlign: 'center',
  },
  logo: {
    margin: '0 auto',
    width: '180px',
    height: 'auto',
  },
  logoFallback: {
    margin: 0,
    fontSize: '24px',
    lineHeight: '32px',
    fontWeight: 700,
    color: theme.text,
  },
  hero: {
    padding: '8px 20px 8px',
    textAlign: 'center',
  },
  eyebrow: {
    margin: '0 0 10px',
    fontSize: '12px',
    lineHeight: '18px',
    letterSpacing: '0.12em',
    fontWeight: 700,
    color: theme.muted,
  },
  heading: {
    margin: '0 0 12px',
    fontSize: '28px',
    lineHeight: '34px',
    fontWeight: 700,
    color: theme.text,
  },
  lead: {
    margin: 0,
    fontSize: '15px',
    lineHeight: '24px',
    color: theme.muted,
  },
  metaSection: {
    padding: '18px 20px 0',
  },
  metaCard: {
    border: `1px solid ${theme.border}`,
    borderRadius: '12px',
    padding: '14px 16px',
    marginBottom: '10px',
    backgroundColor: theme.soft,
  },
  metaLabel: {
    margin: '0 0 4px',
    fontSize: '12px',
    lineHeight: '18px',
    fontWeight: 700,
    color: theme.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  metaValue: {
    margin: 0,
    fontSize: '15px',
    lineHeight: '22px',
    fontWeight: 600,
    color: theme.text,
  },
  trackWrap: {
    padding: '24px 20px 8px',
    textAlign: 'center',
  },
  trackButton: {
    backgroundColor: theme.primary,
    color: theme.primaryText,
    borderRadius: '10px',
    padding: '14px 24px',
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: 700,
    textDecoration: 'none',
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
  },
  orderBlock: {
    margin: '24px 20px 0',
    border: `1px solid ${theme.border}`,
    borderRadius: '18px',
    overflow: 'hidden',
  },
  blockTitle: {
    margin: 0,
    padding: '18px 18px 12px',
    fontSize: '18px',
    lineHeight: '26px',
    fontWeight: 700,
    color: theme.text,
  },
  itemCard: {
    padding: '16px 18px',
    borderTop: `1px solid ${theme.border}`,
  },
  productImage: {
    width: '64px',
    height: '64px',
    borderRadius: '12px',
    objectFit: 'cover',
    border: `1px solid ${theme.border}`,
    display: 'block',
    marginBottom: '12px',
  },
  productImageFallback: {
    width: '64px',
    height: '64px',
    borderRadius: '12px',
    backgroundColor: theme.soft,
    border: `1px solid ${theme.border}`,
    textAlign: 'center',
    marginBottom: '12px',
  },
  productImageFallbackText: {
    margin: 0,
    lineHeight: '64px',
    fontSize: '10px',
    fontWeight: 700,
    color: theme.muted,
  },
  productName: {
    margin: '0 0 4px',
    fontSize: '15px',
    lineHeight: '22px',
    fontWeight: 600,
    color: theme.text,
  },
  productMeta: {
    margin: '0 0 12px',
    fontSize: '12px',
    lineHeight: '18px',
    color: theme.muted,
  },
  itemMetaBox: {
    border: `1px solid ${theme.border}`,
    borderRadius: '12px',
    backgroundColor: theme.soft,
    padding: '12px 14px',
  },
  itemMetaRow: {
    margin: '0 0 10px',
    fontSize: '14px',
    lineHeight: '20px',
    color: theme.text,
  },
  itemMetaRowLast: {
    margin: 0,
    fontSize: '14px',
    lineHeight: '20px',
    color: theme.text,
  },
  itemMetaLabel: {
    color: theme.muted,
  },
  itemMetaValue: {
    float: 'right',
    fontWeight: 600,
    color: theme.text,
  },
  emptyText: {
    margin: 0,
    padding: '16px 18px 18px',
    fontSize: '14px',
    lineHeight: '20px',
    color: theme.muted,
  },
  totalsWrap: {
    padding: '18px',
    backgroundColor: theme.soft,
    borderTop: `1px solid ${theme.border}`,
  },
  totalRow: {
    margin: '0 0 10px',
    fontSize: '14px',
    lineHeight: '20px',
    color: theme.text,
  },
  totalDivider: {
    borderColor: theme.border,
    margin: '10px 0 12px',
  },
  grandTotalRow: {
    margin: 0,
    fontSize: '16px',
    lineHeight: '24px',
    fontWeight: 700,
    color: theme.text,
  },
  helpBlock: {
    padding: '24px 20px 0',
  },
  helpText: {
    margin: '0 0 8px',
    fontSize: '14px',
    lineHeight: '22px',
    color: theme.muted,
  },
  inlineLink: {
    color: theme.primary,
    textDecoration: 'none',
    fontWeight: 700,
  },
  footerDivider: {
    borderColor: theme.border,
    margin: '24px 20px 0',
  },
  footer: {
    padding: '20px 20px 28px',
    textAlign: 'center',
  },
  footerStore: {
    margin: '0 0 6px',
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: 700,
    color: theme.text,
  },
  footerCopy: {
    margin: '0 0 8px',
    fontSize: '13px',
    lineHeight: '20px',
    color: theme.muted,
  },
  footerLinks: {
    margin: 0,
    fontSize: '13px',
    lineHeight: '20px',
    color: theme.muted,
  },
};
