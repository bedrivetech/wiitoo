'use client';

import { motion } from 'framer-motion';

export default function VodPage() {
  const vods = [
    { title: 'Building the FUTURE of streaming — Part 3', date: 'March 12, 2026', views: 1284, duration: '1:24:32', status: 'Published' as const },
    { title: 'Late night UI design session', date: 'March 8, 2026', views: 843, duration: '2:01:15', status: 'Published' as const },
    { title: 'React Server Components deep dive', date: 'March 3, 2026', views: 2103, duration: '1:12:08', status: 'Published' as const },
    { title: 'Unboxing new gear + first impressions', date: 'Feb 28, 2026', views: 421, duration: '0:34:22', status: 'Processing' as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-2" style={{ color: 'var(--color-text-primary)' }}>
            VODs
          </h1>
          <p className="text-small mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
            Your recorded streams and uploads
          </p>
        </div>
        <button
          className="px-4 py-2.5 rounded-lg text-small font-semibold text-white transition-all hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, var(--color-brand-600), var(--color-brand-400))',
          }}
        >
          Upload Video
        </button>
      </div>

      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border-2 border-dashed p-10 text-center"
        style={{
          borderColor: 'var(--color-bg-border)',
          backgroundColor: 'var(--color-bg-raised)',
        }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(245,158,11,0.06))',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-brand-400)' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <p className="text-small font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          Drag & drop or click to upload
        </p>
        <p className="text-tiny mt-1" style={{ color: 'var(--color-text-muted)' }}>
          MP4, MOV, or WebM. Up to 4GB. 4K supported.
        </p>
      </motion.div>

      {/* VOD List */}
      <div className="space-y-2">
        {vods.map((vod, i) => (
          <motion.div
            key={vod.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-4 rounded-xl p-4 border"
            style={{
              backgroundColor: 'var(--color-bg-raised)',
              borderColor: 'var(--color-bg-border)',
            }}
          >
            {/* Thumbnail placeholder */}
            <div
              className="w-28 h-16 rounded-lg flex-shrink-0 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(245,158,11,0.08))',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-brand-400)' }}>
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-small font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                {vod.title}
              </p>
              <div className="flex items-center gap-3 mt-1 text-tiny" style={{ color: 'var(--color-text-tertiary)' }}>
                <span>{vod.date}</span>
                <span>·</span>
                <span>{vod.duration}</span>
                <span>·</span>
                <span>{vod.views.toLocaleString()} views</span>
              </div>
            </div>

            {/* Status */}
            <span
              className="px-2.5 py-1 rounded-full text-tiny font-medium"
              style={{
                backgroundColor: vod.status === 'Published'
                  ? 'rgba(34, 197, 94, 0.1)'
                  : 'rgba(245, 158, 11, 0.1)',
                color: vod.status === 'Published'
                  ? 'var(--color-success)'
                  : 'var(--color-warning)',
              }}
            >
              {vod.status}
            </span>

            {/* Actions */}
            <button
              className="px-3 py-1.5 rounded-lg text-tiny transition-all"
              style={{
                border: '1px solid var(--color-bg-border)',
                color: 'var(--color-text-tertiary)',
              }}
            >
              Edit
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}