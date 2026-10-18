'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Compass,
  ArrowRightLeft,
  Plus,
  Save,
  Trash2,
  Edit2,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Search,
  Download,
  Upload,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  Sparkles,
  MoveUp,
  MoveDown,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const DEFAULT_NAVIGATION_PRESETS = [
  { label: 'Home', url: '/' },
  { label: 'All Products', url: '/products' },
  { label: 'Categories Directory', url: '/categories' },
  { label: 'Dollar Store (Under 300)', url: '/products?price=under300' },
  { label: 'Special Offers', url: '/products?category=special-offers' },
  { label: 'Track Order', url: '/orders' },
  { label: 'Customer Wishlist', url: '/wishlist' },
  { label: 'Contact Support', url: '/contact' },
  { label: 'About Us', url: '/about-us' },
  { label: 'Shipping Policy', url: '/shipping-policy' },
  { label: 'Refund Policy', url: '/refund-policy' },
  { label: 'Privacy Policy', url: '/privacy-policy' },
];

export default function AdminNavigationClient({ initialSettings }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'redirects'

  // ── Menu Items State ──
  const [menuItems, setMenuItems] = useState(() => {
    const list = Array.isArray(initialSettings?.navigationMenuItems)
      ? initialSettings.navigationMenuItems
      : [];
    if (list.length > 0) return list;

    // Provide clean defaults if empty
    return [
      { label: 'Home', url: '/', openInNewTab: false, isEnabled: true, sortOrder: 0 },
      { label: 'Categories', url: '/categories', openInNewTab: false, isEnabled: true, sortOrder: 1 },
      { label: 'All Products', url: '/products', openInNewTab: false, isEnabled: true, sortOrder: 2 },
      { label: 'Track Order', url: '/orders', openInNewTab: false, isEnabled: true, sortOrder: 3 },
      { label: 'Dollar Store', url: '/products?price=under300', openInNewTab: false, isEnabled: true, sortOrder: 4 },
      { label: 'Contact Us', url: '/contact', openInNewTab: false, isEnabled: true, sortOrder: 5 },
    ];
  });

  // Menu Modal State
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenuIndex, setEditingMenuIndex] = useState(null);
  const [menuForm, setMenuForm] = useState({
    label: '',
    url: '',
    openInNewTab: false,
    isEnabled: true,
  });

  // ── Redirects State ──
  const [redirects, setRedirects] = useState(() => {
    return Array.isArray(initialSettings?.urlRedirects) ? initialSettings.urlRedirects : [];
  });
  const [redirectSearch, setRedirectSearch] = useState('');
  const [redirectFilterCode, setRedirectFilterCode] = useState('ALL');

  // Redirect Modal State
  const [isRedirectModalOpen, setIsRedirectModalOpen] = useState(false);
  const [editingRedirectIndex, setEditingRedirectIndex] = useState(null);
  const [redirectForm, setRedirectForm] = useState({
    sourcePath: '',
    targetPath: '',
    statusCode: 301,
    isEnabled: true,
  });

  // CSV Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');

  // ── Save All Settings ──
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          navigationMenuItems: menuItems,
          urlRedirects: redirects,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update navigation and redirects');
      }

      toast.success('Navigation menu and URL redirects saved successfully!');
      router.refresh();
    } catch (err) {
      toast.error(err.message || 'Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Menu Handlers ──
  const openAddMenuModal = () => {
    setEditingMenuIndex(null);
    setMenuForm({
      label: '',
      url: '',
      openInNewTab: false,
      isEnabled: true,
    });
    setIsMenuModalOpen(true);
  };

  const openEditMenuModal = (index) => {
    setEditingMenuIndex(index);
    setMenuForm({ ...menuItems[index] });
    setIsMenuModalOpen(true);
  };

  const handleSaveMenuItem = () => {
    if (!menuForm.label.trim()) {
      toast.error('Menu item label is required');
      return;
    }
    if (!menuForm.url.trim()) {
      toast.error('Target destination URL is required');
      return;
    }

    let cleanUrl = menuForm.url.trim();
    if (!cleanUrl.startsWith('/') && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `/${cleanUrl}`;
    }

    const updatedItem = {
      ...menuForm,
      label: menuForm.label.trim(),
      url: cleanUrl,
    };

    if (editingMenuIndex !== null) {
      setMenuItems((prev) => {
        const next = [...prev];
        next[editingMenuIndex] = { ...next[editingMenuIndex], ...updatedItem };
        return next;
      });
      toast.success(`Updated "${updatedItem.label}"`);
    } else {
      setMenuItems((prev) => [
        ...prev,
        { ...updatedItem, sortOrder: prev.length },
      ]);
      toast.success(`Added "${updatedItem.label}" to menu`);
    }

    setIsMenuModalOpen(false);
  };

  const handleDeleteMenuItem = (index) => {
    const item = menuItems[index];
    if (confirm(`Remove "${item?.label || 'menu item'}" from navigation?`)) {
      setMenuItems((prev) => prev.filter((_, i) => i !== index));
      toast.success('Menu item removed');
    }
  };

  const moveMenuItem = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === menuItems.length - 1) return;

    setMenuItems((prev) => {
      const next = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next.map((item, idx) => ({ ...item, sortOrder: idx }));
    });
  };

  const toggleMenuItem = (index) => {
    setMenuItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], isEnabled: !next[index].isEnabled };
      return next;
    });
  };

  // ── Redirect Handlers ──
  const openAddRedirectModal = () => {
    setEditingRedirectIndex(null);
    setRedirectForm({
      sourcePath: '',
      targetPath: '',
      statusCode: 301,
      isEnabled: true,
    });
    setIsRedirectModalOpen(true);
  };

  const openEditRedirectModal = (index) => {
    setEditingRedirectIndex(index);
    setRedirectForm({ ...redirects[index] });
    setIsRedirectModalOpen(true);
  };

  const handleSaveRedirect = () => {
    if (!redirectForm.sourcePath.trim()) {
      toast.error('Source path is required (e.g. /old-page)');
      return;
    }
    if (!redirectForm.targetPath.trim()) {
      toast.error('Destination path is required (e.g. /products/new-item)');
      return;
    }

    let cleanSource = redirectForm.sourcePath.trim();
    if (!cleanSource.startsWith('/')) cleanSource = `/${cleanSource}`;

    let cleanTarget = redirectForm.targetPath.trim();
    if (!cleanTarget.startsWith('/') && !cleanTarget.startsWith('http://') && !cleanTarget.startsWith('https://')) {
      cleanTarget = `/${cleanTarget}`;
    }

    if (cleanSource.toLowerCase() === cleanTarget.toLowerCase()) {
      toast.error('Source path and destination path cannot be identical (would cause redirect loop)');
      return;
    }

    const updated = {
      ...redirectForm,
      sourcePath: cleanSource,
      targetPath: cleanTarget,
      statusCode: Number(redirectForm.statusCode) || 301,
    };

    if (editingRedirectIndex !== null) {
      setRedirects((prev) => {
        const next = [...prev];
        next[editingRedirectIndex] = updated;
        return next;
      });
      toast.success('Redirect rule updated');
    } else {
      // Check duplicate source
      const existing = redirects.some((r) => r.sourcePath.toLowerCase() === cleanSource.toLowerCase());
      if (existing) {
        toast.error(`A redirect for "${cleanSource}" already exists`);
        return;
      }
      setRedirects((prev) => [updated, ...prev]);
      toast.success(`Redirect created: ${cleanSource} → ${cleanTarget}`);
    }

    setIsRedirectModalOpen(false);
  };

  const handleDeleteRedirect = (index) => {
    const item = redirects[index];
    if (confirm(`Delete redirect from "${item?.sourcePath}"?`)) {
      setRedirects((prev) => prev.filter((_, i) => i !== index));
      toast.success('Redirect removed');
    }
  };

  const toggleRedirect = (index) => {
    setRedirects((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], isEnabled: !next[index].isEnabled };
      return next;
    });
  };

  // CSV Export
  const exportRedirectsToCsv = () => {
    if (redirects.length === 0) {
      toast.info('No redirects to export');
      return;
    }
    const header = 'sourcePath,targetPath,statusCode,isEnabled\r\n';
    const rows = redirects
      .map((r) => `"${r.sourcePath}","${r.targetPath}",${r.statusCode || 301},${r.isEnabled !== false}`)
      .join('\r\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `url_redirects_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exported redirects CSV');
  };

  // CSV Import
  const handleImportCsv = () => {
    if (!importCsvText.trim()) {
      toast.error('Please paste CSV content');
      return;
    }
    const lines = importCsvText.trim().split(/\r?\n/);
    const newItems = [];
    let count = 0;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.toLowerCase().startsWith('sourcepath')) continue;

      // Simple CSV split (handling optional quotes)
      const parts = line.split(',').map((p) => p.replace(/^"|"$/g, '').trim());
      if (parts.length >= 2) {
        let sourcePath = parts[0];
        let targetPath = parts[1];
        if (!sourcePath.startsWith('/')) sourcePath = `/${sourcePath}`;
        if (!targetPath.startsWith('/') && !targetPath.startsWith('http')) targetPath = `/${targetPath}`;
        const statusCode = parts[2] === '302' ? 302 : 301;
        const isEnabled = parts[3] ? parts[3].toLowerCase() !== 'false' : true;

        newItems.push({ sourcePath, targetPath, statusCode, isEnabled });
        count++;
      }
    }

    if (count === 0) {
      toast.error('No valid redirect rows found in CSV');
      return;
    }

    // Merge without duplicates by sourcePath
    setRedirects((prev) => {
      const existingMap = new Map(prev.map((r) => [r.sourcePath.toLowerCase(), r]));
      for (const item of newItems) {
        existingMap.set(item.sourcePath.toLowerCase(), item);
      }
      return Array.from(existingMap.values());
    });

    toast.success(`Imported ${count} redirects`);
    setIsImportModalOpen(false);
    setImportCsvText('');
  };

  // Filtered redirects
  const filteredRedirects = redirects.filter((r) => {
    const matchesSearch =
      !redirectSearch.trim() ||
      r.sourcePath.toLowerCase().includes(redirectSearch.toLowerCase()) ||
      r.targetPath.toLowerCase().includes(redirectSearch.toLowerCase());

    const matchesCode =
      redirectFilterCode === 'ALL' ||
      String(r.statusCode || 301) === redirectFilterCode;

    return matchesSearch && matchesCode;
  });

  const permanentCount = redirects.filter((r) => (r.statusCode || 301) === 301).length;
  const temporaryCount = redirects.filter((r) => r.statusCode === 302).length;

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Compass className="size-6 text-primary" /> Navigation & URL Redirects
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage storefront menu links and configure 301/302 redirects to preserve SEO rankings when moving or renaming pages.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {activeTab === 'menu' ? (
            <Button
              type="button"
              variant="outline"
              onClick={openAddMenuModal}
              className="rounded-xl border-border bg-card font-semibold text-xs sm:text-sm"
            >
              <Plus className="mr-1.5 size-4 text-primary" /> Add Menu Item
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={openAddRedirectModal}
              className="rounded-xl border-border bg-card font-semibold text-xs sm:text-sm"
            >
              <Plus className="mr-1.5 size-4 text-primary" /> Create Redirect
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="rounded-xl font-bold text-xs sm:text-sm bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Save className="mr-1.5 size-4" /> {isSaving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="rounded-xl bg-muted/60 p-1 border border-border">
          <TabsTrigger value="menu" className="rounded-lg text-xs font-bold gap-1.5">
            <Layers className="size-3.5" /> Storefront Menu ({menuItems.length})
          </TabsTrigger>
          <TabsTrigger value="redirects" className="rounded-lg text-xs font-bold gap-1.5">
            <ArrowRightLeft className="size-3.5" /> URL Redirects ({redirects.length})
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: MENU NAVIGATION ── */}
        <TabsContent value="menu" className="space-y-4 mt-4">
          <Card className="rounded-2xl border-border bg-card shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Main Storefront Navigation</CardTitle>
                  <CardDescription className="text-xs">
                    These links appear in the secondary navigation bar below the store header and in the mobile drawer.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={openAddMenuModal}
                  className="rounded-xl text-xs font-semibold"
                >
                  <Plus className="size-3.5 mr-1" /> Add Link
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {menuItems.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No menu items configured. Click &quot;Add Menu Item&quot; to build your storefront navigation.
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {menuItems.map((item, index) => (
                    <div
                      key={index}
                      className={cn(
                        'flex items-center justify-between p-3.5 sm:px-6 transition-colors',
                        item.isEnabled ? 'hover:bg-muted/30' : 'bg-muted/15 opacity-60'
                      )}
                    >
                      {/* Left: Reorder Controls & Label */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveMenuItem(index, 'up')}
                            className="size-5 rounded flex items-center justify-center hover:bg-muted disabled:opacity-30 disabled:pointer-events-none text-muted-foreground hover:text-foreground"
                            title="Move up"
                          >
                            <MoveUp className="size-3" />
                          </button>
                          <button
                            type="button"
                            disabled={index === menuItems.length - 1}
                            onClick={() => moveMenuItem(index, 'down')}
                            className="size-5 rounded flex items-center justify-center hover:bg-muted disabled:opacity-30 disabled:pointer-events-none text-muted-foreground hover:text-foreground"
                            title="Move down"
                          >
                            <MoveDown className="size-3" />
                          </button>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground truncate">
                              {item.label}
                            </span>
                            {item.openInNewTab && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 gap-0.5">
                                <ExternalLink className="size-2.5" /> New Tab
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs font-mono text-muted-foreground truncate">
                            {item.url}
                          </p>
                        </div>
                      </div>

                      {/* Right: Toggle & Actions */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="flex items-center gap-1.5 mr-2">
                          <span className="text-[11px] font-semibold text-muted-foreground hidden sm:inline">
                            {item.isEnabled ? 'Visible' : 'Hidden'}
                          </span>
                          <Switch
                            checked={item.isEnabled}
                            onCheckedChange={() => toggleMenuItem(index)}
                          />
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditMenuModal(index)}
                          className="rounded-lg text-muted-foreground hover:text-foreground"
                          title="Edit item"
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDeleteMenuItem(index)}
                          className="rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                          title="Delete item"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 2: URL REDIRECTS (SEO PROTECTION) ── */}
        <TabsContent value="redirects" className="space-y-4 mt-4">
          {/* SEO Metric Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="rounded-2xl border-border bg-card p-4 flex items-center justify-between shadow-xs">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Redirects</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{redirects.length}</p>
              </div>
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <ArrowRightLeft className="size-5" />
              </div>
            </Card>

            <Card className="rounded-2xl border-border bg-card p-4 flex items-center justify-between shadow-xs">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">301 Permanent (SEO)</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {permanentCount}
                </p>
              </div>
              <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="size-5" />
              </div>
            </Card>

            <Card className="rounded-2xl border-border bg-card p-4 flex items-center justify-between shadow-xs">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">302 Temporary</p>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
                  {temporaryCount}
                </p>
              </div>
              <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Sparkles className="size-5" />
              </div>
            </Card>
          </div>

          {/* Filter & Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  value={redirectSearch}
                  onChange={(e) => setRedirectSearch(e.target.value)}
                  placeholder="Filter by source or target URL..."
                  className="rounded-xl pl-9 text-xs"
                />
              </div>
              <Select value={redirectFilterCode} onValueChange={setRedirectFilterCode}>
                <SelectTrigger className="w-36 rounded-xl text-xs h-9">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="301">301 Permanent</SelectItem>
                  <SelectItem value="302">302 Temporary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsImportModalOpen(true)}
                className="rounded-xl text-xs font-semibold"
              >
                <Upload className="size-3.5 mr-1" /> Import CSV
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={exportRedirectsToCsv}
                className="rounded-xl text-xs font-semibold"
              >
                <Download className="size-3.5 mr-1" /> Export CSV
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={openAddRedirectModal}
                className="rounded-xl text-xs font-bold bg-primary text-primary-foreground"
              >
                <Plus className="size-3.5 mr-1" /> Add Redirect
              </Button>
            </div>
          </div>

          {/* Redirects Table */}
          <Card className="rounded-2xl border-border bg-card shadow-xs overflow-hidden">
            <CardContent className="p-0">
              {filteredRedirects.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground text-sm">
                  <AlertCircle className="size-8 mx-auto mb-2 text-muted-foreground/60" />
                  <p className="font-semibold text-foreground">No redirects found</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {redirectSearch ? 'Try clearing your search filter.' : 'Click "Add Redirect" to create your first SEO redirect rule.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {filteredRedirects.map((r, index) => {
                    const is301 = (r.statusCode || 301) === 301;
                    return (
                      <div
                        key={index}
                        className={cn(
                          'flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 transition-colors',
                          r.isEnabled ? 'hover:bg-muted/30' : 'bg-muted/15 opacity-60'
                        )}
                      >
                        {/* URL Flow Indicator */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded-md">
                              {r.sourcePath}
                            </span>
                            <span className="text-muted-foreground text-xs font-bold">→</span>
                            <span className="font-mono text-xs font-semibold text-primary truncate max-w-xs sm:max-w-md">
                              {r.targetPath}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] font-bold px-1.5 py-0',
                                is301
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                  : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                              )}
                            >
                              {is301 ? '301 Permanent (SEO)' : '302 Temporary'}
                            </Badge>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2 shrink-0 justify-end">
                          <div className="flex items-center gap-1.5 mr-2">
                            <Switch
                              checked={r.isEnabled !== false}
                              onCheckedChange={() => toggleRedirect(index)}
                            />
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(r.sourcePath, '_blank')}
                            className="rounded-lg text-xs text-muted-foreground hover:text-foreground h-8 px-2 gap-1"
                            title="Test redirect in new window"
                          >
                            <ExternalLink className="size-3" /> Test
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEditRedirectModal(index)}
                            className="rounded-lg text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDeleteRedirect(index)}
                            className="rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
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
        </TabsContent>
      </Tabs>

      {/* ── DIALOG 1: Add/Edit Menu Item ── */}
      <Dialog open={isMenuModalOpen} onOpenChange={setIsMenuModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Layers className="size-4 text-primary" />{' '}
              {editingMenuIndex !== null ? 'Edit Menu Item' : 'Add Storefront Menu Item'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure the label and destination link for this storefront navigation element.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Preset Selector */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Quick Preset</label>
              <Select
                onValueChange={(val) => {
                  const preset = DEFAULT_NAVIGATION_PRESETS.find((p) => p.url === val);
                  if (preset) {
                    setMenuForm((prev) => ({
                      ...prev,
                      label: prev.label || preset.label,
                      url: preset.url,
                    }));
                  }
                }}
              >
                <SelectTrigger className="rounded-xl text-xs h-9">
                  <SelectValue placeholder="Choose a popular store page..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {DEFAULT_NAVIGATION_PRESETS.map((p) => (
                    <SelectItem key={p.url} value={p.url} className="text-xs">
                      {p.label} ({p.url})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Menu Title / Label</label>
              <Input
                value={menuForm.label}
                onChange={(e) => setMenuForm((p) => ({ ...p, label: e.target.value }))}
                placeholder="e.g. Kitchen Deals"
                className="rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Target URL / Path</label>
              <Input
                value={menuForm.url}
                onChange={(e) => setMenuForm((p) => ({ ...p, url: e.target.value }))}
                placeholder="e.g. /products?category=kitchen or https://..."
                className="rounded-xl text-sm font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Internal paths must start with a slash (e.g. <code>/products</code>).
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="text-xs font-semibold text-foreground">Open in new tab (_blank)</label>
              <Switch
                checked={menuForm.openInNewTab}
                onCheckedChange={(checked) => setMenuForm((p) => ({ ...p, openInNewTab: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">Visible in menu</label>
              <Switch
                checked={menuForm.isEnabled}
                onCheckedChange={(checked) => setMenuForm((p) => ({ ...p, isEnabled: checked }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsMenuModalOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveMenuItem}
              className="rounded-xl font-bold bg-primary text-primary-foreground"
            >
              {editingMenuIndex !== null ? 'Save Changes' : 'Add to Menu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG 2: Add/Edit Redirect ── */}
      <Dialog open={isRedirectModalOpen} onOpenChange={setIsRedirectModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ArrowRightLeft className="size-4 text-primary" />{' '}
              {editingRedirectIndex !== null ? 'Edit URL Redirect' : 'Create URL Redirect'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Redirect old or broken URLs to new canonical pages to preserve search engine ranking (Shopify parity).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Redirect from (Source Path)</label>
              <Input
                value={redirectForm.sourcePath}
                onChange={(e) => setRedirectForm((p) => ({ ...p, sourcePath: e.target.value }))}
                placeholder="e.g. /old-product or /collections/kitchen"
                className="rounded-xl text-sm font-mono"
              />
              <p className="text-[11px] text-muted-foreground">The old or discontinued URL path visitors may request.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Redirect to (Destination URL)</label>
              <Input
                value={redirectForm.targetPath}
                onChange={(e) => setRedirectForm((p) => ({ ...p, targetPath: e.target.value }))}
                placeholder="e.g. /products/new-air-fryer or /categories"
                className="rounded-xl text-sm font-mono"
              />
              <p className="text-[11px] text-muted-foreground">The new canonical destination on your store or external link.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Redirect Type</label>
              <Select
                value={String(redirectForm.statusCode)}
                onValueChange={(val) => setRedirectForm((p) => ({ ...p, statusCode: Number(val) }))}
              >
                <SelectTrigger className="rounded-xl text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="301" className="text-xs">
                    301 Moved Permanently (Recommended for SEO)
                  </SelectItem>
                  <SelectItem value="302" className="text-xs">
                    302 Found / Temporary (Maintenance or seasonal)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="text-xs font-semibold text-foreground">Active Rule</label>
              <Switch
                checked={redirectForm.isEnabled}
                onCheckedChange={(checked) => setRedirectForm((p) => ({ ...p, isEnabled: checked }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRedirectModalOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveRedirect}
              className="rounded-xl font-bold bg-primary text-primary-foreground"
            >
              {editingRedirectIndex !== null ? 'Update Redirect' : 'Create Redirect'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG 3: Import CSV ── */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FileSpreadsheet className="size-4 text-primary" /> Import URL Redirects via CSV
            </DialogTitle>
            <DialogDescription className="text-xs">
              Paste CSV text formatted as: <code>sourcePath,targetPath,statusCode</code>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="bg-muted/50 p-2.5 rounded-xl border border-border/70 text-[11px] font-mono text-muted-foreground space-y-0.5">
              <p className="font-bold text-foreground">Example CSV Rows:</p>
              <p>/old-air-fryer,/products/air-fryer,301</p>
              <p>/sale-2025,/products?category=special-offers,302</p>
            </div>

            <textarea
              value={importCsvText}
              onChange={(e) => setImportCsvText(e.target.value)}
              placeholder="Paste CSV rows here..."
              rows={8}
              className="w-full rounded-xl border border-border bg-background p-3 text-xs font-mono leading-relaxed"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsImportModalOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleImportCsv}
              className="rounded-xl font-bold bg-primary text-primary-foreground"
            >
              Process Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
