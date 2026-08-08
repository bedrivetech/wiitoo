'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import ContentCard from '@/components/browse/content-card';
import { liveStreams, vodStreams } from '@/lib/mock-data';

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';

  // Mock search — filter mock data by title/category/creator
  const query = q.toLowerCase();
  const allContent = [...liveStreams, ...vodStreams];
  const results = query
    ? allContent.filter(
        (v) =>
          v.title.toLowerCase().includes(query) ||
          v.creator.displayName.toLowerCase().includes(query) ||
          v.creator.username.toLowerCase().includes(query) ||
          v.category?.toLowerCase().includes(query) ||
          v.tags?.some((t) => t.toLowerCase().includes(query))
      )
    : [];

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-5">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">
          {query ? `Results for "${q}"` : 'Search Wiitoo'}
        </h1>
        <p className="text-small text-text-muted mt-1">
          {results.length > 0
            ? `${results.length} result${results.length === 1 ? '' : 's'} found`
            : query
            ? 'No results found'
            : 'Type something to search videos, creators, and categories'}
        </p>
      </div>

      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6">
          {results.map((video) => (
            <ContentCard key={video.id} video={video} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {query && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-bg-raised flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-text-primary mb-1">No results found</h3>
          <p className="text-small text-text-muted max-w-sm">
            Try different keywords, check your spelling, or browse categories to discover content.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[1440px] mx-auto px-4 py-5">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 rounded bg-bg-raised" />
            <div className="h-4 w-32 rounded bg-bg-raised" />
          </div>
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}