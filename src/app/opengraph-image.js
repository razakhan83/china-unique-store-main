import { ImageResponse } from 'next/og';

export const alt = 'China Unique Store';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px',
          background:
            'linear-gradient(135deg, #0f3d34 0%, #175347 52%, #f4c95d 140%)',
          color: '#fff8eb',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
          }}
        >
          <div
            style={{
              width: '76px',
              height: '76px',
              borderRadius: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 248, 235, 0.14)',
              border: '1px solid rgba(255, 248, 235, 0.24)',
              fontSize: '34px',
              fontWeight: 700,
            }}
          >
            CU
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ fontSize: '22px', opacity: 0.86 }}>Pakistan Storefront</div>
            <div style={{ fontSize: '38px', fontWeight: 800, letterSpacing: '-0.03em' }}>
              China Unique Store
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            maxWidth: '880px',
          }}
        >
          <div
            style={{
              fontSize: '68px',
              lineHeight: 1.02,
              fontWeight: 900,
              letterSpacing: '-0.05em',
            }}
          >
            Premium kitchenware, home decor, and everyday lifestyle picks.
          </div>
          <div
            style={{
              fontSize: '26px',
              lineHeight: 1.35,
              opacity: 0.88,
            }}
          >
            Curated for modern Pakistani homes with elegant essentials and gift-worthy finds.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
