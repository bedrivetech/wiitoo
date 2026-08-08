'use client';

import { useState } from 'react';
import type { Comment } from '@/lib/types';
import { useUiStore } from '@/lib/store';

/* ── Helpers ── */
function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(dateStr).toLocaleDateString();
}

function formatAmount(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n}`;
}

/* ── Sort tabs ── */
const SORT_OPTIONS = [
  { key: 'top' as const, label: 'Top' },
  { key: 'new' as const, label: 'Newest' },
  { key: 'timeline' as const, label: 'Timeline' },
];

/* ── Single comment ── */
interface CommentItemProps {
  comment: Comment;
  depth?: number; /* 0 = top-level, 1 = reply (max) */
  onSeekTo?: (seconds: number) => void;
}

function CommentItem({ comment, depth = 0, onSeekTo }: CommentItemProps) {
  const [reacted, setReacted] = useState<'fire' | 'heart' | 'laugh' | null>(
    comment.userReacted ?? null
  );

  const toggleReaction = (type: 'fire' | 'heart' | 'laugh') => {
    setReacted((prev) => (prev === type ? null : type));
  };

  return (
    <div
      className={`group animate-slide-up ${
        depth === 0 ? 'py-3' : 'py-2 pl-6 md:pl-8'
      } ${comment.isSuperchat ? 'gradient-ember-horizontal rounded-lg px-3 -mx-3' : ''}`}
    >
      <div className="flex gap-2.5">
        {/* Avatar */}
        <div className="shrink-0">
          <div
            className={`w-8 h-8 rounded-full overflow-hidden ${
              comment.author.isExclusive ? 'ring-ember-subtle' : ''
            }`}
          >
            {comment.author.avatarUrl ? (
              <img
                src={comment.author.avatarUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-brand-600/20 flex items-center justify-center">
                <span className="text-xs font-medium text-brand-400">
                  {comment.author.displayName.charAt(0)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          {/* Header: name + badge + time */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-small font-semibold text-text-primary">
              {comment.author.displayName}
            </span>
            {comment.isCreator && (
              <span className="text-tiny font-medium text-brand-400 bg-brand-600/10 px-1.5 py-0.5 rounded">
                Creator
              </span>
            )}
            {comment.isSuperchat && (
              <span className="text-tiny font-semibold text-ember-400">
                {formatAmount(comment.superchatAmount ?? 0)}
              </span>
            )}
            {comment.isPinned && (
              <span className="text-tiny font-medium text-text-muted">
                ★ Pinned
              </span>
            )}
            <span className="text-tiny text-text-muted ml-auto">
              {timeAgo(comment.createdAt)}
            </span>
          </div>

          {/* Text + timestamp link */}
          <div className="mt-0.5">
            <p className="text-small text-text-secondary leading-relaxed">
              {comment.timestamp !== undefined && (
                <button
                  onClick={() => onSeekTo?.(comment.timestamp!)}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-bg-hover text-tiny font-mono text-brand-400 hover:bg-brand-600/20 transition-colors mr-1.5"
                >
                  📌 {formatTimestamp(comment.timestamp)}
                </button>
              )}
              {comment.text}
            </p>
          </div>

          {/* Reactions */}
          <div className="flex items-center gap-1.5 mt-1.5">
            {(
              [
                { type: 'fire' as const, emoji: '🔥', count: comment.reactions.fire },
                { type: 'heart' as const, emoji: '❤️', count: comment.reactions.heart },
                { type: 'laugh' as const, emoji: '😂', count: comment.reactions.laugh },
              ] as const
            ).map((r) => (
              <button
                key={r.type}
                onClick={() => toggleReaction(r.type)}
                className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-tiny transition-all emoji-btn ${
                  reacted === r.type
                    ? 'bg-brand-600/15 text-brand-400'
                    : 'bg-bg-hover text-text-muted hover:bg-bg-active hover:text-text-secondary'
                }`}
              >
                <span className="emoji-icon">{r.emoji}</span>
                {r.count > 0 && <span className="font-medium">{r.count}</span>}
              </button>
            ))}

            {depth === 0 && (
              <button className="text-tiny text-text-muted hover:text-text-secondary transition-colors px-2 py-0.5">
                Reply
              </button>
            )}
          </div>

          {/* Replies (max depth 1 = only shows at top-level) */}
          {depth === 0 && comment.replies && comment.replies.length > 0 && (
            <div className="mt-1 border-l-2 border-bg-border pl-1">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  depth={1}
                  onSeekTo={onSeekTo}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/* ── Composer ── */
function CommentComposer() {
  return (
    <div className="flex items-start gap-2.5 pb-4 border-b border-bg-border">
      {/* User avatar placeholder */}
      <div className="w-8 h-8 rounded-full bg-bg-border shrink-0 flex items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>

      <div className="flex-1">
        <input
          type="text"
          placeholder="Add a comment..."
          className="w-full bg-transparent border-b border-bg-border pb-2 text-small text-text-primary placeholder-text-muted focus:outline-none focus:border-text-muted transition-colors"
        />
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-md text-text-muted hover:text-text-secondary hover:bg-bg-hover transition-all">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </button>
            <button className="p-1.5 rounded-md text-text-muted hover:text-text-secondary hover:bg-bg-hover transition-all">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </button>
          </div>
          <button className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-small font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            Comment
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Comments Section ── */
interface CommentsSectionProps {
  comments: Comment[];
  totalComments?: number;
  onSeekTo?: (seconds: number) => void;
}

export function CommentsSection({
  comments,
  totalComments,
  onSeekTo,
}: CommentsSectionProps) {
  const sort = useUiStore((s) => s.commentSort);
  const setSort = useUiStore((s) => s.setCommentSort);

  /* Separate pinned comments */
  const pinnedComments = comments.filter((c) => c.isPinned);
  const otherComments = comments.filter((c) => !c.isPinned);

  return (
    <div className="px-4 md:px-0 py-2 md:py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-title-3 text-text-primary">
          Comments
          {totalComments !== undefined && (
            <span className="text-text-muted font-normal ml-1">
              · {totalComments.toLocaleString()}
            </span>
          )}
        </h2>

        {/* Sort tabs */}
        <div className="flex items-center bg-bg-raised rounded-lg p-0.5">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSort(opt.key)}
              className={`px-3 py-1.5 text-tiny font-medium rounded-md transition-all ${
                sort === opt.key
                  ? 'bg-bg-hover text-text-primary'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Composer */}
      <CommentComposer />

      {/* Timeline hint */}
      {sort === 'timeline' && (
        <div className="flex items-center gap-2 py-3 text-tiny text-text-muted">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Comments are sorted by video timestamp. Click 📌 to seek.
        </div>
      )}

      {/* Pinned comments */}
      {pinnedComments.length > 0 && (
        <div className="mb-2 pb-2 border-b border-bg-border">
          {pinnedComments.map((c) => (
            <CommentItem key={c.id} comment={c} onSeekTo={onSeekTo} />
          ))}
        </div>
      )}

      {/* Comments list */}
      <div className="divide-y divide-bg-border/50">
        {otherComments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onSeekTo={onSeekTo}
          />
        ))}
      </div>
    </div>
  );
}