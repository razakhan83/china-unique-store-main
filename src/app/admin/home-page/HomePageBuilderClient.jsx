'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Images,
  LayoutGrid,
  Link2,
  Loader2,
  Monitor,
  Plus,
  Save,
  Star,
  Smartphone,
  SquareStack,
  Tag,
  Trash2,
  Upload,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { uploadImageDataUrl } from '@/lib/cloudinaryUpload';
import { getBlurPlaceholderProps } from '@/lib/imagePlaceholder';
import { cn } from '@/lib/utils';

const SECTION_TEMPLATES = [
  {
    type: 'HeroSlider',
    label: 'Hero Slider',
    icon: Images,
  },
  {
    type: 'CategoriesGrid',
    label: 'All Categories',
    icon: LayoutGrid,
  },
  {
    type: 'ProductBanner',
    label: 'Product Banner',
    icon: Monitor,
  },
  {
    type: 'ProductGridByCategory',
    label: 'Category Products',
    icon: SquareStack,
  },
  {
    type: 'ProductCollection',
    collectionKey: 'new-arrivals',
    label: 'New Arrival Products',
    icon: Sparkles,
  },
  {
    type: 'ProductCollection',
    collectionKey: 'special-offers',
    label: 'Special Offer Products',
    icon: Tag,
  },
  {
    type: 'ProductCollection',
    collectionKey: 'top-rated',
    label: 'Top Rated Products',
    icon: Star,
  },
];

function cleanText(value = '') {
  return String(value || '').trim();
}

function createSectionId(type, index) {
  return `${type.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${Date.now()}-${index}`;
}

function createHeroSlide(index = 0) {
  return {
    id: `hero-slide-${Date.now()}-${index}`,
    alt: '',
    link: '',
    desktopImage: null,
    mobileImage: null,
  };
}

function createSection(template, index = 0) {
  const type = template?.type || 'CategoriesGrid';

  if (type === 'HeroSlider') {
    return {
      id: createSectionId(type, index),
      type,
      title: 'Hero Slider',
      description: '',
      isEnabled: true,
      slides: [createHeroSlide(0)],
    };
  }

  if (type === 'CategoriesGrid') {
    return {
      id: createSectionId(type, index),
      type,
      title: 'Shop by Category',
      description: '',
      isEnabled: true,
    };
  }

  if (type === 'ProductBanner') {
    return {
      id: createSectionId(type, index),
      type,
      title: '',
      description: '',
      isEnabled: true,
      desktopImages: [
        { image: null, link: '', alt: '' },
        { image: null, link: '', alt: '' },
      ],
      mobileImage: { image: null, link: '', alt: '' },
    };
  }

  return {
    id: createSectionId(type, index),
    type,
    title: template?.label || '',
    description: '',
    collectionKey: template?.collectionKey || '',
    categoryId: '',
    productLimit: 8,
    isEnabled: true,
  };
}

function normalizeSections(input = []) {
  if (!Array.isArray(input)) return [];

  return input.map((section, index) => ({
    ...section,
    id: cleanText(section.id) || createSectionId(section.type, index),
    title: section.title || '',
    description: section.description || '',
    desktopImages: Array.isArray(section.desktopImages)
      ? [section.desktopImages[0], section.desktopImages[1]].map((item) => ({
          image: item?.image || null,
          link: item?.link || '',
          alt: item?.alt || '',
        }))
      : [
          { image: null, link: '', alt: '' },
          { image: null, link: '', alt: '' },
        ],
    mobileImage: {
      image: section.mobileImage?.image || null,
      link: section.mobileImage?.link || '',
      alt: section.mobileImage?.alt || '',
    },
    collectionKey: section.collectionKey || '',
    categoryId: section.categoryId || '',
    productLimit: Number(section.productLimit || 8),
    isEnabled: section.isEnabled !== false,
    slides: Array.isArray(section.slides)
      ? section.slides.map((slide, slideIndex) => ({
          ...slide,
          id: slide.id || `hero-slide-${index}-${slideIndex}`,
          alt: slide.alt || '',
          link: slide.link || '',
          desktopImage: slide.desktopImage || null,
          mobileImage: slide.mobileImage || null,
        }))
      : [],
  }));
}

function PreviewUploadTile({ label, description, asset, onChange, disabled, ratio = 'landscape' }) {
  return (
    <div className="rounded-2xl border border-border bg-background/75 p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <label
          className={cn(
            'inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted',
            disabled && 'cursor-not-allowed opacity-60',
          )}
        >
          <Upload className="size-3.5" />
          Upload
          <input type="file" accept="image/*" className="hidden" disabled={disabled} onChange={onChange} />
        </label>
      </div>

      <div
        className={cn(
          'relative overflow-hidden rounded-xl border border-border bg-muted/25',
          ratio === 'mobileLandscape' ? 'aspect-[16/9]' : 'aspect-[16/8]',
        )}
      >
        {asset?.url ? (
          <Image
            src={asset.url}
            alt={label}
            fill
            sizes={ratio === 'mobileLandscape' ? '(max-width: 1024px) 100vw, 100vw' : '(max-width: 1024px) 100vw, 50vw'}
            className="object-cover"
            {...getBlurPlaceholderProps(asset.blurDataURL)}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
            Upload an image for this slot.
          </div>
        )}
      </div>
    </div>
  );
}

function SortableSectionCard({
  section,
  index,
  categories,
  uploadingKey,
  isDragPreview = false,
  onDelete,
  onToggleEnabled,
  onSectionChange,
  onSectionImageUpload,
  onAddHeroSlide,
  onHeroSlideChange,
  onHeroSlideImageUpload,
  onRemoveHeroSlide,
  onMoveHeroSlide,
}) {
  const template = SECTION_TEMPLATES.find(
    (item) => item.type === section.type && (!item.collectionKey || item.collectionKey === section.collectionKey),
  ) || SECTION_TEMPLATES.find((item) => item.type === section.type);
  const Icon = template?.icon || SquareStack;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  return (
    <section
      ref={setNodeRef}
      style={isDragPreview ? undefined : { transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'surface-card rounded-3xl border border-border/70 p-5 shadow-[0_18px_40px_rgba(10,61,46,0.08)] transition-[box-shadow,border-color,transform] duration-300',
        (isDragging || isDragPreview) && 'border-primary/45 bg-primary/5 shadow-[0_28px_64px_rgba(10,61,46,0.18)]',
        isDragging && !isDragPreview && 'opacity-60',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            className={cn(
              'flex size-12 items-center justify-center rounded-2xl border bg-background transition-[border-color,background-color,color,box-shadow] duration-300',
              (isDragging || isDragPreview)
                ? 'border-primary/50 bg-primary text-primary-foreground shadow-[0_14px_30px_rgba(10,61,46,0.18)]'
                : 'border-border text-primary hover:border-primary/30 hover:bg-primary/8',
            )}
            aria-label={`Reorder ${template?.label || section.type}`}
            style={{ touchAction: 'none', cursor: isDragPreview ? 'grabbing' : 'grab' }}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-5" />
          </button>
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">{template?.label || section.type}</h3>
              <Badge variant="secondary">Position {index + 1}</Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2">
            <span className="text-xs font-semibold text-muted-foreground">Visible</span>
            <Switch checked={section.isEnabled !== false} onCheckedChange={() => onToggleEnabled(section.id)} />
          </div>
          <Button type="button" variant="outline" size="icon" className="rounded-2xl" onClick={() => onDelete(section.id)}>
            <Trash2 />
          </Button>
        </div>
      </div>

      <Separator className="my-5" />

      <FieldGroup>
        {(section.type === 'CategoriesGrid' || section.type === 'ProductGridByCategory' || section.type === 'ProductBanner' || section.type === 'ProductCollection') && (
          <Field>
            <FieldLabel>Section Title</FieldLabel>
            <Input
              value={section.title || ''}
              onChange={(event) => onSectionChange(section.id, { title: event.target.value })}
              placeholder="Optional heading shown on the storefront"
            />
          </Field>
        )}

        {section.type === 'ProductBanner' && (
          <>
            <Field>
              <FieldLabel>Supporting Copy</FieldLabel>
              <Textarea
                value={section.description || ''}
                onChange={(event) => onSectionChange(section.id, { description: event.target.value })}
                placeholder="Optional short supporting copy"
                rows={3}
              />
            </Field>

            <div className="rounded-[1.75rem] border border-border bg-muted/20 p-4">
              <div className="mb-4">
                <p className="text-sm font-semibold text-foreground">Product Banner Group</p>
                <p className="text-xs text-muted-foreground">
                  Two low-profile desktop banners sit side-by-side on large screens. Smaller screens use one dedicated mobile landscape banner.
                </p>
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                {[0, 1].map((imageIndex) => (
                  <div key={`desktop-banner-${imageIndex}`} className="rounded-2xl border border-border bg-background/80 p-3">
                    <PreviewUploadTile
                      label={`PC Image ${imageIndex + 1}`}
                      description="Landscape image used in the desktop 2-column row."
                      asset={section.desktopImages?.[imageIndex]?.image}
                      disabled={uploadingKey === `${section.id}:desktopImages:${imageIndex}`}
                      onChange={(event) => onSectionImageUpload(section.id, 'desktopImages', event, imageIndex)}
                    />
                    <div className="mt-3 grid gap-3">
                      <Field>
                        <FieldLabel>Target Link</FieldLabel>
                        <Input
                          value={section.desktopImages?.[imageIndex]?.link || ''}
                          onChange={(event) => onSectionChange(section.id, {
                            desktopImages: (section.desktopImages || []).map((item, idx) =>
                              idx === imageIndex ? { ...item, link: event.target.value } : item
                            ),
                          })}
                          placeholder="/products/example"
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Alt Text</FieldLabel>
                        <Input
                          value={section.desktopImages?.[imageIndex]?.alt || ''}
                          onChange={(event) => onSectionChange(section.id, {
                            desktopImages: (section.desktopImages || []).map((item, idx) =>
                              idx === imageIndex ? { ...item, alt: event.target.value } : item
                            ),
                          })}
                          placeholder={`Describe PC image ${imageIndex + 1}`}
                        />
                      </Field>
                    </div>
                  </div>
                ))}

                <div className="rounded-2xl border border-border bg-background/80 p-3">
                  <PreviewUploadTile
                    label="Mobile Image"
                    description="Single landscape image for small and medium screens."
                    asset={section.mobileImage?.image}
                    ratio="mobileLandscape"
                    disabled={uploadingKey === `${section.id}:mobileImage`}
                    onChange={(event) => onSectionImageUpload(section.id, 'mobileImage', event)}
                  />
                  <div className="mt-3 grid gap-3">
                    <Field>
                      <FieldLabel>Target Link</FieldLabel>
                      <Input
                        value={section.mobileImage?.link || ''}
                        onChange={(event) => onSectionChange(section.id, {
                          mobileImage: {
                            ...(section.mobileImage || {}),
                            link: event.target.value,
                          },
                        })}
                        placeholder="/products/example"
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Alt Text</FieldLabel>
                      <Input
                        value={section.mobileImage?.alt || ''}
                        onChange={(event) => onSectionChange(section.id, {
                          mobileImage: {
                            ...(section.mobileImage || {}),
                            alt: event.target.value,
                          },
                        })}
                        placeholder="Describe the mobile banner"
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {section.type === 'ProductGridByCategory' && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel>Category</FieldLabel>
              <Select
                value={section.categoryId || ''}
                onValueChange={(value) => onSectionChange(section.id, { categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Product Limit</FieldLabel>
              <Input
                type="number"
                min="1"
                max="24"
                value={section.productLimit || 8}
                onChange={(event) => onSectionChange(section.id, { productLimit: Number(event.target.value || 8) })}
              />
              <FieldDescription>Top products shown for this category on the home page.</FieldDescription>
            </Field>
          </div>
        )}

        {section.type === 'ProductCollection' && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel>Collection Type</FieldLabel>
              <div className="rounded-2xl border border-border bg-muted/20 px-4 py-3 text-sm font-semibold text-foreground">
                {template?.label || section.collectionKey || 'Product Collection'}
              </div>
              <FieldDescription>
                This block is managed from Home Page Settings and no longer depends on category ordering.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel>Product Limit</FieldLabel>
              <Input
                type="number"
                min="1"
                max="24"
                value={section.productLimit || 8}
                onChange={(event) => onSectionChange(section.id, { productLimit: Number(event.target.value || 8) })}
              />
              <FieldDescription>How many products to show in this homepage block.</FieldDescription>
            </Field>
          </div>
        )}

        {section.type === 'CategoriesGrid' && (
          <Field>
            <FieldDescription>
              This section automatically renders every active category. There is no per-item setup here, so the storefront stays hydration-light.
            </FieldDescription>
          </Field>
        )}

        {section.type === 'HeroSlider' && (
          <div className="rounded-3xl border border-border bg-muted/20 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Slides</p>
                <p className="text-xs text-muted-foreground">Upload desktop and mobile artwork for each hero frame.</p>
              </div>
              <Button type="button" variant="outline" className="rounded-2xl" onClick={() => onAddHeroSlide(section.id)}>
                <Plus data-icon="inline-start" />
                Add Slide
              </Button>
            </div>

            <div className="space-y-4">
              {section.slides?.map((slide, slideIndex) => (
                <div key={slide.id} className="rounded-3xl border border-border bg-background/80 p-4">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Slide {slideIndex + 1}</Badge>
                      <span className="text-xs text-muted-foreground">Hero image pair</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="rounded-2xl"
                        onClick={() => onMoveHeroSlide(section.id, slide.id, -1)}
                        disabled={slideIndex === 0}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="rounded-2xl"
                        onClick={() => onMoveHeroSlide(section.id, slide.id, 1)}
                        disabled={slideIndex === (section.slides?.length || 1) - 1}
                      >
                        <ArrowDown />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="rounded-2xl"
                        onClick={() => onRemoveHeroSlide(section.id, slide.id)}
                        disabled={(section.slides?.length || 0) <= 1}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <PreviewUploadTile
                      label="Desktop Slide"
                      description="Large landscape image for desktop and wide screens."
                      asset={slide.desktopImage}
                      disabled={uploadingKey === `${section.id}:${slide.id}:desktopImage`}
                      onChange={(event) => onHeroSlideImageUpload(section.id, slide.id, 'desktopImage', event)}
                    />
                    <PreviewUploadTile
                      label="Mobile Slide"
                      description="Portrait or narrow image for phones."
                      asset={slide.mobileImage}
                      mobile
                      disabled={uploadingKey === `${section.id}:${slide.id}:mobileImage`}
                      onChange={(event) => onHeroSlideImageUpload(section.id, slide.id, 'mobileImage', event)}
                    />
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel>Alt Text</FieldLabel>
                      <Input
                        value={slide.alt || ''}
                        onChange={(event) => onHeroSlideChange(section.id, slide.id, { alt: event.target.value })}
                        placeholder="Describe the hero frame"
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Optional Link</FieldLabel>
                      <Input
                        value={slide.link || ''}
                        onChange={(event) => onHeroSlideChange(section.id, slide.id, { link: event.target.value })}
                        placeholder="/products/example"
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </FieldGroup>
    </section>
  );
}

export default function HomePageBuilderClient({ initialSections, availableCategories }) {
  const [sections, setSections] = useState(normalizeSections(initialSections));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingKey, setUploadingKey] = useState('');
  const [activeSectionId, setActiveSectionId] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const sectionIds = useMemo(() => sections.map((section) => section.id), [sections]);
  const activeSection = useMemo(
    () => sections.find((section) => section.id === activeSectionId) || null,
    [activeSectionId, sections],
  );
  const uniqueCollectionKeys = useMemo(
    () =>
      new Set(
        sections
          .filter((section) => section.type === 'ProductCollection')
          .map((section) => section.collectionKey)
          .filter(Boolean),
      ),
    [sections],
  );

  function isTemplateAlreadyUsed(template) {
    if (template.type !== 'ProductCollection') return false;
    return uniqueCollectionKeys.has(template.collectionKey);
  }

  function updateSection(sectionId, patch) {
    setSaved(false);
    setSections((current) =>
      current.map((section) => (section.id === sectionId ? { ...section, ...patch } : section)),
    );
  }

  function updateHeroSlides(sectionId, updater) {
    setSaved(false);
    setSections((current) =>
      current.map((section) => {
        if (section.id !== sectionId) return section;

        return {
          ...section,
          slides: updater(Array.isArray(section.slides) ? section.slides : []),
        };
      }),
    );
  }

  function handleAddSection(template) {
    if (isTemplateAlreadyUsed(template)) {
      toast.error(`${template.label} can only be added once.`);
      return;
    }

    setSaved(false);
    setSections((current) => [...current, createSection(template, current.length)]);
  }

  function handleDeleteSection(sectionId) {
    setSaved(false);
    setSections((current) =>
      current
        .filter((section) => section.id !== sectionId)
        .map((section, index) => ({ ...section, order: index })),
    );
  }

  function handleToggleEnabled(sectionId) {
    setSaved(false);
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId ? { ...section, isEnabled: section.isEnabled === false } : section,
      ),
    );
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveSectionId('');
    if (!over || active.id === over.id) return;

    setSaved(false);
    setSections((current) => {
      const oldIndex = current.findIndex((section) => section.id === active.id);
      const newIndex = current.findIndex((section) => section.id === over.id);
      return arrayMove(current, oldIndex, newIndex).map((section, index) => ({ ...section, order: index }));
    });
  }

  function handleDragStart(event) {
    setActiveSectionId(String(event.active?.id || ''));
  }

  function handleDragCancel() {
    setActiveSectionId('');
  }

  function handleAddHeroSlide(sectionId) {
    updateHeroSlides(sectionId, (slides) => [...slides, createHeroSlide(slides.length)]);
  }

  function handleHeroSlideChange(sectionId, slideId, patch) {
    updateHeroSlides(sectionId, (slides) =>
      slides.map((slide) => (slide.id === slideId ? { ...slide, ...patch } : slide)),
    );
  }

  function handleRemoveHeroSlide(sectionId, slideId) {
    updateHeroSlides(sectionId, (slides) => {
      const nextSlides = slides.filter((slide) => slide.id !== slideId);
      return nextSlides.length > 0 ? nextSlides : [createHeroSlide(0)];
    });
  }

  function handleMoveHeroSlide(sectionId, slideId, direction) {
    updateHeroSlides(sectionId, (slides) => {
      const currentIndex = slides.findIndex((slide) => slide.id === slideId);
      const nextIndex = currentIndex + direction;
      if (currentIndex === -1 || nextIndex < 0 || nextIndex >= slides.length) return slides;
      return arrayMove(slides, currentIndex, nextIndex);
    });
  }

  async function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target?.result || '');
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.readAsDataURL(file);
    });
  }

  async function uploadFromInput(file) {
    const dataUrl = await readFileAsDataUrl(file);
    return uploadImageDataUrl(dataUrl, 'kifayatly_homepage');
  }

  async function handleSectionImageUpload(sectionId, fieldName, event, imageIndex = null) {
    const file = Array.from(event.target.files || []).find((entry) => entry.type.startsWith('image/'));
    event.target.value = '';
    if (!file) return;

    const uploadId = imageIndex == null ? `${sectionId}:${fieldName}` : `${sectionId}:${fieldName}:${imageIndex}`;
    setUploadingKey(uploadId);
    setSaved(false);

    try {
      const asset = await uploadFromInput(file);
      if (fieldName === 'desktopImages') {
        setSections((current) =>
          current.map((section) => {
            if (section.id !== sectionId) return section;

            return {
              ...section,
              desktopImages: (section.desktopImages || []).map((item, idx) =>
                idx === imageIndex ? { ...item, image: asset } : item,
              ),
            };
          }),
        );
      } else if (fieldName === 'mobileImage') {
        setSections((current) =>
          current.map((section) => (
            section.id === sectionId
              ? {
                  ...section,
                  mobileImage: {
                    ...(section.mobileImage || {}),
                    image: asset,
                  },
                }
              : section
          )),
        );
      } else {
        updateSection(sectionId, { [fieldName]: asset });
      }
    } catch (error) {
      toast.error(error.message || 'Failed to upload image.');
    } finally {
      setUploadingKey('');
    }
  }

  async function handleHeroSlideImageUpload(sectionId, slideId, fieldName, event) {
    const file = Array.from(event.target.files || []).find((entry) => entry.type.startsWith('image/'));
    event.target.value = '';
    if (!file) return;

    const uploadId = `${sectionId}:${slideId}:${fieldName}`;
    setUploadingKey(uploadId);
    setSaved(false);

    try {
      const asset = await uploadFromInput(file);
      handleHeroSlideChange(sectionId, slideId, { [fieldName]: asset });
    } catch (error) {
      toast.error(error.message || 'Failed to upload slide image.');
    } finally {
      setUploadingKey('');
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    try {
      const response = await fetch('/api/home-page', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sections: sections.map((section, index) => ({
            ...section,
            order: index,
            collectionKey: section.collectionKey || '',
            desktopImages: Array.isArray(section.desktopImages)
              ? section.desktopImages.map((item) => ({
                  image: item?.image || null,
                  link: item?.link || '',
                  alt: item?.alt || '',
                }))
              : [],
            mobileImage: section.mobileImage
              ? {
                  image: section.mobileImage.image || null,
                  link: section.mobileImage.link || '',
                  alt: section.mobileImage.alt || '',
                }
              : null,
            slides: Array.isArray(section.slides)
              ? section.slides.map((slide) => ({
                  ...slide,
                  desktopImage: slide.desktopImage || null,
                  mobileImage: slide.mobileImage || null,
                }))
              : [],
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save home page layout.');
      }

      setSections(normalizeSections(data.data?.sections || []));
      setSaved(true);
      toast.success('Home page layout updated.');
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      toast.error(error.message || 'Failed to save home page layout.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-6xl pb-24 md:pb-0">
      <div className="sticky top-0 z-20 -mx-2 mb-5 border-b border-border/70 bg-background/92 px-2 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:mx-0 sm:px-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-base font-medium tracking-tight text-foreground sm:text-lg">Home Page Section Manager</h1>
          <Button
            onClick={handleSave}
            disabled={saving || Boolean(uploadingKey)}
            className="h-10 rounded-2xl sm:min-w-[10rem]"
          >
            {saving ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Save data-icon="inline-start" />}
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save Home Page'}
          </Button>
        </div>
      </div>

      <div className="surface-card rounded-3xl border border-border/70 p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">Section Library</p>
        </div>

        <div className="mb-4 rounded-[1.4rem] border border-border bg-[linear-gradient(135deg,color-mix(in_oklab,var(--color-primary)_8%,white),color-mix(in_oklab,var(--color-primary)_2%,white))] px-3 py-3 sm:px-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/75">Quick Add</p>
        </div>

        <div className="-mx-5 overflow-x-auto px-5 pb-1 md:mx-0 md:px-0">
          <div className="flex min-w-max gap-2 md:min-w-0 md:flex-wrap md:gap-2.5">
          {SECTION_TEMPLATES.map((template) => {
            const Icon = template.icon;
            const isUsed = isTemplateAlreadyUsed(template);

            return (
              <Button
                key={`${template.type}-${template.collectionKey || 'base'}`}
                type="button"
                onClick={() => handleAddSection(template)}
                disabled={isUsed}
                className={cn(
                  'group h-auto min-h-0 shrink-0 justify-start gap-2 rounded-full border border-border bg-background/90 px-3.5 py-2.5 text-left text-foreground shadow-[0_10px_24px_rgba(10,61,46,0.06)] transition-[transform,box-shadow,border-color,background-color,opacity] duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-white hover:shadow-[0_16px_36px_rgba(10,61,46,0.1)] md:max-w-[15.5rem]',
                  isUsed && 'cursor-not-allowed border-border/80 bg-muted/35 text-muted-foreground opacity-70 hover:translate-y-0 hover:border-border/80 hover:bg-muted/35 hover:shadow-none',
                )}
              >
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors duration-300',
                    isUsed && 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon className="size-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{template.label}</span>
                </span>
                <div className="shrink-0">
                  {isUsed ? (
                    <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[10px]">
                      Added
                    </Badge>
                  ) : (
                    <Plus className="size-4 text-primary/70 transition-transform duration-300 group-hover:scale-110" />
                  )}
                </div>
              </Button>
            );
          })}
          </div>
        </div>
      </div>

      <div className="mt-6">
        {sections.length === 0 ? (
          <div className="surface-card rounded-3xl border border-dashed border-border/70 px-6 py-14 text-center">
            <p className="text-sm font-medium text-muted-foreground">No sections added yet. Start with a hero slider or category grid.</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
              <div className="max-h-[72vh] overflow-y-auto pr-1 sm:pr-3">
                <div className="space-y-4">
                  {sections.map((section, index) => (
                    <SortableSectionCard
                      key={section.id}
                      section={section}
                      index={index}
                      categories={availableCategories}
                      uploadingKey={uploadingKey}
                      onDelete={handleDeleteSection}
                      onToggleEnabled={handleToggleEnabled}
                      onSectionChange={updateSection}
                      onSectionImageUpload={handleSectionImageUpload}
                      onAddHeroSlide={handleAddHeroSlide}
                      onHeroSlideChange={handleHeroSlideChange}
                      onHeroSlideImageUpload={handleHeroSlideImageUpload}
                      onRemoveHeroSlide={handleRemoveHeroSlide}
                      onMoveHeroSlide={handleMoveHeroSlide}
                    />
                  ))}
                </div>
              </div>
            </SortableContext>
            <DragOverlay dropAnimation={null}>
              {activeSection ? (
                <div className="w-[min(100%,72rem)] px-1">
                  <SortableSectionCard
                    section={activeSection}
                    index={sections.findIndex((section) => section.id === activeSection.id)}
                    categories={availableCategories}
                    uploadingKey={uploadingKey}
                    isDragPreview
                    onDelete={() => {}}
                    onToggleEnabled={() => {}}
                    onSectionChange={() => {}}
                    onSectionImageUpload={() => {}}
                    onAddHeroSlide={() => {}}
                    onHeroSlideChange={() => {}}
                    onHeroSlideImageUpload={() => {}}
                    onRemoveHeroSlide={() => {}}
                    onMoveHeroSlide={() => {}}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Button
          onClick={handleSave}
          disabled={saving || Boolean(uploadingKey)}
          className="h-11 rounded-2xl sm:h-10"
        >
          {saving ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Save data-icon="inline-start" />}
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save Home Page'}
        </Button>
        {saved ? <span className="text-sm font-medium text-primary">Homepage layout saved successfully.</span> : null}
      </div>
    </div>
  );
}
