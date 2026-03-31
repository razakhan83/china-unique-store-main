"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  ImageIcon,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Tag,
  Trash2,
  Trophy,
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
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CLOUDINARY_IMAGE_PRESETS, optimizeCloudinaryUrl } from "@/lib/cloudinaryImage";
import { uploadImageDataUrl } from "@/lib/cloudinaryUpload";
import { getBlurPlaceholderProps } from "@/lib/imagePlaceholder";
import { cn } from "@/lib/utils";

const MARKETING_SECTION_ITEMS = [
  { _id: "special-offers", name: "Special Offer", slug: "special-offers", icon: Tag },
  { _id: "new-arrivals", name: "New Arrivals", slug: "new-arrivals", icon: Sparkles },
  { _id: "best-selling", name: "Best Selling", slug: "best-selling", icon: Trophy },
];

function sanitizeSectionOrder(order, fallbackOrder = []) {
  return Array.from(new Set([...(Array.isArray(order) ? order : []), ...fallbackOrder].filter(Boolean)));
}

function SortableCategoryCard({ category, index, onEdit, onDelete, onToggleEnabled, onToggleHome }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.sectionKey });
  const Icon = category.icon || ImageIcon;
  const isVirtualSection = category.sectionType === "marketing";

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "surface-card flex items-center gap-4 rounded-2xl p-4 shadow-[0_18px_40px_rgba(10,61,46,0.07)] transition-shadow",
        isDragging && "z-10 shadow-[0_22px_60px_rgba(10,61,46,0.18)]",
      )}
    >
      <button
        type="button"
        className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/35 text-muted-foreground transition-colors hover:text-foreground"
        aria-label={`Reorder ${category.name}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted/35">
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
          <Icon className="size-5 text-muted-foreground" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{category.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">{category.slug}</p>
      </div>

      <div className="text-right">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Position
        </p>
        <p className="mt-1 text-sm font-semibold text-primary">{index + 1}</p>
      </div>

      {/* Home On/Off toggle */}
      {!isVirtualSection && category.slug !== "special-offers" ? (
        <div className="flex flex-col items-end gap-1 pr-1">
          <span className={cn(
            "text-[9px] font-black uppercase tracking-widest",
            category.showOnHome !== false ? "text-primary" : "text-muted-foreground/60"
          )}>
            {category.showOnHome !== false ? "Home On" : "Home Off"}
          </span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleHome?.(category._id, category.showOnHome !== false);
            }}
            className={cn(
              "relative h-5 w-9 rounded-full transition-colors duration-300",
              category.showOnHome !== false ? "bg-primary" : "bg-muted-foreground/30"
            )}
          >
            <span className={cn(
              "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-300 shadow-sm",
              category.showOnHome !== false ? "translate-x-4" : "translate-x-0"
            )} />
          </button>
        </div>
      ) : (
        <div className="flex w-20 flex-col items-end gap-1 pr-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-primary">
            Fixed On
          </span>
          <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            Home
          </span>
        </div>
      )}

      {/* Three-dot actions dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl shrink-0"
            aria-label="Category actions"
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!isVirtualSection ? (
            <DropdownMenuItem onClick={() => onEdit?.(category)}>
              <Pencil className="mr-2 size-4" />
              Edit
            </DropdownMenuItem>
          ) : null}
          {!isVirtualSection && category.slug !== "special-offers" && (
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              onClick={() => onDelete(category)}
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function AdminCategoriesClient() {
  const [categories, setCategories] = useState([]);
  const [sectionOrder, setSectionOrder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newImage, setNewImage] = useState("");
  const [deleteModal, setDeleteModal] = useState({ open: false, category: null });
  const [deleting, setDeleting] = useState(false);

  // Edit State
  const [editModal, setEditModal] = useState({ open: false, category: null });
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editIsEnabled, setEditIsEnabled] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

const orderedSections = useMemo(() => {
    const marketingIds = new Set(MARKETING_SECTION_ITEMS.map((item) => item.slug));
    const categoryItems = categories
      .filter((category) => !marketingIds.has(category.slug))
      .map((category) => ({
        ...category,
        sectionType: "category",
        icon: null,
        sectionKey: category.slug,
      }));
    const sectionMap = new Map([
      ...MARKETING_SECTION_ITEMS.map((item) => [item.slug, { ...item, sectionType: "marketing", image: "", sectionKey: item.slug }]),
      ...categoryItems.map((item) => [item.sectionKey, item]),
    ]);
    const fallbackOrder = [
      ...MARKETING_SECTION_ITEMS.map((item) => item.slug),
      ...categoryItems.map((item) => item.sectionKey),
    ];
    const finalOrder = sanitizeSectionOrder(sectionOrder, fallbackOrder);

    return finalOrder.map((id) => sectionMap.get(id)).filter(Boolean);
  }, [categories, sectionOrder]);

  const categoryIds = useMemo(() => orderedSections.map((category) => category.sectionKey), [orderedSections]);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      setLoading(true);
      const [response, settingsResponse] = await Promise.all([
        fetch("/api/categories", { cache: "no-store" }),
        fetch("/api/settings", { cache: "no-store" }),
      ]);
      const data = await response.json();
      const settingsData = await settingsResponse.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch categories");
      }

      setCategories(
        data.data.map((category, index) => ({
          _id: category._id,
          name: category.name,
          slug: category.slug,
          image: category.image || "",
          imagePublicId: category.imagePublicId || "",
          blurDataURL: category.blurDataURL || "",
          sortOrder: Number(category.sortOrder ?? index) || 0,
          isEnabled: category.isEnabled !== false,
          showOnHome: category.showOnHome !== false,
        })),
      );
      setSectionOrder(
        settingsData.success
          ? sanitizeSectionOrder(settingsData.data?.homepageSectionOrder)
          : []
      );
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSectionOrder((current) => {
      const baseOrder = sanitizeSectionOrder(
        current.length > 0 ? current : orderedSections.map((item) => item.sectionKey)
      );
      const oldIndex = baseOrder.findIndex((item) => item === active.id);
      const newIndex = baseOrder.findIndex((item) => item === over.id);
      return arrayMove(baseOrder, oldIndex, newIndex);
    });
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
      setCategories((current) =>
        [...current, {
          _id: data.data._id,
          name: data.data.name,
          slug: data.data.slug,
          image: data.data.image || "",
          imagePublicId: data.data.imagePublicId || "",
          blurDataURL: data.data.blurDataURL || "",
          sortOrder: Number(data.data.sortOrder ?? current.length) || current.length,
          isEnabled: data.data.isEnabled !== false,
          showOnHome: data.data.showOnHome !== false,
        }].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
      );
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
      let isNewImage = editImage && editImage !== editModal.category.image;

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
          isEnabled: editIsEnabled, // Include isEnabled in the update
          ...(isNewImage && { imageDataUrl: editImage }),
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update category");
      }

      toast.success(`Category "${editName.trim()}" updated`);
      
      setCategories((current) =>
        current.map((cat) => (cat._id === editModal.category._id ? {
          ...cat,
          name: data.data.name,
          slug: data.data.slug,
          image: data.data.image,
          imagePublicId: data.data.imagePublicId,
          blurDataURL: data.data.blurDataURL,
          isEnabled: data.data.isEnabled,
          showOnHome: data.data.showOnHome !== false,
        } : cat))
      );
      
      setEditModal({ open: false, category: null });
      setEditName("");
      setEditImage("");
      setEditIsEnabled(true); // Reset isEnabled state
    } catch (error) {
      toast.error(error.message || "Failed to update category");
    } finally {
      setEditing(false);
    }
  }

  async function handleSaveOrder() {
    setSaving(true);
    try {
      const response = await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: orderedSections
            .filter((category) => category.sectionType === "category")
            .map((category, index) => ({
            _id: category._id,
            sortOrder: index,
          })),
        }),
      });
      const settingsResponse = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homepageSectionOrder: sanitizeSectionOrder(orderedSections.map((item) => item.sectionKey)),
        }),
      });

      const data = await response.json();
      const settingsData = await settingsResponse.json();
      if (!data.success || !settingsData.success) {
        throw new Error(data.error || "Failed to save category order");
      }

      toast.success("Homepage section order saved.");
      setCategories(
        (data.data || []).map((category, index) => ({
          _id: category._id,
          name: category.name,
          slug: category.slug,
          image: category.image || "",
          imagePublicId: category.imagePublicId || "",
          blurDataURL: category.blurDataURL || "",
          sortOrder: Number(category.sortOrder ?? index) || 0,
          isEnabled: category.isEnabled ?? true,
          showOnHome: category.showOnHome !== false,
        })),
      );
      setSectionOrder(
        sanitizeSectionOrder(
          Array.isArray(settingsData.data?.homepageSectionOrder)
            ? settingsData.data.homepageSectionOrder
            : orderedSections.map((item) => item.sectionKey)
        )
      );
    } catch (error) {
      toast.error(error.message || "Failed to save category order");
    } finally {
      setSaving(false);
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

  const toggleCategoryEnabled = async (categoryId, currentStatus) => {
    const originalCategories = [...categories];
    const newStatus = !currentStatus;
    try {
      setCategories(prev => prev.map(c => c._id === categoryId ? { ...c, isEnabled: newStatus } : c));
      
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      toast.success(newStatus ? 'Category enabled' : 'Category disabled');
    } catch (err) {
      setCategories(originalCategories);
      toast.error('Failed to update category visibility');
    }
  };

  const toggleCategoryHome = async (categoryId, currentStatus) => {
    const originalCategories = [...categories];
    const nextStatus = !currentStatus;

    try {
      setCategories((prev) =>
        prev.map((category) => (
          category._id === categoryId ? { ...category, showOnHome: nextStatus } : category
        ))
      );

      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showOnHome: nextStatus, ...(nextStatus ? { isEnabled: true } : {}) }),
      });

      if (!response.ok) throw new Error('Failed to update home visibility');
      if (nextStatus) {
        setCategories((prev) =>
          prev.map((category) => (
            category._id === categoryId ? { ...category, isEnabled: true, showOnHome: nextStatus } : category
          ))
        );
      }
      toast.success(nextStatus ? 'Category shown on home' : 'Category hidden from home');
    } catch (error) {
      setCategories(originalCategories);
      toast.error('Failed to update home visibility');
    }
  };

  return (
    <div className="max-w-4xl pb-24 md:pb-0">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Categories</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a category image, then drag homepage sections into the order you want them to appear.
          Special Offer, New Arrivals, Best Selling, and your category sections all use this same sequence.
        </p>
      </div>

      <form onSubmit={handleAddCategory} className="surface-card mb-6 rounded-2xl p-5 md:p-6">
        <div className="grid gap-5 md:grid-cols-[1fr_auto]">
          <div className="space-y-4">
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
                  <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-border">
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
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/25 text-muted-foreground">
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

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="surface-card h-24 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : orderedSections.length === 0 ? (
        <div className="surface-card rounded-2xl p-12 text-center">
          <p className="font-medium text-muted-foreground">No categories yet. Add your first category above.</p>
        </div>
      ) : (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={categoryIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {orderedSections.map((category, index) => (
                  <SortableCategoryCard
                    key={category.sectionKey}
                    category={category}
                    index={index}
                    onEdit={openEditModal}
                    onDelete={(selectedCategory) =>
                      setDeleteModal({ open: true, category: selectedCategory })
                    }
                    onToggleEnabled={toggleCategoryEnabled}
                    onToggleHome={toggleCategoryHome}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button onClick={handleSaveOrder} disabled={saving} className="rounded-xl">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {saving ? "Saving..." : "Save Category Order"}
            </Button>
            <p className="text-xs text-muted-foreground">
              This order controls all homepage product sections, including Special Offer, New Arrivals, and Best Selling.
            </p>
          </div>
        </>
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
            <AlertDialogCancel className={cn(buttonVariants({ variant: "outline" }))} onClick={() => setDeleteModal({ open: false, category: null })}>
              Cancel
            </AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Category"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Category Modal */}
      <AlertDialog
        open={editModal.open}
        onOpenChange={(open) => {
          setEditModal((current) => ({ ...current, open }));
          if (!open) {
            setEditName("");
            setEditImage("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Category</AlertDialogTitle>
            <AlertDialogDescription>
              Update the name or image for this category.
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
                  <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-border">
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
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/25 text-muted-foreground">
                    <ImageIcon className="size-5" />
                  </div>
                )}
              </div>
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
