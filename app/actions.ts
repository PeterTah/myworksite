'use server';

import { revalidatePath } from 'next/cache';
import matter from 'gray-matter';
import { createNote, updateNote, deleteNote, moveNote, type Note } from '@/lib/notes';
import { addCategory, addSubcategory, removeCategory, validateName } from '@/lib/categories';

export async function createNoteAction(note: Omit<Note, 'slug'> & { slug?: string }) {
  try {
    const newNote = await createNote(note);
    // Notes appear in the home page, sidebar and article pages
    revalidatePath('/', 'layout');
    return { success: true, note: newNote };
  } catch (error) {
    console.error('Error creating note:', error);
    return { success: false, error: 'Failed to create note' };
  }
}

export async function importNoteAction(fileName: string, raw: string) {
  const { data, content } = matter(raw);
  return createNoteAction({
    title: data.title || fileName.replace(/\.md$/, ''),
    description: data.description || '',
    category: data.category || 'Uncategorized',
    tags: data.tags || [],
    content,
    contentType: 'markdown',
  });
}

export async function updateNoteAction(slug: string, note: Omit<Note, 'slug'>) {
  try {
    const updatedNote = await updateNote(slug, note);
    if (!updatedNote) {
      return { success: false, error: 'Note not found' };
    }
    // Notes appear in the home page, sidebar and article pages
    revalidatePath('/', 'layout');
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
    // Notes appear in the home page, sidebar and article pages
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Error deleting note:', error);
    return { success: false, error: 'Failed to delete note' };
  }
}

export async function createCategoryAction(name: string) {
  try {
    const category = await addCategory(name);
    revalidatePath('/', 'layout');
    return { success: true, category };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create category' };
  }
}

export async function createSubcategoryAction(category: string, name: string) {
  try {
    const result = await addSubcategory(category, name);
    revalidatePath('/', 'layout');
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create sub-category' };
  }
}

export async function deleteCategoryAction(category: string, subcategory?: string) {
  try {
    await removeCategory(category, subcategory);
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete' };
  }
}

export async function moveNoteAction(slug: string, category: string, subcategory?: string) {
  try {
    const moved = await moveNote(slug, validateName(category), subcategory ? validateName(subcategory) : undefined);
    if (!moved) {
      return { success: false, error: 'Note not found' };
    }
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to move note' };
  }
}
