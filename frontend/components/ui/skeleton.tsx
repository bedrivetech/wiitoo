/* ── Loading Skeletons ── */

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-bg-raised/60 ${className}`}
    />
  );
}

/* Card skeleton — matches ContentCard aspect ratio + metadata */
export function ContentCardSkeleton() {
  return (
    <div className="block rounded-lg">
      <Skeleton className="w-full aspect-video" />
      <div className="mt-2.5 space-y-2 px-0.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

/* Feed skeleton row */
export function FeedSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <ContentCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* Watch page skeleton */
export function WatchPageSkeleton() {
  return (
    <div className="min-h-screen bg-bg-base">
      <div className="mx-auto max-w-[1360px]">
        <div className="px-0 md:px-6 pt-0 md:pt-6">
          <Skeleton className="w-full aspect-video rounded-lg" />
        </div>
        <div className="px-4 md:px-0 py-4 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  );
}