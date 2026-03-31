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
}) {
  return (
    <div className={cn("relative", className)}>
      <form onSubmit={onSubmit} className="flex items-center">
        <InputGroup
          className={cn(
            "min-h-12 rounded-xl border-border/70 bg-card/95"
          )}
        >
          <InputGroupInput
            type="text"
            value={value}
            onChange={onChange}
            onFocus={onFocus}
            className={cn(
              "h-12 min-w-0 border-0 bg-transparent px-4 text-sm text-foreground shadow-none outline-none ring-0 transition-none placeholder:text-muted-foreground/80",
              "hover:border-0 hover:bg-transparent hover:shadow-none",
              "focus-visible:border-0 focus-visible:bg-transparent focus-visible:shadow-none focus-visible:ring-0",
              "aria-invalid:border-0 aria-invalid:bg-transparent aria-invalid:shadow-none aria-invalid:ring-0",
              "md:text-[0.95rem]",
              inputClassName
            )}
            placeholder="Search for premium products"
          />
          <InputGroupAddon align="inline-start" className="pl-4 text-primary/75">
            <InputGroupText>
              <Search className="size-4" />
            </InputGroupText>
          </InputGroupAddon>
          <InputGroupAddon align="inline-end" className="gap-1.5 pr-2">
            {value ? (
              <InputGroupButton
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={onClear}
                aria-label="Clear search"
                className="rounded-xl text-muted-foreground hover:bg-muted"
              >
                <X />
              </InputGroupButton>
            ) : null}
            <InputGroupButton
              type="submit"
              size="sm"
              variant="default"
              className="h-9 rounded-xl px-3.5 text-sm"
            >
              {buttonLabel}
              <ArrowRight data-icon="inline-end" />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </form>

      {showSuggestions && isFocused && value.trim() ? (
        <div className="absolute top-full z-40 mt-3 w-full overflow-hidden rounded-xl border border-border/80 bg-popover/98 shadow-lg backdrop-blur">
          {suggestions.length ? (
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
