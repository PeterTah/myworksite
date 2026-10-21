'use server';

import { revalidatePath } from 'next/cache';
import { createNote, updateNote, deleteNote, type Note } from '@/lib/notes';

export async function createNoteAction(note: Omit<Note, 'slug'> & { slug?: string }) {
  try {
    const newNote = await createNote(note);
    revalidatePath('/');
    revalidatePath('/kb/[slug]');
    return { success: true, note: newNote };
  } catch (error) {
    console.error('Error creating note:', error);
    return { success: false, error: 'Failed to create note' };
  }
}

export async function updateNoteAction(slug: string, note: Omit<Note, 'slug'>) {
  try {
    const updatedNote = await updateNote(slug, note);
    if (!updatedNote) {
      return { success: false, error: 'Note not found' };
    }
    revalidatePath('/');
    revalidatePath('/kb/[slug]');
    revalidatePath(`/kb/${slug}`);
    return { success: true, note: updatedNote };
  } catch (error) {
    console.error('Error updating note:', error);
    return { success: false, error: 'Failed to update note' };
  }
}

export async function deleteNoteAction(slug: string) {
  try {
    const deleted = await deleteNote(slug);
    if (!deleted) {
      return { success: false, error: 'Note not found' };
    }
    revalidatePath('/');
    revalidatePath('/kb/[slug]');
    return { success: true };
  } catch (error) {
    console.error('Error deleting note:', error);
    return { success: false, error: 'Failed to delete note' };
  }
}
