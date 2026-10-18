import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPusherServer } from '@/lib/pusher-server';

const PUBLIC_CHANNELS = new Set(['presence-active-visitors']);

function isChannelAllowedForRole(channelName, role, session) {
  if (role === 'admin') {
    if (PUBLIC_CHANNELS.has(channelName)) return true;
    if (
      channelName === 'private-admin' ||
      channelName === 'presence-admin' ||
      channelName.startsWith('private-admin-') ||
      channelName.startsWith('presence-admin-') ||
      channelName === 'private-orders' ||
      channelName.startsWith('private-orders-')
    ) {
      return true;
    }
    return false;
  }

  if (role === 'user') {
    if (PUBLIC_CHANNELS.has(channelName)) return true;
    const userId = session?.user?.id;
    if (userId && (channelName === `private-user-${userId}` || channelName === `presence-user-${userId}`)) {
      return true;
    }
    return false;
  }

  // visitor: strictly allowed public channels only
  return PUBLIC_CHANNELS.has(channelName);
}

export async function POST(request) {
  try {
    const pusher = getPusherServer();
    if (!pusher) {
      // Pusher not configured, return 400 silently
      return NextResponse.json({ error: 'Realtime engine not configured' }, { status: 400 });
    }

    // Parse form data or json body sent by Pusher client
    const contentType = request.headers.get('content-type') || '';
    let socketId = '';
    let channelName = '';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      socketId = formData.get('socket_id')?.toString() || '';
      channelName = formData.get('channel_name')?.toString() || '';
    } else {
      const body = await request.json().catch(() => ({}));
      socketId = body.socket_id || '';
      channelName = body.channel_name || '';
    }

    if (!socketId || !channelName) {
      return NextResponse.json({ error: 'Missing socket_id or channel_name' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const isNonPublicChannel = !PUBLIC_CHANNELS.has(channelName);

    // Require session for all non-public channels
    if (isNonPublicChannel && !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const url = new URL(request.url);
    const requestedRole = url.searchParams.get('role') || 'visitor';
    const isRealAdmin = Boolean(session?.user?.isAdmin && !session?.user?.isDemo);

    if (requestedRole === 'admin' && !isRealAdmin) {
      return NextResponse.json({ error: 'Unauthorized admin channel access' }, { status: 401 });
    }

    let role = 'visitor';
    if (isRealAdmin && requestedRole === 'admin') {
      role = 'admin';
    } else if (session?.user) {
      role = isRealAdmin ? 'admin' : 'user';
    }

    // Never accept channel_name free-form: validate against role whitelist
    if (!isChannelAllowedForRole(channelName, role, session)) {
      return NextResponse.json({ error: 'Forbidden channel access' }, { status: 403 });
    }

    // Ephemeral unique ID for presence channel (no DB write)
    const presenceUserId = 'usr_' + crypto.randomBytes(8).toString('hex');

    const lat = parseFloat(url.searchParams.get('lat') || '');
    const lng = parseFloat(url.searchParams.get('lng') || '');
    const city = url.searchParams.get('city') || 'Global Visitor';
    const country = url.searchParams.get('country') || 'Worldwide';

    const presenceData = {
      user_id: presenceUserId,
      user_info: {
        id: presenceUserId,
        role,
        lat: !isNaN(lat) ? Math.round(lat * 10) / 10 : 24.9,
        lng: !isNaN(lng) ? Math.round(lng * 10) / 10 : 67.0,
        city: city.slice(0, 50),
        country: country.slice(0, 50),
        joinedAt: Date.now(),
      },
    };

    const authResponse = channelName.startsWith('presence-')
      ? pusher.authorizeChannel(socketId, channelName, presenceData)
      : pusher.authorizeChannel(socketId, channelName);

    return NextResponse.json(authResponse);
  } catch {
    return NextResponse.json({ error: 'Authorization failed' }, { status: 500 });
  }
}
