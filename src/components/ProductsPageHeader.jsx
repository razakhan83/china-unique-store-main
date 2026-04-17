'use client';

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Sparkles, Tag } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

const categoryPillClassName =
  "inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-semibold transition-[color,background-color,border-color,box-shadow,transform] outline-none active:scale-[0.97]";

function getCategoryPillClassName(isActive) {
  if (isActive) {
      return cn(
      categoryPillClassName,
      "border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/92"
    );
  }

  return cn(
    categoryPillClassName,
    "border-border/70 bg-card text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] hover:border-primary/30 hover:bg-accent"
  );
}

function buildTitle(activeCategory, categories, searchTerm) {
  if (activeCategory === "new-arrivals") return "New Arrivals";
  if (activeCategory && activeCategory !== "all") {
    return categories.find((category) => category.id === activeCategory)?.label || "Products";
  }
  if (searchTerm) return "Search Results";
  return "All Products";
}

function buildCategoryHref(categoryId, searchTerm, sort) {
  const params = new URLSearchParams();
  if (searchTerm) {
    params.set("search", searchTerm);
  }
  if (sort && sort !== "newest") {
    params.set("sort", sort);
  }
  if (categoryId !== "all") {
    params.set("category", categoryId);
  }
  const queryString = params.toString();
  return queryString ? `/products?${queryString}` : "/products";
}

export default function ProductsPageHeader({
  categories,
  activeCategory = "all",
  searchTerm = "",
  sort = "newest",
}) {
  const router = useRouter();
  const categoryNavRef = useRef(null);
  const [isPending, startTransition] = useTransition();
  const [pendingCategoryId, setPendingCategoryId] = useState(null);
  const categoryButtons = [
    { id: "all", label: "All Items", icon: Search},
    { id: "new-arrivals", label: "New Arrivals", icon: Sparkles},
    { id: "special-offers", label: "Special Offers", icon: Tag},
    ...categories
      .filter(c => c.id !== 'special-offers' && c.id !== 'new-arrivals')
      .map(c => ({ ...c, icon: Tag })),
  ];
  const effectiveActiveCategory = pendingCategoryId ?? activeCategory;
  const pageTitle = buildTitle(activeCategory, categories, searchTerm);

  useEffect(() => {
    const nav = categoryNavRef.current;
    if (!nav) return;

    const activePill = nav.querySelector("[data-active='true']");
    if (!activePill) return;

    nav.scrollTo({
      left: activePill.offsetLeft - nav.clientWidth / 2 + activePill.clientWidth / 2,
      behavior: "smooth",
    });
  }, [activeCategory]);

  function centerCategoryPill(target) {
    const nav = categoryNavRef.current;
    if (!nav || !(target instanceof HTMLElement)) return;

    nav.scrollTo({
      left: target.offsetLeft - nav.clientWidth / 2 + target.clientWidth / 2,
      behavior: "smooth",
    });
  }

  function handleCategoryClick(categoryId, href, event) {
    const target = event.currentTarget;
    centerCategoryPill(target);
    setPendingCategoryId(categoryId);

    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  return (
    <div>
      <div className="products-page-bar fixed inset-x-0 top-24 z-30 border-b border-border/50 bg-background/86 backdrop-blur-xl">
        <div className="relative mx-auto max-w-7xl px-4">
          <div
            ref={categoryNavRef}
            className="relative flex gap-1.5 overflow-x-auto py-3 hide-scrollbar"
          >
            {categoryButtons.map((category) => {
              const Icon = category.icon;
              const isActive = effectiveActiveCategory === category.id;
              const isLoading = isPending && pendingCategoryId === category.id;
              const href = buildCategoryHref(category.id, searchTerm, sort);
              return (
                <button
                  key={category.id}
                  type="button"
                  data-active={isActive}
                  aria-pressed={isActive}
                  disabled={isLoading}
                  onClick={(event) => handleCategoryClick(category.id, href, event)}
                  className={cn(
                    getCategoryPillClassName(isActive),
                    "shrink-0 select-none",
                    !isActive && "active:border-primary/28 active:bg-accent"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : Icon ? (
                    <Icon className="size-4" aria-hidden="true" />
                  ) : null}
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="h-18 md:h-20" aria-hidden="true" />

      <div className="container mx-auto mb-2 max-w-7xl px-4 pt-3">
        <Breadcrumb className="products-page-meta mb-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="products-page-heading text-[1.8rem] font-semibold tracking-tight text-foreground [text-wrap:balance] md:text-3xl">
          {pageTitle}
        </h1>
      </div>
    </div>
  );
}
