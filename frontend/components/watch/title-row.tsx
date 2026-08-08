'use client';

interface TitleRowProps {
  title: string;
  isLive?: boolean;
  liveViewers?: number;
}

export function TitleRow({ title, isLive, liveViewers }: TitleRowProps) {
  return (
    <div className="px-4 md:px-0 py-3 md:py-4">
      <h1 className="text-title-1 text-text-primary leading-tight line-clamp-2">
        {title}
      </h1>
    </div>
  );
}