import PusherClient from 'pusher-js';

const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2';

let pusherClientInstance = null;

export function getPusherClient() {
  if (typeof window === 'undefined') return null;
  if (!key) return null;

  if (!pusherClientInstance) {
    try {
      pusherClientInstance = new PusherClient(key, {
        cluster,
        authEndpoint: '/api/pusher/auth',
      });
    } catch {
      pusherClientInstance = null;
    }
  }

  return pusherClientInstance;
}
