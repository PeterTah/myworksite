'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function BackupButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleBackup = async () => {
    try {
      const response = await fetch('/api/backup');
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.download = `knowledge-base-backup-${timestamp}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert('Failed to create backup');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Failed to create backup');
    }
    setIsOpen(false);
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);

    try {
      const formData = new FormData();
      formData.append('backup', file);

      const response = await fetch('/api/backup/restore', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        alert(`Backup restored successfully! Imported ${result.imported} notes.`);
        router.refresh();
      } else {
        alert(`Restore failed: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      alert('Failed to restore backup');
    } finally {
      setIsRestoring(false);
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
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
      >
        Backup
      </button>

      {isOpen && (
        <>
          <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg z-10 p-4 min-w-[300px]">
            <h3 className="font-medium mb-3">Backup & Restore</h3>
            <div className="space-y-3">
              <button
                onClick={handleBackup}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Download Backup
              </button>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Restore from backup:
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  onChange={handleRestore}
                  disabled={isRestoring}
                  className="w-full text-sm"
                />
                {isRestoring && (
                  <p className="text-sm text-blue-500 mt-2">Restoring...</p>
                )}
              </div>
            </div>
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
