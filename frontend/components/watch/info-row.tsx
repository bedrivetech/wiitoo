'use client';

import { useState, useCallback } from 'react';
import type { Creator } from '@/lib/types';
import { ShareModal } from './share-modal';

interface InfoRowProps {
  creator: Creator;
  views: number;
  likes: number;
  dislikes?: number;
  publishedAt: string;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function InfoRow({ creator, views, likes, dislikes = 0, publishedAt }: InfoRowProps) {
  const [isFollowing, setIsFollowing] = useState(creator.following);
  const [likeState, setLikeState] = useState<'none' | 'like' | 'dislike'>('none');
  const [likeCount, setLikeCount] = useState(likes);
  const [dislikeCount] = useState(dislikes);
  const [shareOpen, setShareOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const isSubscribed = creator.subscribed;

  const handleLike = useCallback(() => {
    if (likeState === 'like') {
      setLikeState('none');
      setLikeCount((c) => c - 1);
    } else if (likeState === 'dislike') {
      setLikeState('like');
      setLikeCount((c) => c + 2);
    } else {
      setLikeState('like');
      setLikeCount((c) => c + 1);
    }
  }, [likeState]);

  const handleDislike = useCallback(() => {
    if (likeState === 'dislike') {
      setLikeState('none');
    } else if (likeState === 'like') {
      setLikeState('dislike');
      setLikeCount((c) => c - 1);
    } else {
      setLikeState('dislike');
    }
  }, [likeState]);

  return (
    <div className="px-4 md:px-0 pb-3 md:pb-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        {/* Creator info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className={`w-10 h-10 rounded-full overflow-hidden ${creator.isExclusive ? 'ring-ember-subtle' : ''}`}>
              {creator.avatarUrl ? (
                <img src={creator.avatarUrl} alt={creator.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-brand-600/30 flex items-center justify-center">
                  <span className="text-sm font-semibold text-brand-300">
                    {creator.displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            {creator.isExclusive && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-ember-500 rounded-full flex items-center justify-center shadow-md">
                <svg width="8" height="8" viewBox="0 0 16 16" fill="white">
                  <path d="M8 1l2.2 4.5L15 6.3l-3.5 3.4.8 4.8L8 12.2l-4.3 2.3.8-4.8L1 6.3l4.8-.8z" />
                </svg>
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <button className="text-text-primary font-semibold text-small hover:text-brand-400 transition-colors truncate">
                {creator.displayName}
              </button>
              {creator.badges?.map((badge) => (
                <span
                  key={badge.type}
                  className={`text-tiny font-medium px-1.5 py-0.5 rounded ${
                    badge.type === 'exclusive'
                      ? 'bg-ember-500/10 text-ember-400'
                      : badge.type === 'verified'
                      ? 'bg-brand-600/10 text-brand-400'
                      : 'bg-bg-border text-text-muted'
                  }`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
            <span className="text-text-muted text-tiny">
              @{creator.username} · {formatCount(creator.followers)} followers
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:ml-auto">
          <button
            onClick={() => setIsFollowing(!isFollowing)}
            className={`px-4 py-1.5 rounded-lg text-small font-medium transition-all duration-200 ${
              isFollowing
                ? 'bg-bg-border text-text-secondary hover:bg-bg-hover'
                : 'bg-white text-black hover:bg-white/90'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>

          <button
            className={`px-4 py-1.5 rounded-lg text-small font-semibold transition-all duration-200 ${
              isSubscribed
                ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30'
                : 'bg-brand-600 hover:bg-brand-500 text-white shadow-sm shadow-brand-600/20'
            }`}
          >
            {isSubscribed ? 'Subscribed' : 'Subscribe'}
          </button>

          <button className="px-3 py-1.5 rounded-lg text-small font-medium bg-ember-500/10 text-ember-400 hover:bg-ember-500/20 border border-ember-500/20 transition-all duration-200">
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Tip
            </span>
          </button>
        </div>
      </div>

      {/* Stats row — now includes toggleable like/dislike */}
      <div className="flex items-center gap-2 mt-3 text-text-muted text-tiny flex-wrap">
        <span>{formatCount(views)} views</span>
        <span className="w-1 h-1 rounded-full bg-text-muted/30 shrink-0" />
        <span>{timeAgo(publishedAt)}</span>
        <span className="w-1 h-1 rounded-full bg-text-muted/30 shrink-0" />

        {/* Like button */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
            likeState === 'like'
              ? 'text-brand-400 bg-brand-600/10'
              : 'hover:text-text-secondary hover:bg-bg-hover'
          }`}
          title="Like"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={likeState === 'like' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-150">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
          </svg>
          {likeCount > 0 && <span className="tabular-nums">{formatCount(likeCount)}</span>}
        </button>

        {/* Dislike button */}
        <button
          onClick={handleDislike}
          className={`flex items-center px-2 py-1 rounded-md transition-all ${
            likeState === 'dislike'
              ? 'text-amber-400 bg-amber-500/10'
              : 'hover:text-text-secondary hover:bg-bg-hover'
          }`}
          title="Dislike"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={likeState === 'dislike' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="scale-y-[-1] transition-transform duration-150">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
          </svg>
          {dislikeCount > 0 && <span className="tabular-nums ml-1">{formatCount(dislikeCount)}</span>}
        </button>
      </div>

      {/* Utility actions row */}
      <div className="flex items-center gap-1 mt-2">
        {/* Share — opens modal */}
        <button
          onClick={() => setShareOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-tiny text-text-muted hover:text-text-secondary hover:bg-bg-hover transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Share
        </button>

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-tiny text-text-muted hover:text-text-secondary hover:bg-bg-hover transition-all">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15.75 15.75l-2.51-2.51" />
            <path d="M7.5 22.5l2.51-2.51" />
            <path d="M3.75 12h5" />
            <circle cx="18" cy="5.25" r="2.25" />
            <circle cx="6" cy="18" r="2.25" />
            <circle cx="18" cy="18" r="2.25" />
          </svg>
          Clip
        </button>

        {/* Save — toggles */}
        <button
          onClick={() => setSaved(!saved)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-tiny transition-all ${
            saved
              ? 'text-brand-400 bg-brand-600/10'
              : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
          </svg>
          {saved ? 'Saved' : 'Save'}
        </button>

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-tiny text-text-muted hover:text-text-secondary hover:bg-bg-hover transition-all">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
          </svg>
        </button>
      </div>

      {/* Share modal */}
      <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} title={typeof window !== 'undefined' ? document.title : ''} />
    </div>
  );
}