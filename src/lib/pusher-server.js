import Pusher from 'pusher';

const appId = process.env.PUSHER_APP_ID || '2191144';
const key = process.env.NEXT_PUBLIC_PUSHER_KEY || '0bba93dfa3f84352ac50';
const secret = process.env.PUSHER_SECRET || 'b91551dde2e7a9d77437';
const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2';

let pusherServerInstance = null;

export function getPusherServer() {
  if (!appId || !key || !secret) {
    return null;
  }

  if (!pusherServerInstance) {
    try {
      pusherServerInstance = new Pusher({
        appId,
        key,
        secret,
        cluster,
        useTLS: true,
      });
    } catch {
      pusherServerInstance = null;
    }
  }

  return pusherServerInstance;
}
