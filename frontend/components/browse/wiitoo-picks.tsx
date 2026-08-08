'use client';

import ContentCard from '@/components/browse/content-card';
import type { VideoData } from '@/lib/types';

interface WiitooPicksProps {
  videos: VideoData[];
}

export default function WiitooPicks({ videos }: WiitooPicksProps) {
  if (videos.length === 0) return null;

  return (
    <section>
      {/* Section header */}
      <div className="flex items-baseline justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-sm"
            style={{
              background: 'linear-gradient(135deg, var(--color-brand-500), var(--color-ember-400))',
            }}
          />
          <div>
            <h2 className="text-title-3 text-text-primary">
              Wiitoo Picks
            </h2>
            <p className="text-small text-text-tertiary mt-0.5">
              Exclusive creators we believe in
            </p>
          </div>
        </div>
      </div>

      {/* Larger cards grid */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {videos.map((video) => (
          <div key={video.id} className="relative">
            {/* Exclusive gradient border glow */}
            <div
              className="absolute -inset-[1.5px] rounded-xl opacity-40 pointer-events-none"
              style={{
                background:
                  'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(245,158,11,0.10))',
              }}
            />
            <div className="relative z-[1]">
              <ContentCard video={video} size="large" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}