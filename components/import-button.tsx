'use client';

import { useState, useRef } from 'react';
import { importNoteAction } from '@/app/actions';
import { useRouter } from 'next/navigation';

export default function ImportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const content = await file.text();
      const result = await importNoteAction(file.name, content);

      if (result.success) {
        alert('Note imported successfully!');
        router.push(`/kb/${result.note?.slug}`);
      } else {
        alert(result.error || 'Failed to import note');
      }
    } catch (error) {
      console.error('Error importing file:', error);
      alert('Failed to import file');
    } finally {
      setIsImporting(false);
      setIsOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        Import
      </button>

      {isOpen && (
        <>
          <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg z-10 p-4 min-w-[300px]">
            <h3 className="font-medium mb-2">Import Markdown File</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Upload a .md file to import as a new note
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md"
              onChange={handleFileSelect}
              disabled={isImporting}
              className="w-full text-sm"
            />
            {isImporting && (
              <p className="text-sm text-blue-500 mt-2">Importing...</p>
            )}
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
