import { requireAdmin } from '@/lib/requireAdmin';

export default async function CustomerGrowthPage() {
  await requireAdmin();
  
  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Customer Growth</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This module is currently under development.
        </p>
      </div>
      <div className="surface-card rounded-xl p-6 flex flex-col items-center justify-center min-h-[300px] border border-dashed border-border/60">
        <div className="text-muted-foreground text-center">
          <p className="font-medium text-foreground">Coming Soon</p>
          <p className="text-sm mt-1">This feature will be available in a future update.</p>
        </div>
      </div>
    </div>
  );
}
