// @ts-nocheck
import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

/**
 * @param {{ className?: string; type?: string; [key: string]: any }} props
 */
function Input({
  className = "",
  type,
  ...props
}) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-xl border px-3.5 py-2 text-sm text-foreground shadow-[0_1px_0_color-mix(in_oklab,var(--color-background)_65%,white)] outline-none transition-[border-color,background-color,box-shadow,color] duration-200 ease-out",
        "border-[color:color-mix(in_oklab,var(--color-border)_82%,white)] bg-[color:color-mix(in_oklab,var(--color-input)_88%,white)]",
        "placeholder:text-[color:color-mix(in_oklab,var(--color-muted-foreground)_78%,white)]",
        "hover:border-[color:color-mix(in_oklab,var(--color-primary)_16%,var(--color-border))] hover:bg-[color:color-mix(in_oklab,var(--color-input)_94%,white)]",
        "focus-visible:border-[color:color-mix(in_oklab,var(--color-primary)_34%,var(--color-border))] focus-visible:bg-[color:color-mix(in_oklab,var(--color-input)_96%,white)] focus-visible:ring-4 focus-visible:ring-[color:color-mix(in_oklab,var(--color-primary)_14%,transparent)] focus-visible:shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-primary)_18%,transparent),0_10px_24px_-18px_color-mix(in_oklab,var(--color-primary)_45%,transparent)]",
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-[color:color-mix(in_oklab,var(--color-border)_88%,white)] disabled:bg-[color:color-mix(in_oklab,var(--color-muted)_78%,white)] disabled:text-[color:color-mix(in_oklab,var(--color-muted-foreground)_70%,white)] disabled:shadow-none",
        "aria-invalid:border-destructive aria-invalid:bg-[color:color-mix(in_oklab,var(--color-destructive)_6%,white)] aria-invalid:ring-4 aria-invalid:ring-[color:color-mix(in_oklab,var(--color-destructive)_16%,transparent)] aria-invalid:shadow-none",
        className
      )}
      {...props} />
  );
}

export { Input }
