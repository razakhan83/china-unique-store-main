'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function ProductDescription({ html, className }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!html) return null;

  return (
    <div className={cn('pt-1', className)}>
      {/* Section heading */}
      <div className="mb-3 flex items-center gap-2.5">
        <div className="h-5 w-1 rounded-full bg-primary" />
        <h2 className="text-base font-bold text-foreground">Description</h2>
      </div>

      {/* Description content */}
      <div className="surface-card rounded-xl p-4 md:p-5">
        <div
          className={cn(
            'overflow-hidden text-[15px] leading-relaxed text-muted-foreground transition-[max-height] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]',
            !isExpanded && 'line-clamp-[9]'
          )}
        >
          <div
            className="[&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_h1]:my-3 [&_h1]:text-2xl [&_h1]:font-black [&_h2]:my-3 [&_h2]:text-xl [&_h2]:font-bold [&_img]:my-4 [&_img]:max-w-full [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-2xl [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_video]:my-4 [&_video]:max-w-full"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>

        {/* Expand / collapse toggle */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="mt-2 h-8 gap-1.5 px-2 text-xs font-semibold text-primary hover:bg-primary/8 hover:text-primary"
        >
          {isExpanded ? (
            <>
              Show Less <ChevronUp className="size-3.5" />
            </>
          ) : (
            <>
              Read More <ChevronDown className="size-3.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
