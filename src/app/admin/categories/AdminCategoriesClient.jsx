"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ImageIcon,
  Loader2,
  MoreVertical,
  Package2,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CLOUDINARY_IMAGE_PRESETS, optimizeCloudinaryUrl } from "@/lib/cloudinaryImage";
import { uploadImageDataUrl } from "@/lib/cloudinaryUpload";
import { getBlurPlaceholderProps } from "@/lib/imagePlaceholder";
import { cn } from "@/lib/utils";

function mapCategory(category, index = 0) {
  return {
    _id: category._id,
    name: category.name,
    slug: category.slug,
    image: category.image || "",
    imagePublicId: category.imagePublicId || "",
    blurDataURL: category.blurDataURL || "",
    sortOrder: Number(category.sortOrder ?? index) || 0,
    isEnabled: category.isEnabled !== false,
    productCount: Number(category.productCount || 0),
  };
}

function CategoryCard({ category, onEdit, onDelete, onToggleEnabled }) {
  return (
    <div
      className="surface-card flex items-center gap-4 rounded-2xl p-4 shadow-[0_18px_40px_rgba(0,0,0,0.07)]"
    >
      <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted/35">
        {category.image ? (
          <Image
            src={optimizeCloudinaryUrl(category.image, CLOUDINARY_IMAGE_PRESETS.adminThumb)}
            alt={category.name}
            fill
            sizes="64px"
            className="object-cover"
            {...getBlurPlaceholderProps(category.blurDataURL)}
          />
        ) : (
          <ImageIcon className="size-5 text-muted-foreground" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{category.name}</p>
          <Badge variant="secondary" className="rounded-full">
            {category.productCount} {category.productCount === 1 ? "product" : "products"}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{category.slug}</p>
      </div>

      <div className="hidden text-right md:block">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Products
        </p>
                          <p className="mt-1 text-sm font-semibold text-foreground">{category.productCount}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end gap-1">
          <span className={cn(
            "text-[10px] font-semibold uppercase tracking-[0.16em]",
                            category.isEnabled ? "text-foreground" : "text-muted-foreground",
          )}>
            {category.isEnabled ? "Live" : "Hidden"}
          </span>
          <Switch
            checked={category.isEnabled !== false}
            onCheckedChange={() => onToggleEnabled(category._id, category.isEnabled !== false)}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-xl"
              aria-label="Category actions"
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => onEdit?.(category)}>
                <Pencil />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={() => onDelete(category)}
              >
                <Trash2 />
                Delete
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function AdminCategoriesClient() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newImage, setNewImage] = useState("");
  const [deleteModal, setDeleteModal] = useState({ open: false, category: null });
  const [deleting, setDeleting] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, category: null });
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editIsEnabled, setEditIsEnabled] = useState(true);

  const orderedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );

  const liveCategoryCount = useMemo(
    () => categories.filter((category) => category.isEnabled !== false).length,
    [categories],
  );
  const totalProductCount = useMemo(
    () => categories.reduce((total, category) => total + Number(category.productCount || 0), 0),
    [categories],
  );

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      setLoading(true);
      const response = await fetch("/api/categories", { cache: "no-store" });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch categories");
      }

      setCategories(
        (data.data || [])
          .filter((category) => category.slug !== "special-offers")
          .map((category, index) => mapCategory(category, index)),
      );
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  function handleImageSelect(event) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => setNewImage(/** @type {string} */ (loadEvent.target?.result) || "");
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  async function handleAddCategory(event) {
    event.preventDefault();
    if (!newName.trim()) return;

    setAdding(true);
    try {
      let uploadedImage = "";
      let uploadedPublicId = "";
      let uploadedBlurDataURL = "";

      if (newImage) {
        const upload = await uploadImageDataUrl(newImage, "kifayatly_categories");
        uploadedImage = upload.url;
        uploadedPublicId = upload.publicId;
        uploadedBlurDataURL = upload.blurDataURL;
      }

      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          image: uploadedImage,
          imagePublicId: uploadedPublicId,
          blurDataURL: uploadedBlurDataURL,
          imageDataUrl: newImage || "",
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to create category");
      }

      toast.success(`Category "${newName.trim()}" created`);
      setNewName("");
      setNewImage("");
      setCategories((current) => [
        ...current,
        mapCategory({ ...data.data, productCount: 0 }, current.length),
      ]);
    } catch (error) {
      toast.error(error.message || "Failed to create category");
    } finally {
      setAdding(false);
    }
  }

  function handleEditImageSelect(event) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => setEditImage(/** @type {string} */ (loadEvent.target?.result) || "");
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function openEditModal(category) {
    setEditName(category.name);
    setEditImage(category.image || "");
    setEditIsEnabled(category.isEnabled !== false);
    setEditModal({ open: true, category });
  }

  async function handleEditCategory(event) {
    event.preventDefault();
    if (!editName.trim() || !editModal.category) return;

    setEditing(true);
    try {
      let uploadedImage = editModal.category.image || "";
      let uploadedPublicId = editModal.category.imagePublicId || "";
      let uploadedBlurDataURL = editModal.category.blurDataURL || "";
      const isNewImage = editImage && editImage !== editModal.category.image;

      if (isNewImage) {
        const upload = await uploadImageDataUrl(editImage, "kifayatly_categories");
        uploadedImage = upload.url;
        uploadedPublicId = upload.publicId;
        uploadedBlurDataURL = upload.blurDataURL;
      }

      const response = await fetch(`/api/categories/${editModal.category._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          image: uploadedImage,
          imagePublicId: uploadedPublicId,
          blurDataURL: uploadedBlurDataURL,
          isEnabled: editIsEnabled,
          ...(isNewImage && { imageDataUrl: editImage }),
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update category");
      }

      toast.success(`Category "${editName.trim()}" updated`);
      setCategories((current) =>
        current.map((category) => (
          category._id === editModal.category._id
            ? {
                ...category,
                ...mapCategory({ ...data.data, productCount: category.productCount }, category.sortOrder),
              }
            : category
        )),
      );
      setEditModal({ open: false, category: null });
      setEditName("");
      setEditImage("");
      setEditIsEnabled(true);
    } catch (error) {
      toast.error(error.message || "Failed to update category");
    } finally {
      setEditing(false);
    }
  }

  async function handleDelete() {
    if (!deleteModal.category) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/categories?id=${deleteModal.category._id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to delete category");
      }

      toast.success(`Category "${deleteModal.category.name}" deleted`);
      setCategories((current) =>
        current
          .filter((category) => category._id !== deleteModal.category._id)
          .map((category, index) => ({ ...category, sortOrder: index })),
      );
      setDeleteModal({ open: false, category: null });
    } catch (error) {
      toast.error(error.message || "Failed to delete category");
    } finally {
      setDeleting(false);
    }
  }

  async function toggleCategoryEnabled(categoryId, currentStatus) {
    const originalCategories = [...categories];
    const newStatus = !currentStatus;

    try {
      setCategories((prev) =>
        prev.map((category) => (
          category._id === categoryId ? { ...category, isEnabled: newStatus } : category
        )),
      );

      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      toast.success(newStatus ? "Category enabled" : "Category hidden");
    } catch (error) {
      setCategories(originalCategories);
      toast.error("Failed to update category visibility");
    }
  }

  return (
    <div className="max-w-4xl pb-24 md:pb-0">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Categories</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add categories, update images, and see how many products are assigned to each one.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {liveCategoryCount} live
          </Badge>
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {totalProductCount} products listed
          </Badge>
        </div>
      </div>

      <form onSubmit={handleAddCategory} className="surface-card mb-6 rounded-2xl p-5 md:p-6">
        <div className="grid gap-5 md:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-4">
            <div>
              <Label className="mb-2">Category Name</Label>
              <Input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="e.g. Kitchen Accessories"
              />
            </div>

            <div>
              <Label className="mb-2">Category Image</Label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
                  <Upload className="size-4" />
                  Upload image
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                </label>
                {newImage ? (
                  <div className="relative size-16 overflow-hidden rounded-2xl border border-border">
                    <Image
                      src={newImage}
                      alt="New category preview"
                      fill
                      sizes="64px"
                      className="object-cover"
                      {...getBlurPlaceholderProps()}
                    />
                  </div>
                ) : (
                  <div className="flex size-16 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/25 text-muted-foreground">
                    <ImageIcon className="size-5" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-end">
            <Button type="submit" disabled={adding || !newName.trim()} className="w-full rounded-xl md:w-auto">
              {adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Add Category
            </Button>
          </div>
        </div>
      </form>

      <div className="surface-card mb-6 rounded-2xl border border-border/70 p-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            <Package2 />
            Product counts
          </Badge>
          <span>Category order is automatic. Use Home Page Settings for storefront section layout.</span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="surface-card h-24 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : orderedCategories.length === 0 ? (
        <div className="surface-card rounded-2xl p-12 text-center">
          <p className="font-medium text-muted-foreground">No categories yet. Add your first category above.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orderedCategories.map((category) => (
            <CategoryCard
              key={category._id}
              category={category}
              onEdit={openEditModal}
              onDelete={(selectedCategory) => setDeleteModal({ open: true, category: selectedCategory })}
              onToggleEnabled={toggleCategoryEnabled}
            />
          ))}
        </div>
      )}

      <AlertDialog
        open={deleteModal.open}
        onOpenChange={(open) => setDeleteModal((current) => ({ ...current, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="font-semibold text-foreground">{deleteModal.category?.name}</span>.
              Products assigned to this category will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={cn(buttonVariants({ variant: "outline" }))}
              onClick={() => setDeleteModal({ open: false, category: null })}
            >
              Cancel
            </AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Category"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={editModal.open}
        onOpenChange={(open) => {
          setEditModal((current) => ({ ...current, open }));
          if (!open) {
            setEditName("");
            setEditImage("");
            setEditIsEnabled(true);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Category</AlertDialogTitle>
            <AlertDialogDescription>
              Update the name, image, or visibility for this category.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div>
              <Label className="mb-2">Category Name</Label>
              <Input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                placeholder="e.g. Kitchen Accessories"
              />
            </div>
            <div>
              <Label className="mb-2">Category Image</Label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
                  <Upload className="size-4" />
                  Upload new image
                  <input type="file" accept="image/*" className="hidden" onChange={handleEditImageSelect} />
                </label>
                {editImage ? (
                  <div className="relative size-16 overflow-hidden rounded-2xl border border-border">
                    <Image
                      src={editImage}
                      alt="Category preview"
                      fill
                      sizes="64px"
                      className="object-cover"
                      {...getBlurPlaceholderProps()}
                    />
                  </div>
                ) : (
                  <div className="flex size-16 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/25 text-muted-foreground">
                    <ImageIcon className="size-5" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/20 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Category visible</p>
                <p className="text-xs text-muted-foreground">Hidden categories stay out of storefront lists.</p>
              </div>
              <Switch checked={editIsEnabled} onCheckedChange={setEditIsEnabled} />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className={cn(buttonVariants({ variant: "outline" }))} disabled={editing}>
              Cancel
            </AlertDialogCancel>
            <Button onClick={handleEditCategory} disabled={editing || !editName.trim()}>
              {editing ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              {editing ? "Saving..." : "Save Changes"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
