'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NoteEditor from '@/components/note-editor';
import { createNoteAction } from '@/app/actions';

export default function NewNotePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async (note: Parameters<typeof createNoteAction>[0]) => {
    setIsSubmitting(true);
    const result = await createNoteAction(note);

    if (result.success && result.note) {
      router.push(`/kb/${result.note.slug}`);
    } else {
      alert(result.error || 'Failed to create note');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

  return (
    <div className="w-full mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Note</h1>
        <p className="text-gray-500 mt-2">
          Add a new article to your knowledge base
        </p>
      </div>

      <NoteEditor
        onSave={handleSave}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
