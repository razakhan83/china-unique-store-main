import mongooseConnect from '@/lib/mongooseConnect';
import Product from '@/models/Product';

// Helper to safely escape XML characters
function escapeXml(unsafe) {
  return String(unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Helper for CDATA wrapper to prevent XML syntax errors
function generateCdata(text) {
  const safeText = String(text || '').replace(/]]>/g, ']]]]><![CDATA[>');
  return `<![CDATA[${safeText}]]>`;
}

// Helper to strip HTML tags for plain text descriptions
function stripHtml(html) {
  return String(html || '').replace(/<[^>]*>?/gm, '').trim();
}

function renderFeedItem(product, siteUrl) {
  // ID or SKU
  const id = product._id.toString();
  
  // Clean product title (max 150 chars)
  const title = (product.Name || '').substring(0, 150);
  
  // Plain text description without HTML tags
  const rawDescription = product.Description || product.shortDescription || product.Name || '';
  const description = stripHtml(rawDescription);
  
  // Absolute product URL
  const link = `${siteUrl}/product/${product.slug}`;
  
  // Absolute image URL
  const imageLink = product.Images && product.Images.length > 0 
    ? product.Images[0].url 
    : '';

  // Condition
  const condition = 'new';

  // Availability based on product stock status/quantity
  const availability = product.StockStatus === 'Out of Stock' || product.stockQuantity <= 0 
    ? 'out_of_stock' 
    : 'in_stock';

  // Price format: Number followed by currency code
  const price = `${product.Price} PKR`;

  return `  <item>
    <g:id>${escapeXml(id)}</g:id>
    <g:title>${generateCdata(title)}</g:title>
    <g:description>${generateCdata(description)}</g:description>
    <g:link>${escapeXml(link)}</g:link>
    <g:image_link>${escapeXml(imageLink)}</g:image_link>
    <g:condition>${condition}</g:condition>
    <g:availability>${availability}</g:availability>
    <g:price>${price}</g:price>
  </item>`;
}

export async function GET(request) {
  try {
    // 1. Connect to the database
    await mongooseConnect();
    
    // 2. Fetch all active products
    const products = await Product.find({ showOnStore: true }).lean();
    
    // Determine the base site URL (ensure no trailing slash)
    const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const siteUrl = rawSiteUrl.replace(/\/$/, '');

    // 3. Generate the RSS 2.0 XML feed with the Google Shopping namespace
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Google Merchant Feed</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>Product feed for Google Merchant Center</description>
${products.map(p => renderFeedItem(p, siteUrl)).join('\n')}
  </channel>
</rss>`;

    // 4. Set HTTP Response headers properly
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error generating Google feed:', error);
    return new Response('Error generating Google feed', { status: 500 });
  }
}
