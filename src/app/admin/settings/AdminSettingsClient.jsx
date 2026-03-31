// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { BellRing, Loader2, Pencil, Plus, RadioTower, Save, ShieldCheck, Store, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

function normalizeAnnouncementMessages(messages = [], fallbackText = '') {
  const rawMessages = Array.isArray(messages) && messages.length > 0
    ? messages
    : String(fallbackText || '')
        .split(/\r?\n|[|•]+/)
        .map((text, index) => ({ id: `announcement-${index + 1}`, text, isActive: true }));

  return rawMessages
    .map((entry, index) => ({
      id: String(entry?.id || `announcement-${index + 1}`).trim(),
      text: String(entry?.text || '').trim(),
      isActive: entry?.isActive !== false,
    }))
    .filter((entry) => entry.text);
}

function SettingSection({ icon: Icon, title, description, children }) {
  return (
    <section className="surface-card rounded-xl p-5 md:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function AdminAccessSection() {
  const [configuredAdmins, setConfiguredAdmins] = useState([]);
  const [dynamicAdmins, setDynamicAdmins] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingEmail, setRemovingEmail] = useState(null);

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
    fetchAdmins();
  }, []);

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

  return (
    <SettingSection
      icon={ShieldCheck}
      title="Access Management"
      description="Configured admin accounts from environment variables always keep access. Additional admins can be managed here."
    >
      <form onSubmit={handleAddAdmin} className="flex gap-2">
        <Input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="admin@example.com"
          className="rounded-md border-slate-300 flex-1"
          required
        />
        <Button
          type="submit"
          disabled={adding || !newEmail.trim()}
          className="rounded-md shrink-0"
        >
          {adding ? <Loader2 className="mr-2 size-4 animate-spin" /> : <UserPlus className="mr-2 size-4" />}
          Add Admin
        </Button>
      </form>

      {loadingList ? (
        <div className="space-y-2 pt-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-11 animate-pulse rounded-lg bg-muted/50" />
          ))}
        </div>
      ) : (
        <div className="space-y-5 pt-1">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Configured admins</p>
            {configuredAdmins.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                No configured admin emails found in environment variables.
              </p>
            ) : (
              <ul className="space-y-2">
                {configuredAdmins.map((email) => (
                  <li
                    key={email}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/35 px-4 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <ShieldCheck className="size-4 shrink-0 text-primary" />
                      <span className="truncate text-sm font-medium text-foreground">{email}</span>
                    </div>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      Protected
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Additional admins</p>
            {dynamicAdmins.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                No additional admins yet. Add one above.
              </p>
            ) : (
              <ul className="space-y-2">
                {dynamicAdmins.map((email) => (
                  <li
                    key={email}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/35 px-4 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <ShieldCheck className="size-4 shrink-0 text-primary" />
                      <span className="truncate text-sm font-medium text-foreground">{email}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-md text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                      onClick={() => handleRemoveAdmin(email)}
                      disabled={removingEmail === email}
                      title={`Remove ${email}`}
                    >
                      {removingEmail === email ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </SettingSection>
  );
}

export default function AdminSettingsClient({ initialSettings, isConfiguredAdmin }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    ...initialSettings,
    announcementBarMessages: normalizeAnnouncementMessages(
      initialSettings?.announcementBarMessages,
      initialSettings?.announcementBarText
    ),
  });
  const [newAnnouncementMessage, setNewAnnouncementMessage] = useState('');
  const [editingAnnouncementId, setEditingAnnouncementId] = useState(null);
  const [editingAnnouncementText, setEditingAnnouncementText] = useState('');

  function handleChange(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
    setSaved(false);
  }

  function handleAddAnnouncementMessage() {
    const trimmed = newAnnouncementMessage.trim();
    if (!trimmed) return;

    handleChange('announcementBarMessages', [
      ...form.announcementBarMessages,
      {
        id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `announcement-${Date.now()}`,
        text: trimmed,
        isActive: true,
      },
    ]);
    setNewAnnouncementMessage('');
  }

  function handleEditAnnouncementStart(message) {
    setEditingAnnouncementId(message.id);
    setEditingAnnouncementText(message.text);
  }

  function handleEditAnnouncementSave() {
    const trimmed = editingAnnouncementText.trim();
    if (!trimmed || !editingAnnouncementId) return;

    handleChange(
      'announcementBarMessages',
      form.announcementBarMessages.map((message) =>
        message.id === editingAnnouncementId ? { ...message, text: trimmed } : message
      )
    );
    setEditingAnnouncementId(null);
    setEditingAnnouncementText('');
  }

  function handleEditAnnouncementCancel() {
    setEditingAnnouncementId(null);
    setEditingAnnouncementText('');
  }

  function handleDeleteAnnouncementMessage(id) {
    handleChange(
      'announcementBarMessages',
      form.announcementBarMessages.filter((message) => message.id !== id)
    );
    if (editingAnnouncementId === id) {
      handleEditAnnouncementCancel();
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to save settings');
      }

      setForm(data.data);
      setSaved(true);
      toast.success('Settings updated successfully.');
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings', error);
      toast.error(error.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Store Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure store details, delivery rules, and customer communication.
        </p>
      </div>

      <div className="space-y-6">
        <SettingSection icon={Store} title="General Information">
          <div>
            <Label className="mb-1.5">Store Name</Label>
            <Input
              value={form.storeName}
              onChange={(event) => handleChange('storeName', event.target.value)}
              placeholder="China Unique Store"
            />
          </div>
          <div>
            <Label className="mb-1.5">Support Email</Label>
            <Input
              type="email"
              value={form.supportEmail}
              onChange={(event) => handleChange('supportEmail', event.target.value)}
              placeholder="support@chinauniquestore.com"
            />
          </div>
          <div>
            <Label className="mb-1.5">Business Address</Label>
            <Textarea
              value={form.businessAddress}
              onChange={(event) => handleChange('businessAddress', event.target.value)}
              placeholder="Shop #12, Block A, Gulshan..."
              rows={3}
            />
          </div>
        </SettingSection>

        <SettingSection
          icon={RadioTower}
          title="Social & Tracking"
          description="Manage customer contact links, social destinations, and tracking credentials in one place."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label className="mb-1.5">WhatsApp Number</Label>
              <Input
                value={form.whatsappNumber}
                onChange={(event) => handleChange('whatsappNumber', event.target.value)}
                placeholder="923001234567"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Used by the floating contact button, footer CTA, and checkout handoff. Format: country code + number without spaces.
              </p>
            </div>

            <div>
              <Label className="mb-1.5">Facebook Page URL</Label>
              <Input
                value={form.facebookPageUrl}
                onChange={(event) => handleChange('facebookPageUrl', event.target.value)}
                placeholder="https://facebook.com/your-page"
              />
            </div>

            <div>
              <Label className="mb-1.5">Instagram URL</Label>
              <Input
                value={form.instagramUrl}
                onChange={(event) => handleChange('instagramUrl', event.target.value)}
                placeholder="https://instagram.com/your-handle"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/35 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Enable tracking</p>
              <p className="text-xs text-muted-foreground">
                Loads browser pixels and sends purchase events when credentials are configured.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('trackingEnabled', !form.trackingEnabled)}
              className={`inline-flex min-w-24 items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                form.trackingEnabled
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground'
              }`}
            >
              {form.trackingEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="mb-1.5">Facebook Pixel ID</Label>
              <Input
                value={form.facebookPixelId}
                onChange={(event) => handleChange('facebookPixelId', event.target.value)}
                placeholder="123456789012345"
              />
            </div>

            <div>
              <Label className="mb-1.5">TikTok Pixel ID</Label>
              <Input
                value={form.tiktokPixelId}
                onChange={(event) => handleChange('tiktokPixelId', event.target.value)}
                placeholder="C123ABC456DEF"
              />
            </div>

            <div className="md:col-span-2">
              <Label className="mb-1.5">Facebook Conversions API Token</Label>
              <Input
                value={form.facebookConversionsApiToken}
                onChange={(event) => handleChange('facebookConversionsApiToken', event.target.value)}
                placeholder="EAAG..."
              />
            </div>

            <div>
              <Label className="mb-1.5">Facebook Test Event Code</Label>
              <Input
                value={form.facebookTestEventCode}
                onChange={(event) => handleChange('facebookTestEventCode', event.target.value)}
                placeholder="TEST12345"
              />
            </div>

            <div>
              <Label className="mb-1.5">TikTok Access Token</Label>
              <Input
                value={form.tiktokAccessToken}
                onChange={(event) => handleChange('tiktokAccessToken', event.target.value)}
                placeholder="ttk_..."
              />
            </div>
          </div>
        </SettingSection>

        <SettingSection icon={BellRing} title="Announcement Bar">
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/35 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Show top banner</p>
              <p className="text-xs text-muted-foreground">
                Display a promotional banner across the storefront.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('announcementBarEnabled', !form.announcementBarEnabled)}
              className={`inline-flex min-w-24 items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                form.announcementBarEnabled
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground'
              }`}
            >
              {form.announcementBarEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="mb-1.5">Add Announcement Message</Label>
                <Input
                  value={newAnnouncementMessage}
                  onChange={(event) => setNewAnnouncementMessage(event.target.value)}
                  placeholder="Free delivery on orders above Rs. 3000!"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddAnnouncementMessage}
                disabled={!newAnnouncementMessage.trim()}
                className="shrink-0"
              >
                <Plus data-icon="inline-start" />
                Add
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="mb-1.5">Message List</Label>
              {form.announcementBarMessages.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                  No announcement messages yet. Add one above.
                </div>
              ) : (
                form.announcementBarMessages.map((message, index) => {
                  const isEditing = editingAnnouncementId === message.id;

                  return (
                    <div
                      key={message.id}
                      className="rounded-lg border border-border bg-muted/20 px-4 py-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Message {index + 1}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => (isEditing ? handleEditAnnouncementSave() : handleEditAnnouncementStart(message))}
                          >
                            <Pencil data-icon="inline-start" />
                            {isEditing ? 'Save' : 'Edit'}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDeleteAnnouncementMessage(message.id)}
                          >
                            <Trash2 data-icon="inline-start" />
                            Delete
                          </Button>
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={editingAnnouncementText}
                            onChange={(event) => setEditingAnnouncementText(event.target.value)}
                            placeholder="Edit announcement message"
                          />
                          <div className="flex items-center gap-2">
                            <Button type="button" size="sm" onClick={handleEditAnnouncementSave} disabled={!editingAnnouncementText.trim()}>
                              Save Changes
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={handleEditAnnouncementCancel}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-foreground">{message.text}</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Active messages are joined into one slow-moving marquee with large spacing between each item.
            </p>
          </div>
        </SettingSection>

        <div className="flex items-center gap-4 pb-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <Save data-icon="inline-start" />
            )}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </Button>
          {saved ? (
            <span className="text-sm font-medium text-primary">Settings updated successfully.</span>
          ) : null}
        </div>

        {/* Admin Access Management */}
        {isConfiguredAdmin && <AdminAccessSection />}
      </div>
    </div>
  );
}

