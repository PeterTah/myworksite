'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { moveNoteAction } from '@/app/actions';

export interface MoveDestination {
  category: string;
  subcategories: string[];
}

interface MoveToMenuProps {
  slug: string;
  title: string;
  category: string;
  subcategory?: string;
  destinations: MoveDestination[];
}

const same = (a?: string, b?: string) => (a ?? '').toLowerCase() === (b ?? '').toLowerCase();

// Keyboard- and touch-friendly alternative to dragging a card onto the sidebar
export default function MoveToMenu({ slug, title, category, subcategory, destinations }: MoveToMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const move = (toCategory: string, toSubcategory?: string) => {
    setError(null);
    startTransition(async () => {
      const result = await moveNoteAction(slug, toCategory, toSubcategory);
      if (!result.success) {
        setError(result.error || 'Failed to move note');
        return;
      }
      setOpen(false);
      router.refresh();
    });
  };

  const item = (label: string, toCategory: string, toSubcategory: string | undefined, indent: boolean) => {
    const current = same(toCategory, category) && same(toSubcategory, subcategory);
    return (
      <li key={`${toCategory}/${toSubcategory ?? ''}`}>
        <button
          type="button"
          role="menuitem"
          disabled={current || isPending}
          onClick={() => move(toCategory, toSubcategory)}
          className={`w-full text-left px-3 py-1.5 rounded flex items-center justify-between gap-3
            hover:bg-gray-100 dark:hover:bg-gray-700 disabled:cursor-default disabled:hover:bg-transparent
            ${indent ? 'pl-7 text-gray-700 dark:text-gray-300' : 'font-medium'}
            ${current ? 'text-blue-600 dark:text-blue-400' : ''}`}
        >
          <span className="truncate">{label}</span>
          {current && <span className="text-xs shrink-0">current</span>}
        </button>
      </li>
    );
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Move ${title} to another category`}
        className="text-blue-600 dark:text-blue-400 hover:underline"
      >
        {isPending ? 'Moving…' : 'Move to…'}
      </button>

      {open && (
        <div
          role="menu"
          aria-label={`Move ${title} to`}
          className="absolute left-0 top-full mt-2 z-30 w-64 max-w-[calc(100vw-2rem)] max-h-80 overflow-y-auto p-1.5 text-sm
            bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
        >
          <p className="px-3 pt-1 pb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Move to
          </p>
          <ul>
            {destinations.map(dest => (
              <li key={dest.category}>
                <ul>
                  {item(dest.category, dest.category, undefined, false)}
                  {dest.subcategories.map(sub => item(sub, dest.category, sub, true))}
                </ul>
              </li>
            ))}
          </ul>
          {error && <p className="px-3 py-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}
