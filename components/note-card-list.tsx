import NoteCard from "@/components/note-card";
import CodeEnhancer from "@/components/code-enhancer";
import ImageZoom from "@/components/image-zoom";
import ScrollToNote from "@/components/scroll-to-note";
import type { NoteCardData } from "@/lib/note-cards";
import { getCategoryTree } from "@/lib/categories";

interface NoteCardListProps {
  cards: NoteCardData[];
  /** Slug of the note to show expanded and scroll to */
  openSlug?: string;
  showCategory?: boolean;
  /** 'grid' tiles cards in columns; an expanded card spans the full row */
  layout?: 'list' | 'grid';
}

export default async function NoteCardList({ cards, openSlug, showCategory = true, layout = 'list' }: NoteCardListProps) {
  const destinations = (await getCategoryTree()).map(c => ({
    category: c.name,
    subcategories: c.subcategories.map(s => s.name),
  }));

  // Re-run code highlighting/copy buttons whenever the set of notes or their content changes
  const contentKey = cards.map(c => `${c.note.slug}@${c.note.updatedAt}`).join('|');

  return (
    <>
      <div
        id="note-cards"
        className={layout === 'grid'
          ? 'grid gap-4 grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 items-start'
          : 'space-y-4'}
      >
        {cards.map(card => (
          <NoteCard
            key={card.note.slug}
            card={card}
            open={card.note.slug === openSlug}
            showCategory={showCategory}
            destinations={destinations}
          />
        ))}
      </div>
      <CodeEnhancer key={contentKey} targetId="note-cards" />
      <ImageZoom key={`zoom-${contentKey}`} targetId="note-cards" />
      <ScrollToNote slug={openSlug} />
    </>
  );
}
