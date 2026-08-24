async function testPublicTracking() {
  const parcelNo = '16223506416434';
  const urls = [
    `https://shipnoc.com/tracking?tracking_number=${parcelNo}`,
    `https://shipnoc.com/track?tracking_no=${parcelNo}`,
    `https://shipnoc.com/api/track/${parcelNo}`,
    `https://portal.shipnoc.com/api/GetTracking?cn=${parcelNo}`,
  ];

  for (const u of urls) {
    try {
      const r = await fetch(u, { signal: AbortSignal.timeout(4000) });
      console.log(`URL: ${u} -> Status: ${r.status}`);
      if (r.ok) {
        const text = await r.text();
        console.log(`Response snippet (${u}):`, text.slice(0, 200));
      }
    } catch (e) {
      console.log(`URL ${u} failed:`, e.message);
    }
  }
}

testPublicTracking();
