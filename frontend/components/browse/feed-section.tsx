'use client';

import ContentCard from '@/components/browse/content-card';
import type { VideoData } from '@/lib/types';

interface FeedSectionProps {
  title: string;
  subtitle?: string;
  videos: VideoData[];
  layout?: 'grid' | 'horizontal';
  cardSize?: 'standard' | 'large';
  seeAllHref?: string;
}

export default function FeedSection({
  title,
  subtitle,
  videos,
  layout = 'grid',
  cardSize = 'standard',
  seeAllHref,
}: FeedSectionProps) {
  if (videos.length === 0) return null;

  return (
    <section>
      {/* Section header */}
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="text-title-3 text-text-primary">{title}</h2>
          {subtitle && (
            <p className="text-small text-text-tertiary mt-0.5">{subtitle}</p>
          )}
        </div>
        {seeAllHref && (
          <a
            href={seeAllHref}
            className="text-small text-text-tertiary hover:text-text-secondary transition-colors"
          >
            See all →
          </a>
        )}
      </div>

      {/* Content */}
      {layout === 'grid' ? (
        <div
          className={`grid gap-3 ${
            cardSize === 'large'
              ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
              : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
          }`}
        >
          {videos.map((video) => (
            <ContentCard key={video.id} video={video} size={cardSize} />
          ))}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {videos.map((video) => (
            <div key={video.id} className="flex-shrink-0 w-[260px]">
              <ContentCard video={video} size={cardSize} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}