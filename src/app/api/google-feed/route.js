import { getCatalogFeed } from '@/lib/data';
import { getSiteUrl } from '@/lib/siteUrl';

function escapeXml(unsafe) {
  return String(unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateCdata(text) {
  const safeText = String(text || '').replace(/]]>/g, ']]]]><![CDATA[>');
  return `<![CDATA[${safeText}]]>`;
}

function renderFeedItem(item) {
  const additionalImages = (item.additionalImageLinks || [])
    .map((url) => `\n    <g:additional_image_link>${escapeXml(url)}</g:additional_image_link>`)
    .join('');

  const availability = item.availability === 'in stock' ? 'in_stock' : 'out_of_stock';

  return `  <item>
    <g:id>${escapeXml(item.id)}</g:id>
    <g:title>${generateCdata(item.title)}</g:title>
    <g:description>${generateCdata(item.description)}</g:description>
    <g:link>${escapeXml(item.link)}</g:link>
    <g:image_link>${escapeXml(item.imageLink)}</g:image_link>${additionalImages}
    <g:condition>${item.condition || 'new'}</g:condition>
    <g:availability>${availability}</g:availability>
    <g:price>${item.price}</g:price>${item.salePrice ? `\n    <g:sale_price>${item.salePrice}</g:sale_price>` : ''}
    <g:brand>${generateCdata(item.brand)}</g:brand>${item.productType ? `\n    <g:product_type>${generateCdata(item.productType)}</g:product_type>` : ''}
  </item>`;
}

export async function GET() {
  try {
    const siteUrl = getSiteUrl();
    const feed = await getCatalogFeed(siteUrl);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${generateCdata(`${feed.storeName} Google Merchant Feed`)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${generateCdata(`Product feed for Google Merchant Center - ${feed.storeName}`)}</description>
${feed.items.map(renderFeedItem).join('\n')}
  </channel>
</rss>`;

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
