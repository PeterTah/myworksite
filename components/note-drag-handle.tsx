'use client';

import { NOTE_DRAG_TYPE, type DraggedNote } from '@/lib/note-drag';

// Grip shown on note cards; drag it onto a sidebar category or sub-category to move the note
export default function NoteDragHandle({ note }: { note: DraggedNote }) {
  return (
    <span
      draggable
      role="button"
      tabIndex={-1}
      title="Drag onto a category or sub-category in the sidebar to move"
      aria-label={`Drag ${note.title} to move it`}
      onClick={(e) => e.preventDefault()}
      onDragStart={(e) => {
        e.dataTransfer.setData(NOTE_DRAG_TYPE, JSON.stringify(note));
        e.dataTransfer.setData('text/plain', note.title);
        e.dataTransfer.effectAllowed = 'move';
        const card = e.currentTarget.closest('article');
        if (card) {
          e.dataTransfer.setDragImage(card, 24, 24);
          card.classList.add('opacity-50');
        }
      }}
      onDragEnd={(e) => e.currentTarget.closest('article')?.classList.remove('opacity-50')}
      className="shrink-0 -mr-1 p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-800 cursor-grab active:cursor-grabbing"
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" />
        <circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" />
        <circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" />
      </svg>
    </span>
  );
}
