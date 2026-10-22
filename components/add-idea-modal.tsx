'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/components/rich-text-editor';
import { createNoteAction } from '@/app/actions';
import { isServiceRequest, srTemplateHtml } from '@/lib/sr-template';

interface AddIdeaModalProps {
  category: string;
  subcategory: string;
  onClose: () => void;
}

const PLACEHOLDER_CONTENT = '<p><em>Idea placeholder: add details when you are ready.</em></p>';

// Tiptap's HTML for an editor with no text
const isEmptyHtml = (html: string) => html.replace(/<[^>]+>/g, '').trim() === '';

export default function AddIdeaModal({ category, subcategory, onClose }: AddIdeaModalProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const isSr = isServiceRequest(category);
  const [title, setTitle] = useState(subcategory);
  // SR template is stamped with the time the dialog opened
  const [content, setContent] = useState(() => (isSr ? srTemplateHtml() : ''));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Open as a native modal: focus trapping, Esc to close and the backdrop come for free
  useEffect(() => {
    dialogRef.current?.showModal();
    titleRef.current?.select();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(isSr ? 'Give the SR a title' : 'Give the idea a title');
      titleRef.current?.focus();
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createNoteAction({
        title: title.trim(),
        description: '',
        category,
        subcategory,
        tags: [],
        content: isEmptyHtml(content) ? PLACEHOLDER_CONTENT : content,
        contentType: 'html',
      });
      if (!result.success) {
        setError(result.error || (isSr ? 'Failed to add SR' : 'Failed to add idea'));
        return;
      }
      router.refresh();
      onClose();
    });
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => { if (e.target === dialogRef.current && !isPending) onClose(); }}
      aria-labelledby="add-idea-title"
      className="m-auto w-[min(42rem,calc(100vw-2rem))] max-h-[calc(100vh-2rem)] rounded-xl p-0 shadow-2xl
        bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 backdrop:bg-black/40"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="add-idea-title" className="text-xl font-semibold">{isSr ? 'New SR' : 'Add a New Idea'}</h2>
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {category} / {subcategory}
          </span>
        </div>

        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={isSr ? 'e.g. SR 12345678 – vSAN disk group offline' : 'e.g. Magnesium timing vs. absorption'}
          aria-label={isSr ? 'SR title' : 'Idea title'}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5
            focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <RichTextEditor
          variant="compact"
          content={content}
          onChange={setContent}
          placeholder="Write as much or as little as you want — use the toolbar for headings, bold, lists, and more."
        />

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-sm font-semibold tracking-wide rounded-lg border border-gray-300 dark:border-gray-600
              hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            CANCEL
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 text-sm font-semibold tracking-wide rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? 'ADDING…' : isSr ? 'ADD SR' : 'ADD IDEA'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
