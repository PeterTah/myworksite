'use client';

import { useState } from 'react';
import type { Note } from '@/lib/notes';

interface ExportButtonProps {
  note: Note;
}

export default function ExportButton({ note }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const exportMarkdown = () => {
    const frontmatter = `---
title: "${note.title}"
description: "${note.description}"
category: "${note.category}"
tags: [${note.tags.map(t => `"${t}"`).join(', ')}]
createdAt: "${note.createdAt}"
updatedAt: "${note.updatedAt}"
---

${note.content}
`;

    const blob = new Blob([frontmatter], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.slug}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const exportPDF = async () => {
    try {
      const response = await fetch(`/api/notes/${note.slug}/export/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${note.slug}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert('Failed to export PDF');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF');
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm text-blue-500 hover:underline"
      >
        Export
      </button>

      {isOpen && (
        <>
          <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg z-10 p-2 space-y-1 min-w-[150px]">
            <button
              onClick={exportMarkdown}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              Export as Markdown
            </button>
            <button
              onClick={exportPDF}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              Export as PDF
            </button>
          </div>
          <div
            className="fixed inset-0 z-0"
            onClick={() => setIsOpen(false)}
          />
        </>
      )}
    </div>
  );
}
