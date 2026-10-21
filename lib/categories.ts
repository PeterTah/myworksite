import fs from 'fs';
import path from 'path';
import { getAllNotes, type NoteMetadata } from '@/lib/notes';

// Categories and sub-categories created from the sidebar are stored here so they exist before any note uses them
export const CATEGORIES_FILE = path.join(process.cwd(), 'notes', '_categories.json');

interface CategoryRegistry {
  categories: { name: string; subcategories: string[] }[];
}

export interface SubcategoryNode {
  name: string;
  notes: NoteMetadata[];
}

export interface CategoryNode {
  name: string;
  /** Notes filed directly under the category (no sub-category) */
  notes: NoteMetadata[];
  subcategories: SubcategoryNode[];
  /** Total notes including sub-categories */
  count: number;
}

const MAX_NAME_LENGTH = 60;

function readRegistry(): CategoryRegistry {
  try {
    const data = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf-8'));
    if (Array.isArray(data?.categories)) return data;
  } catch {
    // Missing or unreadable file: start empty
  }
  return { categories: [] };
}

function writeRegistry(registry: CategoryRegistry) {
  fs.mkdirSync(path.dirname(CATEGORIES_FILE), { recursive: true });
  fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(registry, null, 2) + '\n', 'utf-8');
}

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

export function validateName(raw: string): string {
  const name = raw.trim().replace(/\s+/g, ' ');
  if (!name) throw new Error('Name is required');
  if (name.length > MAX_NAME_LENGTH) throw new Error(`Name must be ${MAX_NAME_LENGTH} characters or fewer`);
  if (name.includes('/')) throw new Error('Name cannot contain "/"');
  return name;
}

// Category tree built from the registry plus every category/sub-category used by a note
export async function getCategoryTree(): Promise<CategoryNode[]> {
  const notes = await getAllNotes();
  const registry = readRegistry();
  const tree: CategoryNode[] = [];

  const findCategory = (name: string) => {
    let node = tree.find(c => same(c.name, name));
    if (!node) {
      node = { name, notes: [], subcategories: [], count: 0 };
      tree.push(node);
    }
    return node;
  };
  const findSub = (cat: CategoryNode, name: string) => {
    let node = cat.subcategories.find(s => same(s.name, name));
    if (!node) {
      node = { name, notes: [] };
      cat.subcategories.push(node);
    }
    return node;
  };

  registry.categories.forEach(c => {
    const cat = findCategory(c.name);
    c.subcategories.forEach(s => findSub(cat, s));
  });

  notes.forEach(note => {
    const cat = findCategory(note.category || 'Uncategorized');
    if (note.subcategory) findSub(cat, note.subcategory).notes.push(note);
    else cat.notes.push(note);
    cat.count++;
  });

  return tree;
}

export async function findSubcategory(category: string, subcategory: string) {
  const tree = await getCategoryTree();
  const cat = tree.find(c => same(c.name, category));
  const sub = cat?.subcategories.find(s => same(s.name, subcategory));
  return cat && sub ? { category: cat, subcategory: sub } : null;
}

export async function addCategory(rawName: string): Promise<string> {
  const name = validateName(rawName);
  const tree = await getCategoryTree();
  const existing = tree.find(c => same(c.name, name));
  if (existing) throw new Error(`Category "${existing.name}" already exists`);

  const registry = readRegistry();
  registry.categories.push({ name, subcategories: [] });
  writeRegistry(registry);
  return name;
}

export async function addSubcategory(rawCategory: string, rawName: string): Promise<{ category: string; subcategory: string }> {
  const name = validateName(rawName);
  const tree = await getCategoryTree();
  const cat = tree.find(c => same(c.name, rawCategory));
  if (!cat) throw new Error(`Category "${rawCategory}" not found`);
  const existingSub = cat.subcategories.find(s => same(s.name, name));
  if (existingSub) throw new Error(`Sub-category "${existingSub.name}" already exists in ${cat.name}`);

  const registry = readRegistry();
  let entry = registry.categories.find(c => same(c.name, cat.name));
  if (!entry) {
    // Category so far only existed through its notes
    entry = { name: cat.name, subcategories: [] };
    registry.categories.push(entry);
  }
  entry.subcategories.push(name);
  writeRegistry(registry);
  return { category: cat.name, subcategory: name };
}

// Only empty categories/sub-categories can be removed, so no note is ever orphaned
export async function removeCategory(category: string, subcategory?: string) {
  const tree = await getCategoryTree();
  const cat = tree.find(c => same(c.name, category));
  if (!cat) throw new Error('Category not found');

  if (subcategory) {
    const sub = cat.subcategories.find(s => same(s.name, subcategory));
    if (!sub) throw new Error('Sub-category not found');
    if (sub.notes.length > 0) throw new Error('Move or delete its notes first');
  } else if (cat.count > 0) {
    throw new Error('Move or delete its notes first');
  }

  const registry = readRegistry();
  if (subcategory) {
    const entry = registry.categories.find(c => same(c.name, category));
    if (entry) entry.subcategories = entry.subcategories.filter(s => !same(s, subcategory));
  } else {
    registry.categories = registry.categories.filter(c => !same(c.name, category));
  }
  writeRegistry(registry);
}
