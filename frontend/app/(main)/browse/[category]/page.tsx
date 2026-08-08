'use client';

import { use } from 'react';
import Link from 'next/link';
import FeedSection from '@/components/browse/feed-section';
import ContentCard from '@/components/browse/content-card';
import { getCategory, getVideosByCategory, videos, superLeaderCategories } from '@/lib/mock-data';
import { formatCount } from '@/lib/utils';

export default function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = use(params);
  const cat = getCategory(slug);
  const catVideos = getVideosByCategory(slug);
  const isSuperLeader = cat?.isSuperLeader ?? false;

  const exclusiveInCategory = catVideos.filter((v) => v.creator.isExclusive);
  const regularInCategory = catVideos.filter((v) => !v.creator.isExclusive);

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-small text-text-tertiary mb-6">
        <Link href="/browse" className="hover:text-text-secondary transition-colors">
          Browse
        </Link>
        <span className="text-text-disabled">/</span>
        <span className="text-text-primary">{cat?.label ?? slug}</span>
      </div>

      {/* Category header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-title-1 text-text-primary">
            {cat?.label ?? slug}
          </h1>
          {isSuperLeader && (
            <span
              className="px-2.5 py-0.5 rounded-md text-tiny font-semibold"
              style={{
                background:
                  'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(245,158,11,0.1))',
                color: 'rgba(196, 181, 253, 0.9)',
              }}
            >
              ★ Wiitoo
            </span>
          )}
        </div>

        {/* Super leader description */}
        {isSuperLeader && (
          <p className="text-small text-text-secondary mt-2 max-w-2xl leading-relaxed">
            {cat?.slug === 'music' && 'Wiitoo is the home for music. From ambient sessions to live performances, discover the best musicians streaming right now.'}
            {cat?.slug === 'creative' && 'Wiitoo is where creativity lives. Build streams, art sessions, craft projects — watch creators make things in real time.'}
            {cat?.slug === 'tech' && 'Wiitoo is the destination for tech. Code reviews, hardware builds, deep dives — the most interesting technical minds stream here.'}
          </p>
        )}

        {/* Stats */}
        {cat && (
          <div className="flex items-center gap-4 mt-3 text-tiny text-text-muted">
            <span>
              <span className="text-text-secondary">{formatCount(cat.viewerCount ?? 0)}</span> viewers
            </span>
            <span>
              <span className="text-text-secondary">{cat.streamCount}</span> streams
            </span>
            <span>
              <span className="text-text-secondary">{catVideos.length}</span> videos
            </span>
          </div>
        )}
      </div>

      {/* Featured creator spotlight (super leader only) */}
      {isSuperLeader && exclusiveInCategory.length > 0 && (
        <div className="mb-10 p-5 rounded-xl bg-bg-elevated border border-bg-border">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-bg-hover flex items-center justify-center flex-shrink-0">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-text-muted"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-caption text-text-muted mb-1">★ Wiitoo Spotlight</p>
              <h3 className="text-title-3 text-text-primary">
                {exclusiveInCategory[0].creator.displayName}
              </h3>
              <p className="text-small text-text-secondary mt-1">
                @{exclusiveInCategory[0].creator.username}
              </p>
              <p className="text-small text-text-tertiary mt-2 leading-relaxed max-w-xl">
                {cat?.slug === 'music' && 'Pushing the boundaries of live music on Wiitoo. Known for their golden-hour sessions and genre-blending sound.'}
                {cat?.slug === 'creative' && 'One of Wiitoo&apos;s most innovative creators. Their build streams are masterclasses in making.'}
                {cat?.slug === 'tech' && 'A Wiitoo Exclusive creator bringing deep technical knowledge to live audiences every week.'}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button className="px-3 py-1 bg-brand-600 hover:bg-brand-500 text-white text-small font-semibold rounded-lg transition-all">
                  Follow
                </button>
                <Link
                  href={`/creator/${exclusiveInCategory[0].creator.username}`}
                  className="px-3 py-1 bg-bg-hover text-text-secondary text-small font-medium rounded-lg hover:text-text-primary transition-all"
                >
                  View profile
                </Link>
              </div>
            </div>
            {/* Featured video thumbnail */}
            <div className="hidden md:block w-48 aspect-video rounded-lg bg-bg-hover flex-shrink-0 overflow-hidden">
              <div className="w-full h-full flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted opacity-30">
                  <polygon points="10 8 16 12 10 16 10 8" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exclusive creators section */}
      {exclusiveInCategory.length > 0 && (
        <div className="mb-10">
          <FeedSection
            title="Exclusive creators"
            subtitle="Wiitoo Picks in {cat?.label ?? slug}"
            videos={exclusiveInCategory}
            cardSize="large"
          />
        </div>
      )}

      {/* All streamers section */}
      <div>
        <h2 className="text-title-3 text-text-primary mb-4">
          {isSuperLeader ? 'All streamers' : 'All videos'}
        </h2>
        {regularInCategory.length > 0 || exclusiveInCategory.length > 0 ? (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {regularInCategory.map((video) => (
              <ContentCard key={video.id} video={video} size="standard" />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-text-tertiary">No content in this category yet</p>
            <p className="text-tiny text-text-muted mt-1">Check back soon for new streams</p>
          </div>
        )}
      </div>
    </div>
  );
}