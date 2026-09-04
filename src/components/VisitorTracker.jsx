'use client';

import { useEffect, useState } from 'react';
import { useVisitorTracker } from '@/hooks/use-visitor-tracker';

function TrackerClient() {
  useVisitorTracker();
  return null;
}

export default function VisitorTracker() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <TrackerClient />;
}
