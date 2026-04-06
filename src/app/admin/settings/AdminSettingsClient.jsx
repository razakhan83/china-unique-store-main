// @ts-nocheck
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BellRing, ExternalLink, ImagePlus, LayoutGrid, Loader2, Pencil, Plus, RadioTower, Save, ShieldCheck, Store, Trash2, Upload, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { uploadImageDataUrl } from '@/lib/cloudinaryUpload';

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
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function ToggleField({ checked, onCheckedChange, title, description }) {
  return (
    <Field orientation="horizontal" className="items-start justify-between rounded-lg border border-border bg-muted/35 px-4 py-3">
      <FieldContent>
        <FieldLabel>{title}</FieldLabel>
        <FieldDescription>{description}</FieldDescription>
      </FieldContent>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </Field>
  );
}

function LogoUploadCard({
  field,
  label,
  hint,
  surfaceClassName,
  imageClassName,
  value,
  onChange,
  uploading,
  onUpload,
}) {
  return (
    <Field className="rounded-2xl border border-border bg-background/75 p-4">
      <FieldContent className="gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <FieldLabel>{label}</FieldLabel>
            <FieldDescription>{hint}</FieldDescription>
          </div>
          <div className="flex items-center gap-2">
            {value ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => onChange(field, '')}
                disabled={uploading}
              >
                <X data-icon="inline-start" />
                Remove
              </Button>
            ) : null}
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted">
              {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
              {uploading ? 'Uploading' : 'Upload'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(event) => onUpload(field, event)}
              />
            </label>
          </div>
        </div>

        <div className={`relative flex min-h-36 items-center justify-center overflow-hidden rounded-2xl border border-border ${surfaceClassName}`}>
          {value ? (
            <Image
              src={value}
              alt={`${label} preview`}
              width={280}
              height={88}
              sizes="(max-width: 768px) 100vw, 320px"
              className={imageClassName}
            />
          ) : (
            <div className="flex max-w-56 flex-col items-center gap-2 px-5 py-8 text-center text-sm text-muted-foreground">
              <ImagePlus className="size-5" />
              <span>Upload a transparent PNG, SVG, or WebP logo.</span>
            </div>
          )}
        </div>

        <Input
          value={value || ''}
          onChange={(event) => onChange(field, event.target.value)}
          placeholder="https://res.cloudinary.com/..."
        />
      </FieldContent>
    </Field>
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
  const [uploadingField, setUploadingField] = useState('');
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

  async function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target?.result || '');
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.readAsDataURL(file);
    });
  }

  async function handleLogoUpload(field, event) {
    const file = Array.from(event.target.files || []).find((entry) => entry.type.startsWith('image/'));
    event.target.value = '';
    if (!file) return;

    setUploadingField(field);
    setSaved(false);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (!dataUrl) return;

      const image = await uploadImageDataUrl(dataUrl, 'kifayatly_branding');
      handleChange(field, image.url);
      toast.success(`${field === 'lightLogoUrl' ? 'Light' : 'Dark'} logo uploaded.`);
    } catch (error) {
      console.error(`Failed to upload ${field}`, error);
      toast.error(error.message || 'Failed to upload logo.');
    } finally {
      setUploadingField('');
    }
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
          <FieldGroup>
            <Field>
              <FieldLabel>Store Name</FieldLabel>
              <Input
                value={form.storeName}
                onChange={(event) => handleChange('storeName', event.target.value)}
                placeholder="China Unique Store"
              />
            </Field>
            <Field>
              <FieldLabel>Support Email</FieldLabel>
              <Input
                type="email"
                value={form.supportEmail}
                onChange={(event) => handleChange('supportEmail', event.target.value)}
                placeholder="support@chinauniquestore.com"
              />
            </Field>
            <Field>
              <FieldLabel>Business Address</FieldLabel>
              <Textarea
                value={form.businessAddress}
                onChange={(event) => handleChange('businessAddress', event.target.value)}
                placeholder="Shop #12, Block A, Gulshan..."
                rows={3}
              />
            </Field>
          </FieldGroup>
        </SettingSection>

        <SettingSection
          icon={ImagePlus}
          title="Logo Configuration"
          description="Upload both storefront logo variants. Saved Cloudinary URLs are optimized and reused across light and dark surfaces."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <LogoUploadCard
              field="lightLogoUrl"
              label="Light Mode Logo"
              hint="Used on dark backgrounds like the footer and dark brand surfaces."
              surfaceClassName="bg-[#082118]"
              imageClassName="h-auto max-h-16 w-auto object-contain"
              value={form.lightLogoUrl}
              onChange={handleChange}
              uploading={uploadingField === 'lightLogoUrl'}
              onUpload={handleLogoUpload}
            />
            <LogoUploadCard
              field="darkLogoUrl"
              label="Dark Mode Logo"
              hint="Used on light backgrounds like the navbar and admin previews."
              surfaceClassName="bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(242,246,244,0.98))]"
              imageClassName="h-auto max-h-16 w-auto object-contain"
              value={form.darkLogoUrl}
              onChange={handleChange}
              uploading={uploadingField === 'darkLogoUrl'}
              onUpload={handleLogoUpload}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            The storefront automatically switches between these two logos based on the background.
          </p>
        </SettingSection>

        <SettingSection
          icon={RadioTower}
          title="Social & Tracking"
          description="Manage customer contact links, social destinations, and tracking credentials in one place."
        >
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field className="md:col-span-2">
              <FieldLabel>WhatsApp Number</FieldLabel>
              <FieldContent>
              <Input
                value={form.whatsappNumber}
                onChange={(event) => handleChange('whatsappNumber', event.target.value)}
                placeholder="923001234567"
              />
              <FieldDescription className="mt-1.5">
                Used by the floating contact button, footer CTA, and checkout handoff. Format: country code + number without spaces.
              </FieldDescription>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Facebook Page URL</FieldLabel>
              <Input
                value={form.facebookPageUrl}
                onChange={(event) => handleChange('facebookPageUrl', event.target.value)}
                placeholder="https://facebook.com/your-page"
              />
            </Field>

            <Field>
              <FieldLabel>Instagram URL</FieldLabel>
              <Input
                value={form.instagramUrl}
                onChange={(event) => handleChange('instagramUrl', event.target.value)}
                placeholder="https://instagram.com/your-handle"
              />
            </Field>
          </FieldGroup>

          <ToggleField
            checked={!!form.trackingEnabled}
            onCheckedChange={(value) => handleChange('trackingEnabled', value)}
            title="Enable tracking"
            description="Loads browser pixels and sends purchase events when credentials are configured."
          />

          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel>Facebook Pixel ID</FieldLabel>
              <Input
                value={form.facebookPixelId}
                onChange={(event) => handleChange('facebookPixelId', event.target.value)}
                placeholder="123456789012345"
              />
            </Field>

            <Field>
              <FieldLabel>TikTok Pixel ID</FieldLabel>
              <Input
                value={form.tiktokPixelId}
                onChange={(event) => handleChange('tiktokPixelId', event.target.value)}
                placeholder="C123ABC456DEF"
              />
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel>Facebook Conversions API Token</FieldLabel>
              <Input
                value={form.facebookConversionsApiToken}
                onChange={(event) => handleChange('facebookConversionsApiToken', event.target.value)}
                placeholder="EAAG..."
              />
            </Field>

            <Field>
              <FieldLabel>Facebook Test Event Code</FieldLabel>
              <Input
                value={form.facebookTestEventCode}
                onChange={(event) => handleChange('facebookTestEventCode', event.target.value)}
                placeholder="TEST12345"
              />
            </Field>

            <Field>
              <FieldLabel>TikTok Access Token</FieldLabel>
              <Input
                value={form.tiktokAccessToken}
                onChange={(event) => handleChange('tiktokAccessToken', event.target.value)}
                placeholder="ttk_..."
              />
            </Field>
          </FieldGroup>
        </SettingSection>

        <SettingSection icon={BellRing} title="Announcement Bar">
          <ToggleField
            checked={!!form.announcementBarEnabled}
            onCheckedChange={(value) => handleChange('announcementBarEnabled', value)}
            title="Show top banner"
            description="Display a promotional banner across the storefront."
          />

          <div className="space-y-3">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <FieldLabel>Add Announcement Message</FieldLabel>
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
              <FieldLabel>Message List</FieldLabel>
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

        <SettingSection
          icon={LayoutGrid}
          title="Home Page Settings"
          description="Manage the storefront section order, hero slides, banners, and category product blocks from the dedicated home page builder."
        >
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Open Home Page Builder</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add, reorder, and save homepage sections without touching storefront code.
              </p>
            </div>
            <Link href="/admin/home-page" className="shrink-0">
              <Button type="button" variant="outline" className="w-full rounded-xl md:w-auto">
                <ExternalLink data-icon="inline-start" />
                Home Page Builder
              </Button>
            </Link>
          </div>
        </SettingSection>

        <div className="flex items-center gap-4 pb-4">
          <Button onClick={handleSave} disabled={saving || Boolean(uploadingField)}>
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
