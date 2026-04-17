'use client';

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Search, Sparkles, Tag } from "lucide-react";

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
  "inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition-[color,background-color,border-color,box-shadow] outline-none";

function getCategoryPillClassName(isActive) {
  if (isActive) {
      return cn(
      categoryPillClassName,
      "border-primary/18 bg-primary/10 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.32)] hover:bg-primary/12"
    );
  }

  return cn(
    categoryPillClassName,
    "border-transparent bg-transparent text-muted-foreground hover:border-border/60 hover:bg-card hover:text-foreground"
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
  const categoryNavRef = useRef(null);
  const categoryButtons = [
    { id: "all", label: "All Items", icon: Search},
    { id: "new-arrivals", label: "New Arrivals", icon: Sparkles},
    { id: "special-offers", label: "Special Offers", icon: Tag},
    ...categories
      .filter(c => c.id !== 'special-offers' && c.id !== 'new-arrivals')
      .map(c => ({ ...c, icon: Tag })),
  ];
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

  function handleCategoryClick(event) {
    const nav = categoryNavRef.current;
    const link = event.currentTarget;
    if (!nav || !(link instanceof HTMLElement)) return;

    nav.scrollTo({
      left: link.offsetLeft - nav.clientWidth / 2 + link.clientWidth / 2,
      behavior: "smooth",
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
              const isActive = activeCategory === category.id;
              return (
                <Link
                  key={category.id}
                  href={buildCategoryHref(category.id, searchTerm, sort)}
                  scroll={false}
                  data-active={isActive}
                  onClick={handleCategoryClick}
                  className={cn(getCategoryPillClassName(isActive), "shrink-0 select-none")}
                >
                  {Icon ? <Icon className="size-4" aria-hidden="true" /> : null}
                  {category.label}
                </Link>
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
