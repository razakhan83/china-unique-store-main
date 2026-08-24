import { getNocCredentials } from '../src/lib/nocCourier.js';

async function probeNocEndpoints() {
  const parcelNo = '16223506416434';
  const creds1 = getNocCredentials('portal_1');
  const creds2 = getNocCredentials('portal_2');

  const accounts = [
    { name: 'portal_1', creds: creds1 },
    { name: 'portal_2', creds: creds2 },
  ];

  const endpoints = [
    'GetParcelTracking',
    'GetTrackingDetail',
    'GetTracking',
    'TrackParcel',
    'GetParcelStatus',
    'GetStatus',
    'GetParcelDetails',
    'GetHistory',
    'GetParcelHistory',
  ];

  for (const acc of accounts) {
    console.log(`\n=== PROBING ${acc.name} (${acc.creds.userName}) ===`);
    const { userName, password, signature } = acc.creds;

    for (const ep of endpoints) {
      // 1. GET with UserName, Password, Signature, ParcelNo
      const url1 = `https://api.shipnoc.com/api/${ep}?UserName=${encodeURIComponent(userName)}&Password=${encodeURIComponent(password)}&Signature=${encodeURIComponent(signature)}&ParcelNo=${encodeURIComponent(parcelNo)}`;
      // 2. GET with TrackingNo
      const url2 = `https://api.shipnoc.com/api/${ep}?UserName=${encodeURIComponent(userName)}&Password=${encodeURIComponent(password)}&Signature=${encodeURIComponent(signature)}&TrackingNo=${encodeURIComponent(parcelNo)}`;
      // 3. POST JSON
      
      try {
        const r1 = await fetch(url1, { signal: AbortSignal.timeout(4000) });
        if (r1.ok) {
          const json = await r1.json().catch(() => null);
          console.log(`[GET ${ep}] -> Status: ${r1.status}`, json);
        } else {
          console.log(`[GET ${ep}] -> HTTP ${r1.status}`);
        }
      } catch (e) {
        // ignore
      }

      try {
        const rPost = await fetch(`https://api.shipnoc.com/api/${ep}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            UserName: userName,
            Password: password,
            Signature: signature,
            ParcelNo: parcelNo,
            TrackingNo: parcelNo,
          }),
          signal: AbortSignal.timeout(4000),
        });
        if (rPost.ok) {
          const json = await rPost.json().catch(() => null);
          console.log(`[POST ${ep}] -> Status: ${rPost.status}`, json);
        }
      } catch (e) {
        // ignore
      }
    }
  }
}

probeNocEndpoints();
