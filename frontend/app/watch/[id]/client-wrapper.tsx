'use client';

import dynamic from 'next/dynamic';
import { WatchPageSkeleton } from '@/components/ui/skeleton';

export const WatchPageClient = dynamic(() => import('./watch-page-client').then((m) => ({ default: m.WatchPageClient })), {
  ssr: false,
  loading: () => <WatchPageSkeleton />,
});