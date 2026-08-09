import { WatchPageClient } from './client-wrapper';

interface WatchPageProps {
  params: Promise<{ id: string }>;
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { id } = await params;
  return <WatchPageClient videoId={id} />;
}