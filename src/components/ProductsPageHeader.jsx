import Link from "next/link";
import { Search, Sparkles, Tag } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
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
  "inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-md border px-3 text-sm font-medium shadow-xs transition-[color,box-shadow,background-color,border-color] outline-none";

function getCategoryPillClassName(isActive) {
  if (isActive) {
    return cn(
      categoryPillClassName,
      "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
    );
  }

  return cn(
    categoryPillClassName,
    "border-border bg-background hover:bg-accent hover:text-accent-foreground"
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
  const categoryButtons = [
    { id: "all", label: "All Items", icon: Search},
    { id: "new-arrivals", label: "New Arrivals", icon: Sparkles},
    { id: "special-offers", label: "Special Offers", icon: Tag},
    ...categories
      .filter(c => c.id !== 'special-offers' && c.id !== 'new-arrivals')
      .map(c => ({ ...c, icon: Tag })),
  ];
  const pageTitle = buildTitle(activeCategory, categories, searchTerm);

  return (
    <div>
      <div className="products-page-bar fixed inset-x-0 top-24 z-30 border-y border-border/70 bg-card/95 backdrop-blur">
        <div className="relative mx-auto max-w-7xl px-4">
          <div
            className="relative flex gap-2 overflow-x-auto py-4 hide-scrollbar"
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

      <div className="h-22 md:h-24" aria-hidden="true" />

      <div className="container mx-auto mb-3 max-w-7xl px-4">
        <Breadcrumb className="products-page-meta mb-3">
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
        <h1 className="products-page-heading text-3xl font-bold tracking-tight text-foreground [text-wrap:balance]">
          {pageTitle}
        </h1>
      </div>
    </div>
  );
}
