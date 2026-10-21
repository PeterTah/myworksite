import { marked } from 'marked';
import { getNoteBySlug, calculateReadingTime, type Note, type NoteMetadata } from '@/lib/notes';
import { addHeadingIds } from '@/lib/headings';

export interface NoteCardData {
  note: Note;
  html: string;
  readingTime: number;
}

// Loads full content for a list of notes, most recently edited first
export async function loadNoteCards(metas: NoteMetadata[]): Promise<NoteCardData[]> {
  const sorted = [...metas].sort((a, b) =>
    (b.updatedAt ?? b.createdAt ?? '').localeCompare(a.updatedAt ?? a.createdAt ?? '')
  );

  const cards = await Promise.all(sorted.map(async (meta) => {
    const note = await getNoteBySlug(meta.slug);
    if (!note) return null;
    const raw = note.contentType === 'html' ? note.content : await marked(note.content);
    return {
      note,
      html: addHeadingIds(raw, `${note.slug}--`),
      readingTime: calculateReadingTime(note.content),
    };
  }));

  return cards.filter((c): c is NoteCardData => c !== null);
}
