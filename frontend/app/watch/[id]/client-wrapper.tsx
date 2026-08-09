'use client';

import { useEffect, useState } from 'react';
import { WatchPageSkeleton } from '@/components/ui/skeleton';
import { WatchPageClient } from './watch-page-client';

export function WatchPageClientWrapper({ videoId }: { videoId: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <WatchPageSkeleton />;
  }

  return <WatchPageClient videoId={videoId} />;
}