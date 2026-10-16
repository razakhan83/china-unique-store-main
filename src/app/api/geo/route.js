import { NextResponse } from 'next/server';
import mongooseConnect from '@/lib/mongooseConnect';
import DailyTraffic from '@/models/DailyTraffic';

// In-memory cache for IP lookups (prevents repeated external HTTP calls to ipwho.is)
const geoCache = new Map();
const GEO_CACHE_MAX = 5000;
const GEO_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const BOT_USER_AGENTS = /bot|spider|crawl|slurp|facebookexternalhit|whatsapp|preview|headless|curl|wget|python|postman|lighthouse/i;

function isBot(userAgent) {
  if (!userAgent) return false;
  return BOT_USER_AGENTS.test(userAgent);
}

// Deterministic 10% sampling based on client IP and date string
function isSampled(ip, dateStr, rate = 0.1) {
  if (!ip || ip === '127.0.0.1' || ip === '::1') return Math.random() < rate;
  const seed = `${ip}-${dateStr}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 100) < (rate * 100);
}

function roundCoordinate(val) {
  const num = parseFloat(val);
  if (isNaN(num)) return null;
  // Round to 1 decimal place (~11km / city-level privacy accuracy)
  return Math.round(num * 10) / 10;
}

// Background fire-and-forget traffic aggregator with 10% sampling weighting
async function recordDailyTraffic(city, country, lat, lng, weight = 10) {
  try {
    await mongooseConnect();
    const todayStr = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
    const safeCity = city || 'Karachi';
    const safeCountry = country || 'Pakistan';

    // 1. Try to increment city count if it already exists in today's document
    const updated = await DailyTraffic.findOneAndUpdate(
      { date: todayStr, 'cities.city': safeCity },
      {
        $inc: { totalVisits: weight, 'cities.$.count': weight },
      }
    );

    // 2. If the city wasn't in today's document, add it or create today's document
    if (!updated) {
      await DailyTraffic.findOneAndUpdate(
        { date: todayStr },
        {
          $inc: { totalVisits: weight },
          $push: {
            cities: {
              city: safeCity,
              country: safeCountry,
              lat: lat || 24.9,
              lng: lng || 67.0,
              count: weight,
            },
          },
        },
        { upsert: true, new: true }
      );
    }
  } catch {
    // Silent fail - analytics must never crash or block requests
  }
}

export async function GET(request) {
  try {
    const userAgent = request.headers.get('user-agent') || '';
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : (request.headers.get('x-real-ip') || '');
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Skip bots completely from database writes & external lookups
    const botRequest = isBot(userAgent);

    // 2. Determine if this visitor write qualifies for 10% sampling
    const shouldRecord = !botRequest && isSampled(ip, todayStr, 0.1);

    // 3. Next.js / Vercel Edge Geo Headers
    const vercelLat = request.headers.get('x-vercel-ip-latitude');
    const vercelLng = request.headers.get('x-vercel-ip-longitude');
    const vercelCity = request.headers.get('x-vercel-ip-city');
    const vercelCountry = request.headers.get('x-vercel-ip-country');

    if (vercelLat && vercelLng) {
      const lat = roundCoordinate(vercelLat);
      const lng = roundCoordinate(vercelLng);
      const city = vercelCity ? decodeURIComponent(vercelCity) : 'Karachi';
      const country = vercelCountry || 'Pakistan';

      if (shouldRecord) {
        recordDailyTraffic(city, country, lat, lng, 10);
      }

      return NextResponse.json({ lat, lng, city, country });
    }

    // If bot and no Vercel geo headers, return fallback immediately without external fetch
    if (botRequest) {
      return NextResponse.json({
        lat: 24.9,
        lng: 67.0,
        city: 'Karachi',
        country: 'Pakistan',
      });
    }

    // 4. Check in-memory geo cache before external call
    if (ip && geoCache.has(ip)) {
      const cached = geoCache.get(ip);
      if (Date.now() - cached.timestamp < GEO_CACHE_TTL_MS) {
        if (shouldRecord) {
          recordDailyTraffic(cached.data.city, cached.data.country, cached.data.lat, cached.data.lng, 10);
        }
        return NextResponse.json(cached.data);
      }
      geoCache.delete(ip);
    }

    // 5. Local dev or non-Vercel fallback: Try ipwho.is with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
      const isLocalhost = !ip || ip === '127.0.0.1' || ip === '::1';
      const url = isLocalhost ? 'https://ipwho.is/' : `https://ipwho.is/${ip}`;

      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'ChinaUnique/1.0' },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.success !== false && data.latitude && data.longitude) {
          const lat = roundCoordinate(data.latitude);
          const lng = roundCoordinate(data.longitude);
          const city = data.city || 'Karachi';
          const country = data.country || 'Pakistan';
          const geoPayload = { lat, lng, city, country };

          // Cache lookup
          if (ip && !isLocalhost) {
            if (geoCache.size >= GEO_CACHE_MAX) {
              const firstKey = geoCache.keys().next().value;
              geoCache.delete(firstKey);
            }
            geoCache.set(ip, { data: geoPayload, timestamp: Date.now() });
          }

          if (shouldRecord) {
            recordDailyTraffic(city, country, lat, lng, 10);
          }

          return NextResponse.json(geoPayload);
        }
      }
    } catch {
      // Catch timeout or network errors silently
    } finally {
      clearTimeout(timeoutId);
    }

    // Default safe fallback if unlocatable
    if (shouldRecord) {
      recordDailyTraffic('Karachi', 'Pakistan', 24.9, 67.0, 10);
    }
    return NextResponse.json({
      lat: 24.9,
      lng: 67.0,
      city: 'Karachi',
      country: 'Pakistan',
    });
  } catch {
    // Fail silently with default fallback
    return NextResponse.json({
      lat: 31.5,
      lng: 74.3,
      city: 'Lahore',
      country: 'Pakistan',
    });
  }
}
