'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Category } from '@/lib/mock-data';
import { categories } from '@/lib/mock-data';

export default function CategoriesBar() {
  const pathname = usePathname();
  const activeSlug = pathname.startsWith('/browse/')
    ? pathname.split('/browse/')[1]
    : null;

  return (
    <nav className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
      <Link
        href="/browse"
        className={`px-3 py-1.5 text-small font-medium rounded-lg whitespace-nowrap transition-colors ${
          !activeSlug
            ? 'bg-text-primary text-bg-base'
            : 'bg-bg-elevated text-text-secondary hover:bg-bg-hover hover:text-text-primary'
        }`}
      >
        All
      </Link>
      {categories.map((cat) => {
        const isActive = activeSlug === cat.slug;
        return (
          <Link
            key={cat.id}
            href={`/browse/${cat.slug}`}
            className={`px-3 py-1.5 text-small font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              isActive
                ? 'bg-text-primary text-bg-base'
                : 'bg-bg-elevated text-text-secondary hover:bg-bg-hover hover:text-text-primary'
            }`}
          >
            {cat.label}
            {cat.isSuperLeader && (
              <span
                className="w-1 h-1 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, var(--color-brand-400), var(--color-ember-400))',
                }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}