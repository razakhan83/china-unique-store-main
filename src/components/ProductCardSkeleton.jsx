import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function ProductCardSkeleton({ className }) {
  return (
    <div
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-xl border-none bg-card ring-0 shadow-none",
        className
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-t-[11px] bg-muted/40">
        <Skeleton className="absolute inset-0 h-full w-full rounded-none opacity-60" />
      </div>
      <div className="flex flex-1 flex-col gap-2 bg-card px-3 pb-3 pt-3 sm:p-4">
        <div className="space-y-1.5 pt-0.5">
          <Skeleton className="h-3.5 w-[85%] rounded-sm sm:h-4" />
          <Skeleton className="h-3.5 w-[50%] rounded-sm sm:h-4" />
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2 sm:pt-3">
          <Skeleton className="h-5 w-20 rounded-md" />
          <Skeleton className="size-8 shrink-0 rounded-full sm:size-9" />
        </div>
      </div>
    </div>
  );
}
