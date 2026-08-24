/**
 * NOC Express Courier API Helper Module
 * Base API URL: http://api.shipnoc.com/api
 * Supports 2 NOC Accounts / Portals (portal_1, portal_2)
 */

const BASE_URL = 'https://api.shipnoc.com/api';

export const NOC_PORTALS = [
  { id: 'portal_1', name: 'Main Account (unique items)' },
  { id: 'portal_2', name: 'Secondary Account (aamsaman)' },
];

/**
 * Resolves credentials for a given portal key ('portal_1' | 'portal_2')
 */
export function getNocCredentials(portalKey = 'portal_1') {
  const key = portalKey === 'portal_2' ? '2' : '1';

  const userName = process.env[`NOC_PORTAL_${key}_USERNAME`] || process.env.NOC_USERNAME || '';
  const password = process.env[`NOC_PORTAL_${key}_PASSWORD`] || process.env.NOC_PASSWORD || '';
  let signature = process.env[`NOC_PORTAL_${key}_SIGNATURE`] || process.env.NOC_SIGNATURE || '';

  // Smart concatenation fallback: NOC API requires Signature format (UserName + Password + SecretKey)
  if (signature && !signature.includes(password)) {
    signature = `${userName}${password}${signature}`;
  }

  return { userName, password, signature };
}

/**
 * 1. Book Parcels (Single or Bulk)
 * Endpoint: POST /api/BookParcel
 */
export async function bookNocParcels(parcels, portalKey = 'portal_1') {
  const { userName, password, signature } = getNocCredentials(portalKey);

  if (!userName || !password) {
    throw new Error(`NOC Express credentials for '${portalKey}' are missing. Please configure NOC_PORTAL_${portalKey === 'portal_2' ? '2' : '1'}_USERNAME and PASSWORD in .env.local.`);
  }

  const payload = {
    UserName: userName,
    Password: password,
    Signature: signature,
    Parcels: parcels.map((p) => ({
      ConsigneeName: String(p.consigneeName || '').trim(),
      ConsigneeAddress: String(p.consigneeAddress || '').trim(),
      ConsigneeEmail: (() => {
        const email = String(p.consigneeEmail || '').trim();
        return email && email.includes('@') && email.includes('.') ? email : 'customer@chinaunique.pk';
      })(),
      ConsigneeCellNo: String(p.consigneeCellNo || '').trim(),
      ItemType: String(p.itemType || 'Mix').trim(),
      City: String(p.city || '').trim(),
      Quantity: String(p.quantity || 1),
      CODAmount: String(p.codAmount ?? 0),
      Weight: String(p.weight ?? 1),
      SpecialInstruction: String(p.specialInstruction || '').trim(),
    })),
  };

  const response = await fetch(`${BASE_URL}/BookParcel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`NOC API HTTP error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * 2. Get Supported Cities
 * Endpoint: GET /api/GetCity
 */
export async function fetchNocCities(portalKey = 'portal_1') {
  const { userName, password, signature } = getNocCredentials(portalKey);
  const url = `${BASE_URL}/GetCity?UserName=${encodeURIComponent(userName)}&Password=${encodeURIComponent(password)}&Signature=${encodeURIComponent(signature)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    throw new Error(`NOC API HTTP error: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

/**
 * 3. Get Parcel Tracking History
 * Endpoint: GET /api/GetParcelTracking
 */
export async function trackNocParcel(parcelNo, portalKey = 'portal_1') {
  const { userName, password, signature } = getNocCredentials(portalKey);
  const query = `UserName=${encodeURIComponent(userName)}&Password=${encodeURIComponent(password)}&Signature=${encodeURIComponent(signature)}&ParcelNo=${encodeURIComponent(parcelNo)}`;

  const urls = [
    `https://api.shipnoc.com/api/GetParcelTracking?${query}`,
    `http://api.shipnoc.com/api/GetParcelTracking?${query}`,
  ];

  let lastError = null;
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(6000),
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('NOC API tracking service unreachable');
}

/**
 * 4. Cancel Parcel
 * Endpoint: POST /api/CancelParcel
 */
export async function cancelNocParcel(parcelNos, portalKey = 'portal_1') {
  const { userName, password, signature } = getNocCredentials(portalKey);

  const payload = {
    UserName: userName,
    Password: password,
    Signature: signature,
    Parcels: (Array.isArray(parcelNos) ? parcelNos : [parcelNos]).map((pNo) => ({
      ParcelNo: String(pNo).trim(),
    })),
  };

  const response = await fetch(`${BASE_URL}/CancelParcel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`NOC API HTTP error: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
