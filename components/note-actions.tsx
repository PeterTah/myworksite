'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteNoteAction } from '@/app/actions';

interface NoteActionsProps {
  slug: string;
  title: string;
  /** Where to go after deleting; omit to stay on the current page and refresh it */
  redirectTo?: string;
  size?: 'sm' | 'md';
  /** 'text' renders plain "Edit | Delete" links */
  variant?: 'buttons' | 'text';
}

export default function NoteActions({ slug, title, redirectTo, size = 'md', variant = 'buttons' }: NoteActionsProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const pad = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  const base = `inline-flex items-center gap-1.5 rounded-md border transition ${pad}`;

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteNoteAction(slug);
      if (!result.success) {
        setError(result.error || 'Failed to delete note');
        return;
      }
      setConfirming(false);
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  };

  if (confirming) {
    return (
      <div className="inline-flex items-center gap-2 flex-wrap" role="alertdialog" aria-label={`Delete ${title}?`}>
        <span className={`text-red-700 dark:text-red-400 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          Delete this note permanently?
        </span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className={`${base} border-red-600 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50`}
        >
          {isPending ? 'Deleting…' : 'Delete'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className={`${base} border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800`}
        >
          Cancel
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className="inline-flex items-center gap-2 text-sm">
        <Link href={`/notes/${slug}/edit`} aria-label={`Edit ${title}`} className="text-blue-600 dark:text-blue-400 hover:underline">
          Edit
        </Link>
        <span className="text-gray-300 dark:text-gray-600" aria-hidden>|</span>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label={`Delete ${title}`}
          className="text-red-600 dark:text-red-400 hover:underline"
        >
          Delete
        </button>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <Link
        href={`/notes/${slug}/edit`}
        aria-label={`Edit ${title}`}
        className={`${base} border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
        Edit
      </Link>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Delete ${title}`}
        className={`${base} border-gray-300 dark:border-gray-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        </svg>
        Delete
      </button>
    </div>
  );
}
