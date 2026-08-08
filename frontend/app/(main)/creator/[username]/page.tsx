'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import FolderView from '@/components/browse/creator-folder';
import { getCreator, getVideosByCreator } from '@/lib/mock-data';

export default function CreatorPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const creator = getCreator(username);
  const videos = getVideosByCreator(username);

  if (!creator) {
    notFound();
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-5">
      <FolderView creator={creator} videos={videos} />
    </div>
  );
}