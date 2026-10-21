// Shared between note cards (drag source) and the sidebar (drop targets)
export const NOTE_DRAG_TYPE = 'application/x-kb-note';

export interface DraggedNote {
  slug: string;
  title: string;
  category: string;
  subcategory?: string;
}
