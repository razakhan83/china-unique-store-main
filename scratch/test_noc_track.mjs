import { trackNocParcel, getNocCredentials } from '../src/lib/nocCourier.js';

async function testTrack() {
  const parcelNo = '16223506416434';
  console.log('Testing portal 1:');
  const creds1 = getNocCredentials('portal_1');
  console.log('Creds 1:', { userName: creds1.userName, hasPass: !!creds1.password, hasSig: !!creds1.signature });
  try {
    const res1 = await trackNocParcel(parcelNo, 'portal_1');
    console.log('Portal 1 Res:', JSON.stringify(res1, null, 2));
  } catch (e) {
    console.error('Portal 1 Error:', e.message);
  }

  console.log('\nTesting portal 2:');
  const creds2 = getNocCredentials('portal_2');
  console.log('Creds 2:', { userName: creds2.userName, hasPass: !!creds2.password, hasSig: !!creds2.signature });
  try {
    const res2 = await trackNocParcel(parcelNo, 'portal_2');
    console.log('Portal 2 Res:', JSON.stringify(res2, null, 2));
  } catch (e) {
    console.error('Portal 2 Error:', e.message);
  }
}

testTrack();
