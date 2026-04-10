"use client";

import Image from "next/image";
import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CloudUpload,
  Loader2,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { uploadImageDataUrl } from "@/lib/cloudinaryUpload";
import { moveProductImageToFront } from "@/lib/productImages";
import { getBlurPlaceholderProps } from "@/lib/imagePlaceholder";
import { formatSeoKeywords } from "@/lib/seoKeywords";
import { cn } from "@/lib/utils";

const selectionChipClass = (selected) =>
  cn(
    "inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
    selected
      ? "border-primary bg-primary text-primary-foreground shadow-[0_12px_30px_rgba(10,61,46,0.14)]"
      : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"
  );

const uploadActionClass =
  "relative overflow-hidden inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

export default function AddProduct() {
  const router = useRouter();

  const [Name, setName] = useState("");
  const [Description, setDescription] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [seoCanonicalUrl, setSeoCanonicalUrl] = useState("");
  const [Price, setPrice] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [stockQuantity, setStockQuantity] = useState("1");
  const [stockStatus, setStockStatus] = useState("In Stock");
  const [Categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [isLive, setIsLive] = useState(true);
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [isBestSelling, setIsBestSelling] = useState(false);

  const [isDragOver, setIsDragOver] = useState(false);
  const [allCategories, setAllCategories] = useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatImage, setNewCatImage] = useState("");
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const seoGenerationLockRef = useRef(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (data.success) setAllCategories(data.data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };

    fetchCategories();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsAddingCat(true);

    try {
      let uploadedCategoryImage = "";
      let uploadedCategoryImagePublicId = "";
      let uploadedCategoryBlurDataURL = "";

      if (newCatImage) {
        const uploaded = await uploadImageDataUrl(
          newCatImage,
          "kifayatly_categories"
        );
        uploadedCategoryImage = uploaded.url;
        uploadedCategoryImagePublicId = uploaded.publicId;
        uploadedCategoryBlurDataURL = uploaded.blurDataURL;
      }

      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatName.trim(),
          image: uploadedCategoryImage,
          imagePublicId: uploadedCategoryImagePublicId,
          blurDataURL: uploadedCategoryBlurDataURL,
          imageDataUrl: newCatImage || "",
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Category added!");
        setNewCatName("");
        setNewCatImage("");
        setIsCategoryModalOpen(false);
        const refreshRes = await fetch("/api/categories");
        const refreshData = await refreshRes.json();
        if (refreshData.success) setAllCategories(refreshData.data);
      } else {
        toast.error(data.error || "Failed to add category");
      }
    } catch {
      toast.error("Error adding category");
    } finally {
      setIsAddingCat(false);
    }
  };

  const handleCategoryImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => setNewCatImage(ev.target?.result || "");
    reader.readAsDataURL(file);
  };

  const toggleCategory = (categoryId) => {
    setCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const processFiles = (filesList) => {
    const validFiles = Array.from(filesList).filter((f) =>
      f.type.startsWith("image/")
    );
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImages((prev) => [...prev, { url: ev.target.result, file }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    processFiles(e.dataTransfer.files);
  }, []);

  const handleFileSelect = (e) => {
    processFiles(e.target.files);
    e.target.value = null;
  };

  const removeImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const makeImagePrimary = (indexToMove) => {
    setImages((prev) => moveProductImageToFront(prev, indexToMove));
  };

  const selectedCategoryNames = allCategories
    .filter((category) => Categories.includes(category._id))
    .map((category) => category.name)
    .filter(Boolean);
  const seoCategoryLabel = selectedCategoryNames.join(", ");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!Name || !Price || Categories.length === 0 || images.length === 0) {
      toast.error("Name, Price, Category and at least one Image are required.");
      return;
    }

    setSaving(true);
    const finalImages = [];

    try {
      for (const img of images) {
        const uploaded = await uploadImageDataUrl(
          img.url,
          "kifayatly_products"
        );
        finalImages.push(uploaded);
      }
    } catch {
      toast.error("Image upload failed");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Name,
          Description,
          seoTitle,
          seoDescription,
          seoKeywords,
          seoCanonicalUrl,
          Price: Number(Price),
          discountPercentage: Number(discountPercentage) || 0,
          stockQuantity: Math.max(0, Number(stockQuantity) || 0),
          StockStatus: stockStatus,
          Images: finalImages,
          Category: Categories,
          isLive,
          isNewArrival,
          isBestSelling,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Product created!");
        router.push("/admin/products");
      } else {
        toast.error(data.message || data.error || "Failed to create product");
      }
    } catch {
      toast.error("Network error while saving.");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateSeo = async () => {
    if (seoGenerationLockRef.current) {
      return;
    }

    const title = Name.trim();
    const description = Description.trim();

    if (!title || !description) {
      toast.error("Add the product name and description before generating SEO.");
      return;
    }

    seoGenerationLockRef.current = true;
    setIsGeneratingSeo(true);

    try {
      const res = await fetch("/api/admin/generate-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category: seoCategoryLabel,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.message || data.error || "Failed to generate SEO content."
        );
      }

      setSeoTitle(data.data.seoTitle || "");
      setSeoDescription(data.data.seoDescription || "");
      setSeoKeywords(formatSeoKeywords(data.data.seoKeywords || data.data.keywords));
      toast.success("SEO fields populated with AI suggestions.");
    } catch (error) {
      toast.error(error.message || "Failed to generate SEO content.");
    } finally {
      seoGenerationLockRef.current = false;
      setIsGeneratingSeo(false);
    }
  };

  const trimmedSeoTitle = seoTitle.trim();
  const trimmedSeoDescription = seoDescription.trim();
  const trimmedSeoKeywords = seoKeywords.trim();
  const trimmedSeoCanonicalUrl = seoCanonicalUrl.trim();
  const fallbackSlug = Name.trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const seoPreviewTitle = trimmedSeoTitle || Name || "Product title preview";
  const seoPreviewDescription =
    trimmedSeoDescription ||
    Description ||
    "Add a focused product summary so search snippets look polished from day one.";
  const seoPreviewUrl =
    trimmedSeoCanonicalUrl ||
    `https://china-unique-items.vercel.app/products/${fallbackSlug || "your-product"}`;
  const seoChecks = [
    { label: "SEO title", complete: trimmedSeoTitle.length >= 10 },
    { label: "Meta description", complete: trimmedSeoDescription.length >= 50 },
    { label: "Keywords", complete: trimmedSeoKeywords.length > 0 },
  ];
  const seoCompleteCount = seoChecks.filter((item) => item.complete).length;
  const seoReady = seoCompleteCount === seoChecks.length;
  const priceValue = Number(Price) || 0;
  const discountValue = Math.min(
    100,
    Math.max(0, Number(discountPercentage) || 0)
  );
  const discountedPreview =
    discountValue > 0
      ? Math.round(priceValue * (1 - discountValue / 100))
      : priceValue;

  return (
    <div className="w-full pb-10">
      <div className="mb-6 flex items-center gap-4 md:mb-8">
        <Link
          href="/admin/products"
          className={cn(
            buttonVariants({ variant: "outline", size: "icon-sm" }),
            "rounded-xl"
          )}
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
            Add New Product
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a launch-ready product with pricing, inventory, and SEO in one pass.
          </p>
        </div>
      </div>

      <div className="surface-card max-w-2xl rounded-xl p-4 shadow-lg md:p-8">
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div>
            <Label className="mb-2">Product Name</Label>
            <Input
              type="text"
              value={Name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 px-4"
              placeholder="e.g., Luxury Tea Set"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="mb-2">Price (Rs)</Label>
              <Input
                type="number"
                value={Price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-11 px-4"
                placeholder="0.00"
                step="0.01"
                required
              />
            </div>

            <div>
              <Label className="mb-2">Discount Percentage</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="1"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(e.target.value)}
                className="h-11 px-4"
                placeholder="0"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/35 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Pricing Preview
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <p className="text-sm text-muted-foreground">
                Base price
                <span className="mt-1 block font-semibold text-foreground">
                  Rs {priceValue || 0}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                Discount
                <span className="mt-1 block font-semibold text-foreground">
                  {discountValue}%
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                Customer pays
                <span className="mt-1 block text-base font-semibold text-primary">
                  Rs {discountedPreview || 0}
                </span>
              </p>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Categories</Label>
              <Link
                href="/admin/categories"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
              >
                <PlusCircle className="size-3.5" /> Manage Categories
              </Link>
            </div>
            <div className="flex min-h-[52px] flex-wrap gap-2 rounded-xl border border-border bg-muted/35 p-3">
              {allCategories.length === 0 ? (
                <p className="self-center text-xs text-muted-foreground">
                  No categories found. Add one.
                </p>
              ) : (
                allCategories.map((cat) => {
                  const selected = Categories.includes(cat._id);
                  return (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() => toggleCategory(cat._id)}
                      className={selectionChipClass(selected)}
                    >
                      {selected && <Check className="mr-1 size-3" />}
                      {cat.name}
                    </button>
                  );
                })
              )}
            </div>
            {Categories.length === 0 && (
              <p className="mt-1 text-xs text-destructive/80">
                Please select at least one category.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-border bg-muted/35 p-4 space-y-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Inventory</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Set launch stock and storefront availability before publishing.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="mb-2">Stock Quantity</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="h-11 px-4"
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="mb-2">Stock Status</Label>
                <Select value={stockStatus} onValueChange={setStockStatus}>
                  <SelectTrigger className="h-11 w-full px-4">
                    <SelectValue placeholder="Select stock status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In Stock">In Stock</SelectItem>
                    <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/35 p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Visibility</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isLive
                  ? "Live and visible to customers immediately."
                  : "Saved as draft and hidden from the storefront."}
              </p>
            </div>
            <Switch checked={isLive} onCheckedChange={setIsLive} />
          </div>

          <div className="rounded-xl border border-border bg-muted/35 p-4 space-y-4">
            <p className="text-sm font-semibold text-foreground">Marketing Flags</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-4 sm:border-0 sm:pb-0">
                <Label
                  className="mr-2 cursor-pointer text-xs text-muted-foreground"
                  htmlFor="toggle-new"
                >
                  New Arrival
                </Label>
                <Switch id="toggle-new" checked={isNewArrival} onCheckedChange={setIsNewArrival} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label
                  className="mr-2 cursor-pointer text-xs text-muted-foreground"
                  htmlFor="toggle-best"
                >
                  Best Selling
                </Label>
                <Switch id="toggle-best" checked={isBestSelling} onCheckedChange={setIsBestSelling} />
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Product Images</Label>
              <div className={uploadActionClass}>
                <PlusCircle className="size-3.5" /> Add Images
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted/40"
                >
                  <Image
                    src={img.url}
                    alt="Preview"
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover"
                    {...getBlurPlaceholderProps(img.blurDataURL)}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background/95 text-destructive shadow-sm opacity-0 transition-all hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                  {idx !== 0 ? (
                    <button
                      type="button"
                      onClick={() => makeImagePrimary(idx)}
                      className="absolute bottom-2 left-2 rounded-md border border-border bg-background/95 px-2 py-1 text-[10px] font-bold text-foreground shadow-sm opacity-0 transition-all hover:border-primary hover:text-primary group-hover:opacity-100"
                    >
                      Set Main
                    </button>
                  ) : (
                    <span className="absolute bottom-2 left-2 rounded-md bg-foreground/80 px-2 py-0.5 text-[10px] font-bold text-background shadow-sm">
                      Main Image
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200",
                isDragOver
                  ? "border-primary bg-primary/8"
                  : "border-border bg-muted/20 hover:border-primary/35 hover:bg-muted/35"
              )}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <div className="space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CloudUpload className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Drag & Drop Images Here
                  </p>
                  <p className="text-xs text-muted-foreground">
                    or click to browse multiple files
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    PNG, JPG up to 10MB each. Use &quot;Set Main&quot; to control the hero image.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label className="mb-2">Description</Label>
            <Textarea
              value={Description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-28 resize-none px-4 py-3"
              placeholder="Enter product description..."
              rows="4"
            />
          </div>

          <div className="space-y-4 rounded-xl border border-border bg-muted/35 p-4 md:p-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">SEO & Metadata</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Set search-facing copy during creation so each product launches ready for discovery.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isGeneratingSeo}
                  onClick={handleGenerateSeo}
                  className="rounded-full"
                >
                  {isGeneratingSeo ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "✨ AI Auto-SEO"
                  )}
                </Button>
                <div
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                    seoReady
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  )}
                >
                  <Check
                    className={cn(
                      "size-3.5",
                      seoReady ? "text-emerald-600" : "text-amber-600"
                    )}
                  />
                  {seoReady
                    ? "SEO basics complete"
                    : `${seoCompleteCount}/${seoChecks.length} SEO basics complete`}
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <Label className="mb-2">SEO Title</Label>
                <Input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="h-11 px-4"
                  placeholder="Custom search title for this product"
                  maxLength={70}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {seoTitle.length}/70 characters
                </p>
              </div>

              <div>
                <Label className="mb-2">Meta Description</Label>
                <Textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  className="min-h-24 resize-none px-4 py-3"
                  placeholder="Short product summary for search engines and social previews"
                  rows="3"
                  maxLength={320}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {seoDescription.length}/320 characters
                </p>
              </div>

              <div>
                <Label className="mb-2">Keywords</Label>
                <Input
                  type="text"
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(formatSeoKeywords(e.target.value))}
                  className="h-11 px-4"
                  placeholder="e.g., tea set, chinese tea cups, luxury gift"
                />
              </div>

              <div>
                <Label className="mb-2">Canonical URL</Label>
                <Input
                  type="url"
                  value={seoCanonicalUrl}
                  onChange={(e) => setSeoCanonicalUrl(e.target.value)}
                  className="h-11 px-4"
                  placeholder="https://china-unique-items.vercel.app/products/your-product"
                />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Search Preview
                </p>
                <div className="mt-3 space-y-1.5">
                  <p className="line-clamp-2 text-base font-semibold text-primary">
                    {seoPreviewTitle}
                  </p>
                  <p className="truncate text-xs text-emerald-700">
                    {seoPreviewUrl}
                  </p>
                  <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {seoPreviewDescription}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Completion Check
                </p>
                <div className="mt-3 space-y-2">
                  {seoChecks.map((item) => (
                    <div
                      key={item.label}
                      className={cn(
                        "flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium",
                        item.complete
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-border bg-muted/40 text-muted-foreground"
                      )}
                    >
                      <span>{item.label}</span>
                      <span className="inline-flex items-center gap-1">
                        <Check
                          className={cn(
                            "size-3.5",
                            item.complete ? "opacity-100" : "opacity-30"
                          )}
                        />
                        {item.complete ? "Ready" : "Missing"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-4 md:mt-8">
            <Button
              type="submit"
              disabled={saving}
              size="lg"
              className="flex-1 rounded-xl font-bold"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Product"
              )}
            </Button>
            <Link href="/admin/products" className="flex-1">
              <Button
                variant="outline"
                size="lg"
                className="w-full rounded-xl font-bold"
                type="button"
              >
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
