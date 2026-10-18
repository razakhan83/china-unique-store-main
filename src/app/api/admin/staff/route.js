import { NextResponse } from 'next/server';
import { requireApiAdmin } from '@/lib/requireAdmin';
import mongooseConnect from '@/lib/mongooseConnect';
import Settings from '@/models/Settings';
import { normalizeEmail } from '@/lib/admin';
import { ROLE_PRESETS } from '@/lib/staffRoles';

const SETTINGS_KEY = 'site-settings';

export { ROLE_PRESETS };

export async function GET() {
  try {
    const { session, error: authError } = await requireApiAdmin();
    if (authError) return authError;

    await mongooseConnect();
    const settings = await Settings.findOne({ singletonKey: SETTINGS_KEY }).lean();

    return NextResponse.json({
      success: true,
      staffMembers: Array.isArray(settings?.staffMembers) ? settings.staffMembers : [],
      rolePresets: ROLE_PRESETS,
    });
  } catch (error) {
    console.error('GET /api/admin/staff error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { session, error: authError } = await requireApiAdmin();
    if (authError) return authError;

    const body = await req.json();
    const email = normalizeEmail(body?.email);
    const name = String(body?.name || '').trim();
    const role = String(body?.role || 'Store Manager').trim();
    const customPermissions = body?.permissions;

    if (!email) {
      return NextResponse.json({ success: false, error: 'A valid email address is required.' }, { status: 400 });
    }

    const defaultPerms = ROLE_PRESETS[role] || ROLE_PRESETS['Store Manager'];
    const permissions = {
      ...defaultPerms,
      ...(customPermissions && typeof customPermissions === 'object' ? customPermissions : {}),
    };

    await mongooseConnect();
    const settings = await Settings.findOne({ singletonKey: SETTINGS_KEY });
    if (!settings) {
      return NextResponse.json({ success: false, error: 'Settings not found' }, { status: 404 });
    }

    if (!Array.isArray(settings.staffMembers)) {
      settings.staffMembers = [];
    }

    const existingIdx = settings.staffMembers.findIndex((m) => normalizeEmail(m.email) === email);
    const newStaffMember = {
      name: name || email.split('@')[0],
      email,
      role,
      permissions,
      status: 'Active',
      createdAt: new Date(),
    };

    if (existingIdx >= 0) {
      settings.staffMembers[existingIdx] = { ...settings.staffMembers[existingIdx].toObject(), ...newStaffMember };
    } else {
      settings.staffMembers.push(newStaffMember);
    }

    // Also add to adminEmails so they can access admin routes
    if (!Array.isArray(settings.adminEmails)) {
      settings.adminEmails = [];
    }
    if (!settings.adminEmails.includes(email)) {
      settings.adminEmails.push(email);
    }

    await settings.save();

    return NextResponse.json({
      success: true,
      message: `Staff member ${name || email} saved successfully with role ${role}.`,
      staffMembers: settings.staffMembers,
    });
  } catch (error) {
    console.error('POST /api/admin/staff error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { session, error: authError } = await requireApiAdmin();
    if (authError) return authError;

    const body = await req.json();
    const id = body?.id;
    const email = body?.email ? normalizeEmail(body.email) : null;
    const role = body?.role;
    const permissions = body?.permissions;
    const status = body?.status;

    await mongooseConnect();
    const settings = await Settings.findOne({ singletonKey: SETTINGS_KEY });
    if (!settings || !Array.isArray(settings.staffMembers)) {
      return NextResponse.json({ success: false, error: 'No staff members configured.' }, { status: 404 });
    }

    const member = settings.staffMembers.find((m) => String(m._id) === String(id) || (email && normalizeEmail(m.email) === email));
    if (!member) {
      return NextResponse.json({ success: false, error: 'Staff member not found.' }, { status: 404 });
    }

    if (role) {
      member.role = role;
      if (ROLE_PRESETS[role]) {
        member.permissions = { ...ROLE_PRESETS[role], ...(permissions || {}) };
      }
    }
    if (permissions && typeof permissions === 'object') {
      member.permissions = { ...member.permissions, ...permissions };
    }
    if (status) {
      member.status = status;
    }

    await settings.save();

    return NextResponse.json({
      success: true,
      message: 'Staff permissions updated successfully.',
      staffMembers: settings.staffMembers,
    });
  } catch (error) {
    console.error('PATCH /api/admin/staff error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { session, error: authError } = await requireApiAdmin();
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const email = searchParams.get('email') ? normalizeEmail(searchParams.get('email')) : null;

    if (!id && !email) {
      return NextResponse.json({ success: false, error: 'Staff ID or email is required' }, { status: 400 });
    }

    await mongooseConnect();
    const settings = await Settings.findOne({ singletonKey: SETTINGS_KEY });
    if (!settings || !Array.isArray(settings.staffMembers)) {
      return NextResponse.json({ success: true, staffMembers: [] });
    }

    settings.staffMembers = settings.staffMembers.filter(
      (m) => String(m._id) !== String(id) && (!email || normalizeEmail(m.email) !== email)
    );

    await settings.save();

    return NextResponse.json({
      success: true,
      message: 'Staff member removed successfully.',
      staffMembers: settings.staffMembers,
    });
  } catch (error) {
    console.error('DELETE /api/admin/staff error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
