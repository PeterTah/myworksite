import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const NOTES_DIR = path.join(process.cwd(), 'notes');

// Resolve a slug to its file, rejecting anything that could escape NOTES_DIR (e.g. "../")
function notePath(slug: string): string {
  if (!/^[\w-]+$/.test(slug)) {
    throw new Error(`Invalid note slug: ${slug}`);
  }
  return path.join(NOTES_DIR, `${slug}.md`);
}

export interface Note {
  slug: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  tags: string[];
  content: string;
  contentType: 'markdown' | 'html';
  createdAt?: string;
  updatedAt?: string;
}

export interface NoteMetadata {
  slug: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  tags: string[];
  contentType: 'markdown' | 'html';
  createdAt?: string;
  updatedAt?: string;
}

// Get all notes with metadata
export async function getAllNotes(): Promise<NoteMetadata[]> {
  if (!fs.existsSync(NOTES_DIR)) {
    return [];
  }

  const files = fs.readdirSync(NOTES_DIR).filter(file => file.endsWith('.md'));

  const notes = files.map(file => {
    const filePath = path.join(NOTES_DIR, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(fileContent);

    return {
      slug: file.replace('.md', ''),
      title: data.title || 'Untitled',
      description: data.description || '',
      category: data.category || 'Uncategorized',
      subcategory: data.subcategory || undefined,
      tags: data.tags || [],
      contentType: data.contentType || 'markdown',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  });

  return notes;
}

// Get a single note by slug
export async function getNoteBySlug(slug: string): Promise<Note | null> {
  if (!/^[\w-]+$/.test(slug)) return null;
  const filePath = notePath(slug);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  return {
    slug,
    title: data.title || 'Untitled',
    description: data.description || '',
    category: data.category || 'Uncategorized',
    subcategory: data.subcategory || undefined,
    tags: data.tags || [],
    content,
    contentType: data.contentType || 'markdown',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

// Create a new note
export async function createNote(note: Omit<Note, 'slug'> & { slug?: string }): Promise<Note> {
  if (!fs.existsSync(NOTES_DIR)) {
    fs.mkdirSync(NOTES_DIR, { recursive: true });
  }

  const slug = note.slug || uniqueSlug(generateSlug(note.title));
  const filePath = notePath(slug);
  const now = new Date().toISOString();

  const frontmatter = matter.stringify(note.content, toFrontmatter(note, now, now));

  fs.writeFileSync(filePath, frontmatter, 'utf-8');

  return {
    ...note,
    slug,
    createdAt: now,
    updatedAt: now,
  };
}

// Update an existing note
export async function updateNote(slug: string, note: Omit<Note, 'slug'>): Promise<Note | null> {
  const filePath = notePath(slug);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const existing = await getNoteBySlug(slug);
  const now = new Date().toISOString();

  const frontmatter = matter.stringify(note.content, toFrontmatter(note, existing?.createdAt || now, now));

  fs.writeFileSync(filePath, frontmatter, 'utf-8');

  return {
    slug,
    ...note,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
}

// Move a note to another category / sub-category without touching its content or edit date
export async function moveNote(slug: string, category: string, subcategory?: string): Promise<boolean> {
  const filePath = notePath(slug);
  if (!fs.existsSync(filePath)) {
    return false;
  }

  // Passing options bypasses gray-matter's parse cache, so mutating `data` below can't leak into it
  const { data, content } = matter(fs.readFileSync(filePath, 'utf-8'), {});
  data.category = category;
  if (subcategory) data.subcategory = subcategory;
  else delete data.subcategory;

  fs.writeFileSync(filePath, matter.stringify(content, data), 'utf-8');
  return true;
}

// Delete a note
export async function deleteNote(slug: string): Promise<boolean> {
  const filePath = notePath(slug);

  if (!fs.existsSync(filePath)) {
    return false;
  }

  fs.unlinkSync(filePath);
  return true;
}

// Frontmatter written for a note; optional fields are omitted when empty (YAML can't store undefined)
function toFrontmatter(note: Omit<Note, 'slug'>, createdAt: string, updatedAt: string) {
  const data: Record<string, unknown> = {
    title: note.title,
    description: note.description,
    category: note.category,
  };
  if (note.subcategory?.trim()) data.subcategory = note.subcategory.trim();
  data.tags = note.tags || [];
  data.contentType = note.contentType || 'markdown';
  data.createdAt = createdAt;
  data.updatedAt = updatedAt;
  return data;
}

// Append -2, -3, ... so a new note never overwrites an existing one with the same title
function uniqueSlug(base: string): string {
  let slug = base;
  for (let n = 2; fs.existsSync(path.join(NOTES_DIR, `${slug}.md`)); n++) {
    slug = `${base}-${n}`;
  }
  return slug;
}

// Generate a URL-friendly slug from a title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || `note-${Date.now()}`;
}

// Get notes grouped by category
export async function getNotesByCategory(): Promise<{ category: string; items: NoteMetadata[] }[]> {
  const notes = await getAllNotes();

  const grouped = notes.reduce((acc, note) => {
    const category = note.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(note);
    return acc;
  }, {} as Record<string, NoteMetadata[]>);

  return Object.entries(grouped).map(([category, items]) => ({
    category,
    items,
  }));
}

// Search notes by query, category, and tags
export async function searchNotes(query: string, category?: string, tags?: string[]): Promise<NoteMetadata[]> {
  const notes = await getAllNotes();

  return notes.filter(note => {
    const matchesQuery = !query ||
      note.title.toLowerCase().includes(query.toLowerCase()) ||
      note.description.toLowerCase().includes(query.toLowerCase());

    const matchesCategory = !category || note.category === category;

    const matchesTags = !tags || tags.length === 0 ||
      tags.every(tag => note.tags.includes(tag));

    return matchesQuery && matchesCategory && matchesTags;
  });
}

// Get all unique tags
export async function getAllTags(): Promise<string[]> {
  const notes = await getAllNotes();
  const tagSet = new Set<string>();

  notes.forEach(note => {
    note.tags.forEach(tag => tagSet.add(tag));
  });

  return Array.from(tagSet).sort();
}

// Calculate reading time (average 200 words per minute)
export function calculateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / 200);
}

// Get related notes based on category and tags
export async function getRelatedNotes(currentSlug: string, category: string, tags: string[]): Promise<NoteMetadata[]> {
  const allNotes = await getAllNotes();

  return allNotes
    .filter(note => note.slug !== currentSlug)
    .map(note => {
      let score = 0;

      // Same category
      if (note.category === category) {
        score += 2;
      }

      // Shared tags
      const sharedTags = note.tags.filter(tag => tags.includes(tag));
      score += sharedTags.length;

      return { note, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => item.note);
}
