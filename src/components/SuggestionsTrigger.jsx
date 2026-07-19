'use client';

import { ChevronRight } from 'lucide-react';
import SuggestionsModal from '@/components/SuggestionsModal';

export default function SuggestionsTrigger() {
  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('open-suggestions'));
          }
        }}
        className="inline-flex items-center gap-2 transition-colors hover:text-foreground text-left"
      >
        <ChevronRight className="size-4" />
        Requests & Suggestions
      </button>
      <SuggestionsModal />
    </>
  );
}
