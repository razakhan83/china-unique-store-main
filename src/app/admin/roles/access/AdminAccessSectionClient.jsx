'use client';

import { useEffect, useState } from 'react';
import {
  Loader2,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  KeyRound,
  Check,
  Edit2,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SettingSection } from '@/app/admin/settings/settingsShared';
import { ROLE_PRESETS } from '@/lib/staffRoles';

const PERMISSION_LABELS = [
  { id: 'viewProducts', label: 'View Products & Inventory' },
  { id: 'editProducts', label: 'Create & Edit Products' },
  { id: 'viewOrders', label: 'View Orders & Slips' },
  { id: 'editOrders', label: 'Process Status & Refunds' },
  { id: 'viewCustomers', label: 'View Customer Profiles' },
  { id: 'viewReports', label: 'View Sales Reports & Analytics' },
  { id: 'manageSettings', label: 'Manage Store Settings' },
];

export default function AdminAccessSectionClient({
  isConfiguredAdmin,
  initialConfiguredAdmins = null,
  initialDynamicAdmins = null,
}) {
  const [configuredAdmins, setConfiguredAdmins] = useState(() => initialConfiguredAdmins || []);
  const [dynamicAdmins, setDynamicAdmins] = useState(() => initialDynamicAdmins || []);
  const [loadingList, setLoadingList] = useState(() => !initialConfiguredAdmins && isConfiguredAdmin);
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingEmail, setRemovingEmail] = useState(null);

  // Staff members state
  const [staffMembers, setStaffMembers] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [isSavingStaff, setIsSavingStaff] = useState(false);

  const [staffFormData, setStaffFormData] = useState({
    name: '',
    email: '',
    role: 'Store Manager',
    permissions: {
      viewProducts: true,
      editProducts: true,
      viewOrders: true,
      editOrders: true,
      viewCustomers: true,
      viewReports: true,
      manageSettings: false,
    },
  });

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/admin/staff');
      const data = await res.json();
      if (data.success && Array.isArray(data.staffMembers)) {
        setStaffMembers(data.staffMembers);
      }
    } catch {
      toast.error('Failed to load staff members');
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    if (isConfiguredAdmin) {
      fetchStaff();
    }
  }, [isConfiguredAdmin]);

  useEffect(() => {
    async function fetchAdmins() {
      try {
        const res = await fetch('/api/settings/admins');
        const data = await res.json();
        if (data.success) {
          setConfiguredAdmins(data.data.configuredAdmins || []);
          setDynamicAdmins(data.data.dynamicAdmins || []);
        }
      } catch {
        toast.error('Failed to load admin list.');
      } finally {
        setLoadingList(false);
      }
    }

    if (isConfiguredAdmin && !initialConfiguredAdmins) {
      fetchAdmins();
    } else {
      setLoadingList(false);
    }
  }, [isConfiguredAdmin, initialConfiguredAdmins]);

  const handleRoleSelect = (selectedRole) => {
    const presets = {
      'Administrator': {
        viewProducts: true,
        editProducts: true,
        viewOrders: true,
        editOrders: true,
        viewCustomers: true,
        viewReports: true,
        manageSettings: true,
      },
      'Store Manager': {
        viewProducts: true,
        editProducts: true,
        viewOrders: true,
        editOrders: true,
        viewCustomers: true,
        viewReports: true,
        manageSettings: false,
      },
      'Catalog Manager': {
        viewProducts: true,
        editProducts: true,
        viewOrders: false,
        editOrders: false,
        viewCustomers: false,
        viewReports: false,
        manageSettings: false,
      },
      'Order Fulfillment': {
        viewProducts: true,
        editProducts: false,
        viewOrders: true,
        editOrders: true,
        viewCustomers: true,
        viewReports: false,
        manageSettings: false,
      },
      'Customer Support': {
        viewProducts: true,
        editProducts: false,
        viewOrders: true,
        editOrders: false,
        viewCustomers: true,
        viewReports: false,
        manageSettings: false,
      },
    };

    setStaffFormData((prev) => ({
      ...prev,
      role: selectedRole,
      permissions: presets[selectedRole] || prev.permissions,
    }));
  };

  const handlePermissionToggle = (permKey) => {
    setStaffFormData((prev) => ({
      ...prev,
      role: 'Custom',
      permissions: {
        ...prev.permissions,
        [permKey]: !prev.permissions[permKey],
      },
    }));
  };

  const handleOpenAddStaff = () => {
    setEditingStaffId(null);
    setStaffFormData({
      name: '',
      email: '',
      role: 'Store Manager',
      permissions: {
        viewProducts: true,
        editProducts: true,
        viewOrders: true,
        editOrders: true,
        viewCustomers: true,
        viewReports: true,
        manageSettings: false,
      },
    });
    setStaffModalOpen(true);
  };

  const handleOpenEditStaff = (member) => {
    setEditingStaffId(member._id);
    setStaffFormData({
      name: member.name || '',
      email: member.email || '',
      role: member.role || 'Custom',
      permissions: member.permissions || {},
    });
    setStaffModalOpen(true);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (!staffFormData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    setIsSavingStaff(true);
    try {
      const url = '/api/admin/staff';
      const method = editingStaffId ? 'PATCH' : 'POST';
      const payload = editingStaffId
        ? { id: editingStaffId, ...staffFormData }
        : staffFormData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save staff member');
      }

      toast.success(data.message || 'Staff member saved successfully!');
      setStaffMembers(data.staffMembers || []);
      setStaffModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Error saving staff');
    } finally {
      setIsSavingStaff(false);
    }
  };

  const handleDeleteStaff = async (memberId, memberEmail) => {
    if (!confirm(`Are you sure you want to remove ${memberEmail}?`)) return;

    try {
      const res = await fetch(`/api/admin/staff?id=${memberId}&email=${encodeURIComponent(memberEmail)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Staff member removed.');
        setStaffMembers(data.staffMembers || []);
      } else {
        toast.error(data.error || 'Failed to remove staff.');
      }
    } catch {
      toast.error('Error removing staff member.');
    }
  };

  async function handleAddAdmin(event) {
    event.preventDefault();
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) return;

    setAdding(true);
    try {
      const res = await fetch('/api/settings/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to add admin');
      setDynamicAdmins(data.data);
      setNewEmail('');
      toast.success(`${trimmed} added as admin.`);
    } catch (error) {
      toast.error(error.message || 'Failed to add admin.');
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveAdmin(email) {
    setRemovingEmail(email);
    try {
      const res = await fetch('/api/settings/admins', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to remove admin');
      setDynamicAdmins(data.data);
      toast.success(`${email} removed from admin access.`);
    } catch (error) {
      toast.error(error.message || 'Failed to remove admin.');
    } finally {
      setRemovingEmail(null);
    }
  }

  if (!isConfiguredAdmin) {
    return (
      <div className="w-full max-w-4xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Access Management</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You do not have permission to view or edit access settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-8 pb-20">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Staff Roles & Permissions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage store team members with granular permissions (products, orders, customers, reports).
          </p>
        </div>
        <Button
          onClick={handleOpenAddStaff}
          className="bg-primary text-primary-foreground font-semibold text-xs gap-1.5 h-9 rounded-lg shadow-xs cursor-pointer"
        >
          <UserPlus className="size-4" />
          <span>Add Staff Member</span>
        </Button>
      </div>

      {/* Staff Members List Card */}
      <Card className="rounded-2xl border-border bg-card shadow-sm">
        <CardHeader className="pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-primary" />
              <CardTitle className="text-base font-bold">Store Team Members ({staffMembers.length})</CardTitle>
            </div>
          </div>
          <CardDescription className="text-xs">
            Staff members can log in using their email and access only permitted admin panel sections.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {loadingStaff ? (
            <div className="py-8 text-center text-xs text-muted-foreground">Loading team members...</div>
          ) : staffMembers.length === 0 ? (
            <div className="py-8 text-center rounded-xl border border-dashed border-border p-6 space-y-2">
              <p className="text-sm font-semibold text-foreground">No custom staff members configured</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Only root administrators currently have access. Click &ldquo;Add Staff Member&rdquo; above to delegate roles like Catalog Manager or Support.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {staffMembers.map((member) => {
                const activePermsCount = Object.values(member.permissions || {}).filter(Boolean).length;
                return (
                  <div key={member._id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground text-sm">{member.name || 'Staff Member'}</span>
                        <Badge variant="outline" className="text-[11px] font-semibold bg-muted text-foreground">
                          {member.role || 'Staff'}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {activePermsCount} of 7 permissions
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditStaff(member)}
                        className="h-8 text-xs font-semibold rounded-lg gap-1.5"
                      >
                        <Edit2 className="size-3.5" />
                        <span>Edit</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStaff(member._id, member.email)}
                        className="h-8 text-xs text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 rounded-lg px-2"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Root Admin Whitelist Section */}
      <SettingSection
        icon={ShieldCheck}
        title="Root Administrators Whitelist"
        description="Environment variable admins and verified super-admins with unrestricted root access."
      >
        <form onSubmit={handleAddAdmin} className="flex gap-2">
          <Input
            type="email"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            placeholder="admin@example.com"
            className="flex-1 rounded-md border-slate-300"
            required
          />
          <Button
            type="submit"
            disabled={adding || !newEmail.trim()}
            size="sm"
            className="admin-cta-button shrink-0"
          >
            {adding ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <UserPlus data-icon="inline-start" />}
            Add Super-Admin
          </Button>
        </form>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Configured Root Admins</p>
            <ul className="space-y-2">
              {configuredAdmins.map((email) => (
                <li
                  key={email}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/35 px-4 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <ShieldCheck className="size-4 shrink-0 text-foreground" />
                    <span className="truncate text-sm font-medium text-foreground">{email}</span>
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                    Root Protected
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SettingSection>

      {/* Add / Edit Staff Member Modal */}
      <Dialog open={staffModalOpen} onOpenChange={setStaffModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <KeyRound className="size-5 text-primary" />
              <span>{editingStaffId ? 'Edit Staff Member Permissions' : 'Add New Staff Member'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define team member access level and choose exact permitted operations.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveStaff} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Staff Name</label>
                <Input
                  value={staffFormData.name}
                  onChange={(e) => setStaffFormData({ ...staffFormData, name: e.target.value })}
                  placeholder="e.g. Asad Khan"
                  className="h-9 text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Login Email</label>
                <Input
                  type="email"
                  value={staffFormData.email}
                  onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
                  placeholder="asad@example.com"
                  className="h-9 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Staff Role Preset</label>
              <Select value={staffFormData.role} onValueChange={handleRoleSelect}>
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrator">Administrator (All Access)</SelectItem>
                  <SelectItem value="Store Manager">Store Manager (Products, Orders, Customers)</SelectItem>
                  <SelectItem value="Catalog Manager">Catalog Manager (Products Only)</SelectItem>
                  <SelectItem value="Order Fulfillment">Order Fulfillment (Orders & Shipping)</SelectItem>
                  <SelectItem value="Customer Support">Customer Support (View Orders & Customers)</SelectItem>
                  <SelectItem value="Custom">Custom Permissions Matrix</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <span className="text-xs font-bold text-foreground block">Granular Permissions Matrix</span>
              <div className="grid grid-cols-1 gap-2.5 bg-muted/20 p-3.5 rounded-xl border border-border">
                {PERMISSION_LABELS.map((p) => (
                  <label key={p.id} className="flex items-center gap-2.5 cursor-pointer text-xs">
                    <Checkbox
                      checked={staffFormData.permissions[p.id] === true}
                      onCheckedChange={() => handlePermissionToggle(p.id)}
                    />
                    <span className="text-foreground font-medium">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStaffModalOpen(false)}
                className="h-8 text-xs font-semibold rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSavingStaff}
                className="h-8 text-xs font-semibold rounded-lg bg-primary text-primary-foreground cursor-pointer"
              >
                {isSavingStaff ? 'Saving...' : 'Save Member'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
