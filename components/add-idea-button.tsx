'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import AddIdeaModal from '@/components/add-idea-modal';

interface AddIdeaButtonProps {
  category: string;
  subcategory: string;
  /** 'icon' is the small + used on sidebar rows */
  variant?: 'button' | 'icon';
}

export default function AddIdeaButton({ category, subcategory, variant = 'button' }: AddIdeaButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title={`Add a new idea to ${subcategory}`}
          aria-label={`Add a new idea to ${subcategory}`}
          className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <PlusIcon />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon />
          Add a New Idea
        </button>
      )}
      {/* Portal: the sidebar trigger sits in a hover-only container that hides when the pointer leaves */}
      {open && createPortal(
        <AddIdeaModal category={category} subcategory={subcategory} onClose={() => setOpen(false)} />,
        document.body
      )}
    </>
  );
}

export function PlusIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
