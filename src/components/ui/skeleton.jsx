// @ts-nocheck
"use client";

import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent bg-[length:400%_100%]" />
    </div>
  );
}

function SkeletonText({ className, width = "w-20", ...props }) {
  return (
    <Skeleton className={cn(`h-4 ${width}`, className)} {...props} />
  );
}

function SkeletonCard({ className, ...props }) {
  return (
    <div className={cn("admin-stat-card p-6 flex flex-col gap-4", className)} {...props}>
      <Skeleton className="size-8 rounded-md" />
      <div className="space-y-2">
        <SkeletonText width="w-[60px]" className="h-6" />
        <SkeletonText width="w-[90px]" className="h-3" />
      </div>
    </div>
  );
}

function SkeletonRow({ className, columns = 6, ...props }) {
  // Default skeleton row for tables
  return (
    <tr className={cn("border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className)} {...props}>
      <td className="p-4 align-middle"><SkeletonText width="w-[100px]" /></td>
      <td className="p-4 align-middle space-y-1">
        <SkeletonText width="w-[120px]" />
        <SkeletonText width="w-[90px]" className="h-3" />
      </td>
      <td className="p-4 align-middle"><Skeleton className="h-5 w-[60px] rounded-full" /></td>
      <td className="p-4 align-middle space-y-1">
        <SkeletonText width="w-[80px]" />
        <SkeletonText width="w-[60px]" className="h-3" />
      </td>
      <td className="p-4 align-middle"><Skeleton className="h-6 w-[90px] rounded-full" /></td>
      <td className="p-4 align-middle text-right flex justify-end"><SkeletonText width="w-[60px]" /></td>
    </tr>
  );
}

function SkeletonProductRow({ className, ...props }) {
  return (
    <tr className={cn("border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className)} {...props}>
      <td className="p-4 align-middle">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-md shrink-0" />
          <div className="space-y-1">
            <SkeletonText width="w-[140px]" />
            <SkeletonText width="w-[80px]" className="h-3" />
          </div>
        </div>
      </td>
      <td className="p-4 align-middle"><SkeletonText width="w-[60px]" /></td>
      <td className="p-4 align-middle"><SkeletonText width="w-[80px]" /></td>
      <td className="p-4 align-middle"><Skeleton className="h-5 w-[85px] rounded-full" /></td>
      <td className="p-4 align-middle"><Skeleton className="h-5 w-[60px] rounded-full" /></td>
      <td className="p-4 align-middle text-right flex justify-end"><Skeleton className="size-8 rounded-md" /></td>
    </tr>
  );
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonRow, SkeletonProductRow };
