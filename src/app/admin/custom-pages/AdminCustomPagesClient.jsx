'use client';

import Link from 'next/link';
import { ArrowDown, ArrowUp, ExternalLink, FileText, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { SettingSection } from '@/app/admin/settings/settingsShared';
import { DEFAULT_CUSTOM_PAGES, normalizeCustomPageSlug } from '@/lib/customPages';
import { cn } from '@/lib/utils';

const NON_CUSTOM_PAGE_SLUGS = new Set(['auth', 'deals', 'orders', 'products', 'settings', 'signin', 'wishlist']);

function makeNewPage(pages = []) {
  const nextNumber = pages.length + 1;
  const slug = `custom-page-${nextNumber}`;

  return {
    slug,
    title: `Custom Page ${nextNumber}`,
    label: `Custom Page ${nextNumber}`,
    description: '',
    content: '',
    seoTitle: '',
    seoDescription: '',
    isEnabled: true,
    showInFooter: true,
    sortOrder: pages.length,
  };
}

function getPageMeta(page) {
  const isDefaultPage = DEFAULT_CUSTOM_PAGES.some((defaultPage) => defaultPage.slug === page.slug);
  return {
    isDefaultPage,
    href: `/${page.slug}`,
    isEnabled: page.isEnabled !== false,
    showInFooter: page.showInFooter !== false,
  };
}

export default function AdminCustomPagesClient({ initialPages }) {
  const [pages, setPages] = useState(Array.isArray(initialPages) ? initialPages : []);
  const [selectedSlug, setSelectedSlug] = useState(initialPages?.[0]?.slug || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!pages.some((page) => page.slug === selectedSlug)) {
      setSelectedSlug(pages[0]?.slug || '');
    }
  }, [pages, selectedSlug]);

  const selectedIndex = Math.max(0, pages.findIndex((page) => page.slug === selectedSlug));
  const selectedPage = pages[selectedIndex] || null;
  const livePageCount = useMemo(() => pages.filter((page) => page.isEnabled !== false).length, [pages]);
  const footerPageCount = useMemo(() => pages.filter((page) => page.showInFooter !== false).length, [pages]);

  function updatePage(index, field, value) {
    setPages((current) =>
      current.map((page, pageIndex) =>
        pageIndex === index
          ? {
              ...page,
              [field]: value,
            }
          : page
      )
    );
    setSaved(false);
  }

  function movePage(index, direction) {
    setPages((current) => {
      const next = [...current];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= next.length) return current;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next.map((page, pageIndex) => ({ ...page, sortOrder: pageIndex }));
    });
    setSaved(false);
  }

  function removePage(index) {
    const slug = pages[index]?.slug;
    if (DEFAULT_CUSTOM_PAGES.some((page) => page.slug === slug)) {
      toast.error('Default pages cannot be removed. Disable them instead.');
      return;
    }

    setPages((current) =>
      current
        .filter((_, pageIndex) => pageIndex !== index)
        .map((page, pageIndex) => ({ ...page, sortOrder: pageIndex }))
    );
    setSaved(false);
  }

  function addPage() {
    const nextPage = makeNewPage(pages);
    setPages((current) => [...current, nextPage]);
    setSelectedSlug(nextPage.slug);
    setSaved(false);
  }

  async function handleSave() {
    const normalizedPages = pages.map((page, index) => ({
      ...page,
      slug: normalizeCustomPageSlug(page.slug || page.title || `custom-page-${index + 1}`),
      title: String(page.title || '').trim(),
      label: String(page.label || page.title || '').trim(),
      description: String(page.description || '').trim(),
      content: String(page.content || '').trim(),
      seoTitle: String(page.seoTitle || '').trim(),
      seoDescription: String(page.seoDescription || '').trim(),
      sortOrder: index,
    }));

    if (normalizedPages.some((page) => !page.slug || !page.title)) {
      toast.error('Each custom page needs at least a slug and title.');
      return;
    }

    const slugSet = new Set();
    for (const page of normalizedPages) {
      if (slugSet.has(page.slug)) {
        toast.error(`Duplicate slug detected: ${page.slug}`);
        return;
      }
      if (NON_CUSTOM_PAGE_SLUGS.has(page.slug) && !DEFAULT_CUSTOM_PAGES.some((defaultPage) => defaultPage.slug === page.slug)) {
        toast.error(`The slug "${page.slug}" is reserved by the storefront.`);
        return;
      }
      slugSet.add(page.slug);
    }

    setSaving(true);
    setSaved(false);

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customPages: normalizedPages }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to save custom pages');
      }

      const nextPages = Array.isArray(data.data?.customPages) ? data.data.customPages : normalizedPages;
      setPages(nextPages);
      setSelectedSlug((current) => nextPages.some((page) => page.slug === current) ? current : nextPages[0]?.slug || '');
      setSaved(true);
      toast.success('Custom pages updated successfully.');
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      toast.error(error.message || 'Failed to save custom pages.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full pb-10 md:pb-0">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Custom Pages</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit policy and information pages in the same clean admin style without touching code.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {livePageCount} live
          </Badge>
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {footerPageCount} in footer
          </Badge>
          <Button type="button" size="sm" className="admin-cta-button w-full sm:w-auto" onClick={addPage}>
            <Plus data-icon="inline-start" />
            Add Custom Page
          </Button>
        </div>
      </div>

      {pages.length === 0 ? (
        <div className="surface-card rounded-2xl p-12 text-center">
          <p className="font-medium text-muted-foreground">No custom pages yet. Add your first page to begin.</p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="surface-card rounded-2xl p-4 md:p-5">
            <div className="mb-4">
              <p className="text-sm font-semibold text-foreground">Page List</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Select a page to edit its content and storefront visibility.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {pages.map((page, index) => {
                const meta = getPageMeta(page);
                const isSelected = selectedPage?.slug === page.slug;

                return (
                  <button
                    key={`${page.slug}-${index}`}
                    type="button"
                    onClick={() => setSelectedSlug(page.slug)}
                    className={cn(
                      'flex w-full flex-col gap-2 rounded-xl border px-3 py-3 text-left transition-colors',
                      isSelected
                        ? 'border-border bg-muted/60'
                        : 'border-border/60 bg-background hover:bg-muted/30'
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {page.title || `Page ${index + 1}`}
                      </p>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]',
                          meta.isEnabled ? 'bg-muted text-foreground' : 'bg-muted/60 text-muted-foreground'
                        )}
                      >
                        {meta.isEnabled ? 'Live' : 'Hidden'}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">/{page.slug}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {meta.isDefaultPage ? <Badge variant="secondary" className="rounded-full">Default</Badge> : null}
                      {meta.showInFooter ? <Badge variant="secondary" className="rounded-full">Footer</Badge> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="space-y-6">
            {selectedPage ? (
              <SettingSection
                icon={FileText}
                title={selectedPage.title || `Page ${selectedIndex + 1}`}
                description="Edit the selected page details, content, and SEO settings."
              >
                <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 px-4 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Page Path</p>
                    <p className="mt-1 truncate text-sm font-semibold text-foreground">/{selectedPage.slug}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="admin-cta-button"
                      onClick={() => movePage(selectedIndex, -1)}
                      disabled={selectedIndex === 0}
                    >
                      <ArrowUp data-icon="inline-start" />
                      Up
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="admin-cta-button"
                      onClick={() => movePage(selectedIndex, 1)}
                      disabled={selectedIndex === pages.length - 1}
                    >
                      <ArrowDown data-icon="inline-start" />
                      Down
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="admin-cta-button"
                      render={<Link href={`/${selectedPage.slug}`} target="_blank" />}
                      nativeButton={false}
                    >
                      <ExternalLink data-icon="inline-start" />
                      Preview
                    </Button>
                    {!getPageMeta(selectedPage).isDefaultPage ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="admin-cta-button text-destructive hover:text-destructive"
                        onClick={() => removePage(selectedIndex)}
                      >
                        <Trash2 data-icon="inline-start" />
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </div>

                <FieldGroup className="grid gap-4 lg:grid-cols-2">
                  <Field>
                    <FieldLabel>Page Slug</FieldLabel>
                    <FieldContent>
                      <Input
                        value={selectedPage.slug}
                        onChange={(event) => updatePage(selectedIndex, 'slug', normalizeCustomPageSlug(event.target.value))}
                        placeholder="about-us"
                      />
                      <FieldDescription>Used in the page URL, for example `/about-us`.</FieldDescription>
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>Page Title</FieldLabel>
                    <Input
                      value={selectedPage.title}
                      onChange={(event) => updatePage(selectedIndex, 'title', event.target.value)}
                      placeholder="About Us"
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Menu Label</FieldLabel>
                    <FieldContent>
                      <Input
                        value={selectedPage.label}
                        onChange={(event) => updatePage(selectedIndex, 'label', event.target.value)}
                        placeholder="About Us"
                      />
                      <FieldDescription>Shown in the storefront footer links.</FieldDescription>
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>Short Description</FieldLabel>
                    <Input
                      value={selectedPage.description}
                      onChange={(event) => updatePage(selectedIndex, 'description', event.target.value)}
                      placeholder="A short introduction for this page"
                    />
                  </Field>
                </FieldGroup>

                <FieldGroup>
                  <Field>
                    <FieldLabel>Page Content</FieldLabel>
                    <FieldContent>
                      <Textarea
                        rows={12}
                        value={selectedPage.content}
                        onChange={(event) => updatePage(selectedIndex, 'content', event.target.value)}
                        placeholder="Write your page content here. Separate paragraphs with a blank line."
                      />
                      <FieldDescription>Use blank lines to create separate content sections.</FieldDescription>
                    </FieldContent>
                  </Field>
                </FieldGroup>

                <FieldGroup className="grid gap-4 lg:grid-cols-2">
                  <Field>
                    <FieldLabel>SEO Title</FieldLabel>
                    <Input
                      value={selectedPage.seoTitle}
                      onChange={(event) => updatePage(selectedIndex, 'seoTitle', event.target.value)}
                      placeholder="About Us | China Unique Store"
                    />
                  </Field>

                  <Field>
                    <FieldLabel>SEO Description</FieldLabel>
                    <Textarea
                      rows={4}
                      value={selectedPage.seoDescription}
                      onChange={(event) => updatePage(selectedIndex, 'seoDescription', event.target.value)}
                      placeholder="Short search description for this page"
                    />
                  </Field>
                </FieldGroup>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Field orientation="horizontal" className="items-start justify-between rounded-lg border border-border bg-muted/35 px-4 py-3">
                    <FieldContent>
                      <FieldLabel>Page Enabled</FieldLabel>
                      <FieldDescription>Disable a page without deleting its content.</FieldDescription>
                    </FieldContent>
                    <Switch
                      checked={selectedPage.isEnabled !== false}
                      onCheckedChange={(value) => updatePage(selectedIndex, 'isEnabled', value)}
                    />
                  </Field>

                  <Field orientation="horizontal" className="items-start justify-between rounded-lg border border-border bg-muted/35 px-4 py-3">
                    <FieldContent>
                      <FieldLabel>Show In Footer</FieldLabel>
                      <FieldDescription>Include this page in the storefront quick links list.</FieldDescription>
                    </FieldContent>
                    <Switch
                      checked={selectedPage.showInFooter !== false}
                      onCheckedChange={(value) => updatePage(selectedIndex, 'showInFooter', value)}
                    />
                  </Field>
                </div>
              </SettingSection>
            ) : null}

            <div className="flex items-center gap-4 pb-4">
              <Button onClick={handleSave} disabled={saving} size="sm" className="admin-cta-button">
                {saving ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Save data-icon="inline-start" />}
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Custom Pages'}
              </Button>
              {saved ? <span className="text-sm font-medium text-foreground">Custom pages updated successfully.</span> : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
