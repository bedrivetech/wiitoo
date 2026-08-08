'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGsapMount, useGsapStagger } from '@/lib/animations';

export default function AnalyticsPage() {
  const metrics = [
    { label: 'Total Views', value: '84.3K', change: '+12.4%', period: 'vs last month' },
    { label: 'Unique Viewers', value: '12.7K', change: '+8.2%', period: 'vs last month' },
    { label: 'Avg Watch Time', value: '24m 18s', change: '+3.2%', period: 'vs last month' },
    { label: 'Followers Gained', value: '342', change: '+18.7%', period: 'vs last month' },
  ];

  const recentData = [
    { day: 'Mon', views: 1200 },
    { day: 'Tue', views: 980 },
    { day: 'Wed', views: 1450 },
    { day: 'Thu', views: 1100 },
    { day: 'Fri', views: 2100 },
    { day: 'Sat', views: 1800 },
    { day: 'Sun', views: 2400 },
  ];

  const maxViews = Math.max(...recentData.map((d) => d.views));

  const metricGridRef = useGsapStagger('[data-metric]', 0, 0.08);
  const chartRef = useGsapMount(0.3);
  const topRef = useGsapMount(0.4);

  // Animate chart bars
  const barsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!barsRef.current) return;
    const bars = barsRef.current.querySelectorAll('[data-bar]');
    gsap.fromTo(bars, { height: 0 }, {
      height: (i) => `${(recentData[i].views / maxViews) * 100}%`,
      delay: 0.4,
      duration: 0.6,
      stagger: 0.06,
      ease: 'power2.out',
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-title-2" style={{ color: 'var(--color-text-primary)' }}>
          Analytics
        </h1>
        <p className="text-small mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
          Last 7 days
        </p>
      </div>

      {/* Metric Cards */}
      <div ref={metricGridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} data-metric className="rounded-xl p-5 border"
            style={{
              backgroundColor: 'var(--color-bg-raised)',
              borderColor: 'var(--color-bg-border)',
            }}
          >
            <span className="text-tiny uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              {m.label}
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-title-1" style={{ color: 'var(--color-text-primary)' }}>
                {m.value}
              </span>
              <span className="text-tiny font-medium" style={{ color: 'var(--color-success)' }}>
                {m.change}
              </span>
            </div>
            <span className="text-tiny" style={{ color: 'var(--color-text-muted)' }}>
              {m.period}
            </span>
          </div>
        ))}
      </div>

      {/* Views Chart */}
      <div ref={chartRef} className="rounded-xl p-6 border"
        style={{
          backgroundColor: 'var(--color-bg-raised)',
          borderColor: 'var(--color-bg-border)',
        }}
      >
        <h2 className="text-subtitle mb-6" style={{ color: 'var(--color-text-primary)' }}>
          Views This Week
        </h2>
        <div className="flex items-end gap-3 h-40">
          {recentData.map((d, i) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
              <div
                data-bar
                className="w-full rounded-t-md"
                style={{
                  background: 'linear-gradient(to top, var(--color-brand-700), var(--color-brand-400))',
                  borderRadius: '4px 4px 0 0',
                  minHeight: d.views > 0 ? 8 : 0,
                  height: 0,
                }}
              />
              <span className="text-tiny" style={{ color: 'var(--color-text-muted)' }}>
                {d.day}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Content */}
      <div ref={topRef} className="rounded-xl p-6 border"
        style={{
          backgroundColor: 'var(--color-bg-raised)',
          borderColor: 'var(--color-bg-border)',
        }}
      >
        <h2 className="text-subtitle mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Top Content
        </h2>
        <div className="space-y-3">
          {[
            { title: 'React vs Vue — honest take', views: 2103, revenue: '$67.30' },
            { title: 'Building the FUTURE of streaming', views: 1284, revenue: '$45.20' },
            { title: 'Late night UI design session', views: 843, revenue: '$22.80' },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-center justify-between py-2 border-b last:border-0"
              style={{ borderColor: 'var(--color-bg-border)' }}
            >
              <span className="text-small truncate flex-1" style={{ color: 'var(--color-text-primary)' }}>
                {item.title}
              </span>
              <div className="flex items-center gap-4 text-small flex-shrink-0 ml-4">
                <span style={{ color: 'var(--color-text-tertiary)' }}>{item.views.toLocaleString()} views</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>{item.revenue}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}