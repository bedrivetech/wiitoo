'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function StudioDashboard() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const stats = [
    { label: 'Live Status', value: 'Offline', color: 'var(--color-text-muted)', dot: 'var(--color-text-muted)' },
    { label: 'Followers', value: '1,247', change: '+12 this week', up: true },
    { label: 'Total Views', value: '84.3K', change: '+3.2K this month', up: true },
    { label: 'Revenue (7d)', value: '$342.50', change: '+$84 from last week', up: true },
  ];

  const recentStreams = [
    { title: 'Late night coding — building the FUTURE', date: '2 days ago', views: 342, revenue: '$45.20', clips: 3 },
    { title: 'Designing a new UI with Tailwind', date: '5 days ago', views: 189, revenue: '$22.80', clips: 1 },
    { title: 'React vs Vue — honest take', date: '1 week ago', views: 523, revenue: '$67.30', clips: 5 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-title-2" style={{ color: 'var(--color-text-primary)' }}>
          Dashboard
        </h1>
        <p className="text-small mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
          {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-xl p-5 border"
            style={{
              backgroundColor: 'var(--color-bg-raised)',
              borderColor: 'var(--color-bg-border)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-tiny uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                {stat.label}
              </span>
              {'dot' in stat && (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.dot }} />
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-title-1" style={{ color: 'var(--color-text-primary)' }}>
                {stat.value}
              </span>
              {'change' in stat && (
                <span className="text-tiny" style={{ color: stat.up ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>
                  {stat.change}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Go Live */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl p-6 border"
          style={{
            backgroundColor: 'var(--color-bg-raised)',
            borderColor: 'var(--color-bg-border)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-subtitle" style={{ color: 'var(--color-text-primary)' }}>
              Quick Start
            </h2>
            <span
              className="px-2 py-0.5 rounded-full text-tiny font-medium"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--color-live)',
              }}
            >
              Not live
            </span>
          </div>
          <p className="text-small mb-5" style={{ color: 'var(--color-text-tertiary)' }}>
            You're not streaming right now. Set up your stream key and go live from OBS, Streamlabs, or any RTMP client.
          </p>
          <div className="flex gap-3">
            <button
              className="px-5 py-2.5 rounded-lg text-small font-semibold text-white transition-all hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              }}
            >
              Go Live
            </button>
            <button
              className="px-5 py-2.5 rounded-lg text-small font-medium transition-all"
              style={{
                border: '1px solid var(--color-bg-border)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Stream Settings
            </button>
          </div>
        </motion.div>

        {/* Recent Streams */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl p-6 border"
          style={{
            backgroundColor: 'var(--color-bg-raised)',
            borderColor: 'var(--color-bg-border)',
          }}
        >
          <h2 className="text-subtitle mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Recent Streams
          </h2>
          <div className="space-y-3">
            {recentStreams.map((s) => (
              <div
                key={s.title}
                className="flex items-center justify-between py-2 border-b last:border-0"
                style={{ borderColor: 'var(--color-bg-border)' }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-small font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {s.title}
                  </p>
                  <p className="text-tiny mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                    {s.views} views · {s.revenue} · {s.clips} clips
                  </p>
                </div>
                <span className="text-tiny flex-shrink-0 ml-3" style={{ color: 'var(--color-text-muted)' }}>
                  {s.date}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}