'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const HomePageBuilderClient = dynamic(() => import('./HomePageBuilderClient'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/5 p-12 text-center">
      <Loader2 className="mb-4 size-10 animate-spin text-muted-foreground/40" />
      <p className="text-sm font-medium text-muted-foreground">Loading interactive builder...</p>
    </div>
  ),
});

export default function HomePageBuilderWrapper(props) {
  return <HomePageBuilderClient {...props} />;
}
