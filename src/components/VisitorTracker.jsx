'use client';

import { Suspense } from 'react';
import { useVisitorTracker } from '@/hooks/use-visitor-tracker';

function TrackerClient() {
  useVisitorTracker();
  return null;
}

export default function VisitorTracker() {
  return (
    <Suspense fallback={null}>
      <TrackerClient />
    </Suspense>
  );
}

