"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition, useEffect, useState, useTransition } from "react";
import {
  ArrowDownWideNarrow,
  Copy,
  ImageIcon,
  MessageSquare,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Store,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import AdminReviewsDialog from "@/components/AdminReviewsDialog";
import AppPagination from "@/components/AppPagination";
import { deleteProductAction, toggleProductLiveAction } from "@/app/actions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { getBlurPlaceholderProps } from "@/lib/imagePlaceholder";
import { getProductCategoryNames } from "@/lib/productCategories";
import { getPrimaryProductImage } from "@/lib/productImages";

function buildHref(pathname, searchParams, updates) {
  const params = new URLSearchParams(searchParams?.toString());

  Object.entries(updates).forEach(([key, value]) => {
    if (
      value === null ||
      value === undefined ||
      value === "" ||
      value === "all" ||
      (key === "sort" && value === "newest")
    ) {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function DiscountDialog({ open, product, onOpenChange, onSuccess }) {
  const [pct, setPct] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && product) {
      setPct(String(product.discountPercentage > 0 ? product.discountPercentage : ""));
    }
  }, [open, product]);

  async function sendDiscount(discountPercentage) {
    const res = await fetch(`/api/products/${product._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discountPercentage }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || json.message || "Failed to update discount");
    }
    return json.data;
  }

  async function handleApply() {
    const value = Number(pct);
    if (Number.isNaN(value) || value < 0 || value > 100) {
      toast.error("Enter a valid percentage between 0 and 100.");
      return;
    }

    setSaving(true);
    try {
      const result = await sendDiscount(value);
      toast.success(
        value > 0
          ? `${value}% discount applied to "${product.Name}".`
          : `Discount removed from "${product.Name}".`,
      );
      onSuccess(product._id, result.discountPercentage, result.isDiscounted, result.discountedPrice);
      onOpenChange(false);
    } catch (error) {
      toast.error(error.message || "Failed to update discount.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    setSaving(true);
    try {
      const result = await sendDiscount(0);
      toast.success(`Discount removed from "${product.Name}".`);
      onSuccess(product._id, result.discountPercentage, result.isDiscounted, result.discountedPrice);
      onOpenChange(false);
    } catch (error) {
      toast.error(error.message || "Failed to remove discount.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Tag className="size-4 text-foreground" />
            Set Discount
          </AlertDialogTitle>
          <AlertDialogDescription>
            Enter a discount percentage for{" "}
            <span className="font-semibold text-foreground uppercase tracking-wide">{product?.Name}</span>.
            Set to 0 to remove the discount.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="px-0 py-2">
          <div className="relative flex items-center">
            <Input
              type="number"
              min="0"
              max="100"
              step="1"
              placeholder="e.g. 20"
              value={pct}
              onChange={(event) => setPct(event.target.value)}
              className="pr-10"
              onKeyDown={(event) => event.key === "Enter" && handleApply()}
            />
            <span className="pointer-events-none absolute right-3 text-sm font-medium text-muted-foreground">%</span>
          </div>

          {product?.Price > 0 && Number(pct) > 0 && Number(pct) <= 100 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Discounted price:{" "}
              <span className="font-semibold text-foreground">
                PKR {Math.round(product.Price * (1 - Number(pct) / 100)).toLocaleString("en-PK")}
              </span>{" "}
              <span className="line-through text-muted-foreground/70">
                PKR {Number(product.Price).toLocaleString("en-PK")}
              </span>
            </p>
          )}
        </div>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          {product?.isDiscounted && (
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={handleRemove}
              disabled={saving}
            >
              Remove Discount
            </Button>
          )}
          <AlertDialogCancel className={cn(buttonVariants({ variant: "outline" }))} disabled={saving}>
            Cancel
          </AlertDialogCancel>
          <Button onClick={handleApply} disabled={saving}>
            {saving ? "Saving..." : "Apply Discount"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function AdminProductsClient({
  initialProducts,
  total,
  totalPages,
  currentPage,
  initialSearchQuery,
  initialStatusFilter,
  initialStockFilter,
  initialSortOption,
  summary,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startNavTransition] = useTransition();
  const [products, setProducts] = useState(initialProducts);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [sortOption, setSortOption] = useState(initialSortOption);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [stockFilter, setStockFilter] = useState(initialStockFilter);
  const [deleteModal, setDeleteModal] = useState({ open: false, product: null });
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [togglingStockId, setTogglingStockId] = useState(null);
  const [discountModal, setDiscountModal] = useState({ open: false, product: null });
  const [reviewsModal, setReviewsModal] = useState({ open: false, product: null });
  const [vendorsModal, setVendorsModal] = useState({ open: false, product: null });

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  useEffect(() => {
    setSortOption(initialSortOption);
    setStatusFilter(initialStatusFilter);
    setStockFilter(initialStockFilter);
  }, [initialSortOption, initialStatusFilter, initialStockFilter]);

  function navigate(updates) {
    const href = buildHref(pathname, searchParams, updates);
    startNavTransition(() => {
      router.push(href);
    });
  }

  function clearFilters() {
    setSearchQuery("");
    setSortOption("newest");
    setStatusFilter("all");
    setStockFilter("all");
    navigate({ search: null, sort: null, status: null, stock: null, page: null });
  }

  async function handleDelete() {
    if (!deleteModal.product) return;
    setDeleting(true);
    startTransition(async () => {
      try {
        await deleteProductAction(deleteModal.product._id);
        setProducts((previous) => previous.filter((product) => product._id !== deleteModal.product._id));
        toast.success(`Product "${deleteModal.product.Name}" deleted.`);
        setDeleteModal({ open: false, product: null });
        router.refresh();
      } catch (error) {
        toast.error(error.message || "Could not delete the product.");
      } finally {
        setDeleting(false);
      }
    });
  }

  async function handleToggleLive(product) {
    setTogglingId(product._id);
    startTransition(async () => {
      try {
        const result = await toggleProductLiveAction(product._id, !product.isLive);
        setProducts((previous) =>
          previous.map((entry) => (entry._id === product._id ? { ...entry, isLive: result.isLive } : entry)),
        );
        toast.success(`"${product.Name}" is now ${result.isLive ? "Live" : "Draft"}.`);
        router.refresh();
      } catch (error) {
        toast.error(error.message || "Could not update product visibility.");
      } finally {
        setTogglingId(null);
      }
    });
  }

  async function handleToggleStock(product) {
    setTogglingStockId(product._id);
    const newStockStatus = product.StockStatus === "In Stock" ? "Out of Stock" : "In Stock";
    startTransition(async () => {
      try {
        const res = await fetch(`/api/products/${product._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ StockStatus: newStockStatus }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || json.message || "Failed to update stock status");
        }

        setProducts((previous) =>
          previous.map((entry) => (entry._id === product._id ? { ...entry, StockStatus: newStockStatus } : entry)),
        );
        toast.success(`"${product.Name}" is now ${newStockStatus}.`);
        router.refresh();
      } catch (error) {
        toast.error(error.message || "Could not update stock status.");
      } finally {
        setTogglingStockId(null);
      }
    });
  }

  async function toggleProductFlag(productId, flag, currentStatus) {
    const originalProducts = [...products];
    const newStatus = !currentStatus;

    try {
      setProducts((prev) => prev.map((product) => (
        product._id === productId ? { ...product, [flag]: newStatus } : product
      )));

      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [flag]: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update flag");
      toast.success(
        flag === "isNewArrival"
          ? `New Arrival ${newStatus ? "enabled" : "disabled"} for this product.`
          : `Best Selling ${newStatus ? "enabled" : "disabled"} for this product.`
      );
      router.refresh();
    } catch (error) {
      setProducts(originalProducts);
      toast.error(error.message || "Could not update the product badge.");
    }
  }

  function handleDiscountSuccess(productId, discountPercentage, isDiscounted, discountedPrice) {
    setProducts((previous) =>
      previous.map((entry) =>
        entry._id === productId
          ? { ...entry, discountPercentage, isDiscounted, discountedPrice: discountedPrice ?? null }
          : entry,
      ),
    );
    router.refresh();
  }

  const formatPrice = (price) => `PKR ${Number(price).toLocaleString("en-PK")}`;

  async function handleCopy(value, label) {
    const text = typeof value === "string" ? value.trim() : String(value ?? "").trim();

    if (!text) {
      toast.error(`${label} not added yet.`);
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied.`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}.`);
    }
  }

  return (
    <div className="pb-24 md:pb-0">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Products</h2>
          <p className="mt-1 text-sm text-muted-foreground">{summary.totalProducts} total • {summary.liveProducts} live</p>
        </div>
        <Link href="/admin/products/add" className="w-full md:w-auto">
          <Button className="w-full border border-foreground bg-foreground text-background hover:bg-foreground/88 md:w-auto">
            <Plus data-icon="inline-start" />
            Add product
          </Button>
        </Link>
      </div>

      <div className="admin-surface mb-5 flex flex-col gap-3 rounded-[1.35rem] p-4">
        <form
          className="flex flex-col gap-3 lg:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            navigate({ search: searchQuery.trim() || null, page: null });
          }}
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search products, categories, or vendors"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <div className="w-full lg:w-[220px]">
            <Select
              value={sortOption}
              onValueChange={(value) => {
                setSortOption(value);
                navigate({ sort: value, page: null });
              }}
            >
              <SelectTrigger className="h-10 w-full bg-background">
                <div className="flex items-center gap-2">
                  <ArrowDownWideNarrow className="size-4 text-muted-foreground" />
                  <SelectValue placeholder="Sort" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Date Created (Newest)</SelectItem>
                <SelectItem value="oldest">Date Created (Oldest)</SelectItem>
                <SelectItem value="updated">Last Updated</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price-high">Price High</SelectItem>
                <SelectItem value="price-low">Price Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              navigate({ status: value, page: null });
            }}
          >
            <SelectTrigger className="h-9 w-full bg-background text-xs lg:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={stockFilter}
            onValueChange={(value) => {
              setStockFilter(value);
              navigate({ stock: value, page: null });
            }}
          >
            <SelectTrigger className="h-9 w-full bg-background text-xs lg:w-[140px]">
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="in-stock">In Stock</SelectItem>
              <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          {(searchQuery || statusFilter !== "all" || stockFilter !== "all" || sortOption !== "newest") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 w-full gap-2 justify-center text-muted-foreground hover:text-foreground sm:col-span-2 lg:w-auto"
            >
              <X className="size-4" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      <div className={cn("admin-surface hidden overflow-hidden rounded-[1.35rem] md:block transition-opacity", isPending && "opacity-70")}>
        <div className="overflow-x-auto">
          <table className="min-w-[1000px] w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Stock Status</th>
                <th className="px-6 py-4">Flags</th>
                <th className="px-6 py-4 text-center">Visibility</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <p className="font-medium text-muted-foreground">No products found for the selected criteria.</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="transition-colors hover:bg-muted/35">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative size-12 overflow-hidden rounded-lg border border-border bg-muted">
                          {getPrimaryProductImage(product)?.url ? (
                            <Image
                              src={getPrimaryProductImage(product).url}
                              alt={product.Name}
                              fill
                              className="object-cover"
                              {...getBlurPlaceholderProps(getPrimaryProductImage(product).blurDataURL)}
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-muted-foreground">
                              <ImageIcon className="size-4" />
                            </div>
                          )}
                        </div>
                        <span className="max-w-[220px] line-clamp-2 text-sm font-semibold text-foreground">{product.Name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {product.isDiscounted && product.discountPercentage > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-bold text-foreground">
                            PKR {Math.round(product.Price * (1 - product.discountPercentage / 100)).toLocaleString("en-PK")}
                          </span>
                          <span className="text-xs text-muted-foreground line-through">{formatPrice(product.Price)}</span>
                        </div>
                      ) : (
                        <span className="text-sm font-semibold text-foreground">{formatPrice(product.Price)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex max-w-[180px] flex-wrap gap-1.5">
                        {getProductCategoryNames(product).map((category) => (
                          <Badge key={category} variant="secondary" className="text-[10px]">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-2">
                        <Switch
                          checked={product.StockStatus === "In Stock"}
                          disabled={togglingStockId === product._id}
                          onCheckedChange={() => handleToggleStock(product)}
                          aria-label={`Toggle ${product.Name} stock status`}
                        />
                        <Badge variant={product.StockStatus === "In Stock" ? "secondary" : "destructive"} className="min-w-[85px] justify-center text-[10px] uppercase">
                          {product.StockStatus === "In Stock" ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleProductFlag(product._id, "isNewArrival", product.isNewArrival)}
                          className={cn(
                            "flex h-7 px-2 items-center justify-center rounded-md border text-[9px] font-bold transition-all",
                            product.isNewArrival ? "border-foreground/18 bg-foreground/8 text-foreground" : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted",
                          )}
                          title="New Arrival"
                        >
                          NEW
                        </button>
                        <button
                          onClick={() => toggleProductFlag(product._id, "isBestSelling", product.isBestSelling)}
                          className={cn(
                            "flex h-7 px-2 items-center justify-center rounded-md border text-[9px] font-bold transition-all",
                            product.isBestSelling ? "border-foreground/18 bg-foreground/8 text-foreground" : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted",
                          )}
                          title="Best Selling"
                        >
                          TOP
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-3">
                        <Switch
                          checked={product.isLive}
                          disabled={togglingId === product._id}
                          onCheckedChange={() => handleToggleLive(product)}
                          aria-label={`Toggle ${product.Name} live status`}
                        />
                        <span className="min-w-10 text-left text-[11px] font-bold uppercase text-muted-foreground">
                          {product.isLive ? "Live" : "Draft"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 relative">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant={product.isDiscounted ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "h-8 px-3",
                            product.isDiscounted && "border border-foreground bg-foreground text-background hover:bg-foreground/88"
                          )}
                          onClick={() => setDiscountModal({ open: true, product })}
                          title="Set Discount"
                        >
                          <Tag className="mr-1.5 size-3.5" />
                          {product.isDiscounted ? `${product.discountPercentage}%` : "Disc."}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className={cn(
                              "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 outline-none select-none hover:bg-muted hover:text-foreground text-muted-foreground size-8 border border-transparent hover:border-border",
                            )}
                            title="Actions"
                          >
                            <MoreVertical className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="cursor-pointer">
                                <Link href={`/admin/products/edit/${product._id}`} className="flex w-full items-center">
                                  <Pencil className="mr-2 size-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer" onClick={() => setReviewsModal({ open: true, product })}>
                                <MessageSquare className="mr-2 size-4" />
                                Reviews
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer" onClick={() => setVendorsModal({ open: true, product })}>
                                <Store className="mr-2 size-4" />
                                View Vendors
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:bg-destructive cursor-pointer focus:text-destructive-foreground"
                                onClick={() => setDeleteModal({ open: true, product })}
                              >
                                <Trash2 className="mr-2 size-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={cn("space-y-3 md:hidden transition-opacity", isPending && "opacity-70")}>
        {products.length === 0 ? (
          <div className="admin-surface rounded-[1.25rem] px-4 py-10 text-center">
            <p className="font-medium text-muted-foreground">No products found for the selected criteria.</p>
          </div>
        ) : (
          products.map((product) => (
            <div key={product._id} className="admin-surface rounded-[1.25rem] p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted sm:size-16">
                  {getPrimaryProductImage(product)?.url ? (
                    <Image
                      src={getPrimaryProductImage(product).url}
                      alt={product.Name}
                      fill
                      className="object-cover"
                      {...getBlurPlaceholderProps(getPrimaryProductImage(product).blurDataURL)}
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="size-4" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-semibold text-foreground">{product.Name}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {getProductCategoryNames(product).map((category) => (
                          <Badge key={category} variant="secondary" className="text-[10px]">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className={cn(
                          "inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition-all hover:border-border hover:bg-muted hover:text-foreground size-8",
                        )}
                        title="Actions"
                      >
                        <MoreVertical className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[170px]">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="cursor-pointer">
                            <Link href={`/admin/products/edit/${product._id}`} className="flex w-full items-center">
                              <Pencil className="mr-2 size-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => setDiscountModal({ open: true, product })}
                          >
                            <Tag className="mr-2 size-4" />
                            {product.isDiscounted ? "Edit Discount" : "Set Discount"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => setReviewsModal({ open: true, product })}
                          >
                            <MessageSquare className="mr-2 size-4" />
                            Reviews
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => setVendorsModal({ open: true, product })}
                          >
                            <Store className="mr-2 size-4" />
                            View Vendors
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive cursor-pointer focus:text-destructive-foreground"
                            onClick={() => setDeleteModal({ open: true, product })}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {product.isDiscounted && product.discountPercentage > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-bold text-foreground">
                            PKR {Math.round(product.Price * (1 - product.discountPercentage / 100)).toLocaleString("en-PK")}
                          </span>
                          <span className="text-xs text-muted-foreground line-through">{formatPrice(product.Price)}</span>
                        </div>
                      ) : (
                        <span className="text-sm font-semibold text-foreground">{formatPrice(product.Price)}</span>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge variant={product.StockStatus === "In Stock" ? "secondary" : "destructive"} className="text-[10px] uppercase">
                        {product.StockStatus === "In Stock" ? "In Stock" : "Out of Stock"}
                      </Badge>
                      <Badge variant={product.isLive ? "default" : "secondary"} className="text-[10px] uppercase">
                        {product.isLive ? "Live" : "Draft"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 rounded-lg border border-border bg-muted/20 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-medium text-muted-foreground">Visibility</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase text-muted-foreground">
                      {product.isLive ? "Live" : "Draft"}
                    </span>
                    <Switch
                      checked={product.isLive}
                      disabled={togglingId === product._id}
                      onCheckedChange={() => handleToggleLive(product)}
                      aria-label={`Toggle ${product.Name} live status`}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-medium text-muted-foreground">Stock</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase text-muted-foreground">
                      {product.StockStatus === "In Stock" ? "In Stock" : "Out of Stock"}
                    </span>
                    <Switch
                      checked={product.StockStatus === "In Stock"}
                      disabled={togglingStockId === product._id}
                      onCheckedChange={() => handleToggleStock(product)}
                      aria-label={`Toggle ${product.Name} stock status`}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-medium text-muted-foreground">Flags</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleProductFlag(product._id, "isNewArrival", product.isNewArrival)}
                      className={cn(
                        "flex h-7 px-2 items-center justify-center rounded-md border text-[9px] font-bold transition-all",
                        product.isNewArrival ? "border-foreground/18 bg-foreground/8 text-foreground" : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted",
                      )}
                      title="New Arrival"
                    >
                      NEW
                    </button>
                    <button
                      onClick={() => toggleProductFlag(product._id, "isBestSelling", product.isBestSelling)}
                      className={cn(
                        "flex h-7 px-2 items-center justify-center rounded-md border text-[9px] font-bold transition-all",
                        product.isBestSelling ? "border-foreground/18 bg-foreground/8 text-foreground" : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted",
                      )}
                      title="Best Selling"
                    >
                      TOP
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex flex-col gap-3 px-1 sm:px-2">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            Showing <span className="font-medium text-foreground">{((currentPage - 1) * 12) + 1}</span> to{" "}
            <span className="font-medium text-foreground">{Math.min(currentPage * 12, total)}</span> of{" "}
            <span className="font-medium text-foreground">{total}</span> products
          </p>
          <AppPagination
            page={currentPage}
            totalPages={totalPages}
            getHref={(page) => buildHref(pathname, searchParams, { page })}
          />
        </div>
      )}

      <AlertDialog open={deleteModal.open} onOpenChange={(open) => setDeleteModal((previous) => ({ ...previous, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <span className="font-semibold text-foreground">{deleteModal.product?.Name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={cn(buttonVariants({ variant: "outline" }))} onClick={() => setDeleteModal({ open: false, product: null })}>
              Cancel
            </AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Product"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DiscountDialog
        open={discountModal.open}
        product={discountModal.product}
        onOpenChange={(open) => setDiscountModal((previous) => ({ ...previous, open }))}
        onSuccess={handleDiscountSuccess}
      />

      <AdminReviewsDialog
        open={reviewsModal.open}
        product={reviewsModal.product}
        onOpenChange={(open) => setReviewsModal((previous) => ({ ...previous, open }))}
      />

      <Dialog
        open={vendorsModal.open}
        onOpenChange={(open) => setVendorsModal((previous) => ({ ...previous, open }))}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assigned Vendors</DialogTitle>
            <DialogDescription>
              {vendorsModal.product?.Name || 'This product'} is linked to the following vendors.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-border bg-muted/20 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Product Name
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground sm:text-base">
                {vendorsModal.product?.Name || "Product name not available"}
              </p>
            </div>

            {Array.isArray(vendorsModal.product?.vendors) && vendorsModal.product.vendors.length > 0 ? (
              vendorsModal.product.vendors.map((vendor, index) => (
                <div
                  key={`${vendor.vendorId || vendor.name}-${vendor.shopNumber || ''}`}
                  className="rounded-2xl border border-border bg-background p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Vendor {index + 1}
                        </p>
                        <p className="mt-1 text-base font-semibold text-foreground">
                          {vendor.name || "Vendor not added"}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {vendor.shopNumber ? `Shop ${vendor.shopNumber}` : "Shop number not added"}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:w-auto">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full sm:min-w-[170px]"
                          onClick={() => handleCopy(vendor.vendorProductName, "Vendor product name")}
                        >
                          <Copy className="mr-2 size-3.5" />
                          Copy Vendor Name
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)]">
                      <div className="rounded-xl bg-muted/20 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Vendor Product Name
                        </p>
                        <p className="mt-2 text-sm font-medium leading-6 text-foreground">
                          {vendor.vendorProductName || "Not added"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted/20 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Price
                        </p>
                        <p className="mt-2 text-sm font-semibold text-foreground tabular-nums">
                          {typeof vendor.vendorPrice === "number" && Number.isFinite(vendor.vendorPrice)
                            ? formatPrice(vendor.vendorPrice)
                            : "Not added"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                No vendors assigned yet.
              </div>
            )}
          </div>

          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </div>
  );
}
