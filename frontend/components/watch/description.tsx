'use client';

import { useState } from 'react';

interface DescriptionProps {
  text: string;
}

export function Description({ text }: DescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const lines = text.split('\n');
  const isLong = lines.length > 3 || text.length > 280;

  return (
    <div className="px-4 md:px-0 pb-3">
      <div
        className={`bg-bg-raised rounded-xl p-3 md:p-4 transition-all duration-200 ${
          expanded ? '' : 'cursor-pointer'
        }`}
        onClick={() => !expanded && setExpanded(true)}
      >
        <div className={`text-small text-text-secondary leading-relaxed whitespace-pre-wrap ${
          expanded ? '' : 'line-clamp-3'
        }`}>
          {text}
        </div>
        {isLong && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="mt-2 text-small font-medium text-text-muted hover:text-text-secondary transition-colors"
          >
            {expanded ? 'Show less' : '... more'}
          </button>
        )}
      </div>
    </div>
  );
}