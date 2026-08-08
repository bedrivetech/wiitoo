'use client';

import Header from '@/components/layout/header';
import SideRail from '@/components/layout/side-rail';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <SideRail />
      <div className="flex-1 min-w-0">
        <Header />
        <main className="min-h-[calc(100vh-3rem)]">{children}</main>
      </div>
    </div>
  );
}