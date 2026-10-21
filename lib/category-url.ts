// Client-safe URL helpers for category pages
export function categoryHref(category: string) {
  return `/category/${encodeURIComponent(category)}`;
}

export function subcategoryHref(category: string, subcategory: string) {
  return `${categoryHref(category)}/${encodeURIComponent(subcategory)}`;
}

// A note shown expanded inside its category or sub-category list
export function noteViewHref(note: { slug: string; category: string; subcategory?: string }) {
  const base = note.subcategory ? subcategoryHref(note.category, note.subcategory) : categoryHref(note.category);
  return `${base}?note=${encodeURIComponent(note.slug)}#note-${note.slug}`;
}
