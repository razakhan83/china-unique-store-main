"use client";

import Image from "next/image";
import { ArrowRight, Search, X } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { CLOUDINARY_IMAGE_PRESETS, optimizeCloudinaryUrl } from "@/lib/cloudinaryImage";
import { getProductCategoryNames } from "@/lib/productCategories";
import { cn } from "@/lib/utils";
import { getPrimaryProductImage } from "@/lib/productImages";
import { getBlurPlaceholderProps } from "@/lib/imagePlaceholder";
import { Skeleton } from "@/components/ui/skeleton";

export default function SearchField({
  value,
  onChange,
  onSubmit,
  onClear,
  onFocus,
  isFocused,
  suggestions = [],
  emptyLabel,
  className,
  inputClassName,
  buttonLabel = "Search",
  showSuggestions = true,
  isLoading = false,
  placeholder = "Search for premium products...",
  autoFocus = false,
  inlineSuggestions = false,
}) {
  return (
    <div className={cn("relative w-full", className)}>
      <form onSubmit={onSubmit} className="flex w-full items-center">
        <InputGroup
          className={cn(
            "min-h-12 rounded-xl border border-muted-foreground/20 bg-muted/40 transition-all hover:bg-muted/60 hover:border-muted-foreground/30 focus-within:bg-background focus-within:border-primary/40 focus-within:shadow-[0_0_0_1px_rgba(1,83,71,0.2)]"
          )}
        >
          <InputGroupAddon align="inline-start" className="pl-4 text-primary/75">
            <InputGroupText>
              <Search className="size-4" />
            </InputGroupText>
          </InputGroupAddon>
          <div className="absolute inset-y-0 left-[2.75rem] right-12 flex items-center pointer-events-none overflow-hidden">
            {!value ? (
              <span
                key={placeholder}
                className="animate-in fade-in slide-in-from-bottom-3 duration-500 text-muted-foreground/80 text-sm md:text-[0.95rem] truncate"
              >
                {placeholder}
              </span>
            ) : null}
          </div>
          <InputGroupInput
            type="text"
            value={value}
            onChange={onChange}
            onFocus={onFocus}
            autoFocus={autoFocus}
            className={cn(
              "h-12 min-w-0 border-0 bg-transparent pl-11 pr-10 text-sm text-foreground shadow-none outline-none ring-0 transition-none placeholder:text-transparent",
              "hover:border-0 hover:bg-transparent hover:shadow-none",
              "focus-visible:border-0 focus-visible:bg-transparent focus-visible:shadow-none focus-visible:ring-0",
              "aria-invalid:border-0 aria-invalid:bg-transparent aria-invalid:shadow-none aria-invalid:ring-0",
              "md:text-[0.95rem]",
              inputClassName
            )}
            placeholder=""
          />
          <InputGroupAddon align="inline-end" className="gap-1.5 pr-2">
            {value ? (
              <InputGroupButton
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={onClear}
                aria-label="Clear search"
                className="rounded-xl text-muted-foreground hover:bg-muted mr-1.5"
              >
                <X />
              </InputGroupButton>
            ) : null}
          </InputGroupAddon>
        </InputGroup>
      </form>

      {showSuggestions && isFocused && value.trim() ? (
        <div 
          className={cn(
            "w-full overflow-hidden",
            inlineSuggestions
              ? "mt-3 bg-transparent border-0 shadow-none"
              : "absolute top-full z-40 mt-3 rounded-xl border border-border/80 bg-popover/98 shadow-lg backdrop-blur"
          )}
        >
          {isLoading ? (
            <ul className="divide-y divide-border/70">
              {[1, 2, 3, 4].map((i) => (
                <li key={i} className="flex w-full items-center gap-3 px-4 py-3">
                  <Skeleton className="size-12 rounded-xl shrink-0" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="size-4 rounded-full shrink-0" />
                </li>
              ))}
            </ul>
          ) : suggestions.length ? (
            <ul className="divide-y divide-border/70">
              {suggestions.map((product, index) => {
                const primaryImage = getPrimaryProductImage(product);
                const primaryImageSrc = primaryImage?.url
                  ? optimizeCloudinaryUrl(primaryImage.url, CLOUDINARY_IMAGE_PRESETS.searchSuggestion)
                  : "";

                return (
                <li key={`${product._id || product.id || "result"}-${index}`}>
                  <button
                    type="button"
                    onClick={() => product.onSelect?.(product)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:bg-muted"
                  >
                    <div className="relative size-12 overflow-hidden rounded-xl border border-border/80 bg-muted shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]">
                      {primaryImageSrc ? (
                        <Image
                          src={primaryImageSrc}
                          alt={product.Name || product.name || "product"}
                          fill
                          sizes="48px"
                          className="object-cover"
                          {...getBlurPlaceholderProps(primaryImage?.blurDataURL)}
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{product.Name || product.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {getProductCategoryNames(product).join(", ") || "Uncategorized"}
                      </p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </button>
                </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-5 py-6 text-center text-sm text-muted-foreground">{emptyLabel || `No products found for "${value}"`}</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
