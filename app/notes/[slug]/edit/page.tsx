'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import NoteEditor from '@/components/note-editor';
import { updateNoteAction, deleteNoteAction } from '@/app/actions';
import type { Note } from '@/lib/notes';

export default function EditNotePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const [note, setNote] = useState<Note | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadNote() {
      try {
        const response = await fetch(`/api/notes/${slug}`);
        if (response.ok) {
          const data = await response.json();
          setNote(data);
        } else {
          alert('Note not found');
          router.push('/');
        }
      } catch (error) {
        console.error('Error loading note:', error);
        alert('Failed to load note');
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    }

    loadNote();
  }, [slug, router]);

  const handleSave = async (updatedNote: Omit<Note, 'slug'>) => {
    if (!note) return;

    setIsSubmitting(true);
    const result = await updateNoteAction(note.slug, updatedNote);

    if (result.success) {
      router.push(`/kb/${note.slug}`);
    } else {
      alert(result.error || 'Failed to update note');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (note) {
      router.push(`/kb/${note.slug}`);
    } else {
      router.push('/');
    }
  };

  const handleDelete = async () => {
    if (!note) return;

    if (confirm('Are you sure you want to delete this note?')) {
      const result = await deleteNoteAction(note.slug);

      if (result.success) {
        router.push('/');
      } else {
        alert(result.error || 'Failed to delete note');
      }
    }
  };

  if (isLoading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (!note) {
    return <div className="text-center py-10">Note not found</div>;
  }

  return (
    <div className="w-full mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Note</h1>
        <p className="text-gray-500 mt-2">
          Update your knowledge base article
        </p>
      </div>

      <NoteEditor
        note={note}
        onSave={handleSave}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />

      <div className="pt-4 border-t">
        <button
          onClick={handleDelete}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Delete Note
        </button>
      </div>
    </div>
  );
}
