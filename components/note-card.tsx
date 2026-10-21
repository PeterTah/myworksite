import Link from "next/link";
import ExportButton from "@/components/export-button";
import NoteActions from "@/components/note-actions";
import NoteDragHandle from "@/components/note-drag-handle";
import { categoryHref, subcategoryHref } from "@/lib/category-url";
import type { NoteCardData } from "@/lib/note-cards";

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

interface NoteCardProps {
  card: NoteCardData;
  /** Start expanded (the note clicked in the sidebar) */
  open?: boolean;
  /** Show the category / sub-category badge (off when the page already is that category) */
  showCategory?: boolean;
}

export default function NoteCard({ card, open = false, showCategory = true }: NoteCardProps) {
  const { note, html, readingTime } = card;
  const edited = note.updatedAt ?? note.createdAt;

  return (
    <article
      id={`note-${note.slug}`}
      // In a grid, an expanded card takes the whole row so its content has room
      className="scroll-mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm
        transition-shadow hover:shadow-md has-[details[open]]:col-span-full"
    >
      <details open={open} className="group">
        <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer select-none p-5">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold">{note.title}</h2>
              {note.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{note.description}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                {/* Notes created before timestamps were recorded have no date */}
                {edited && (
                  <>
                    <span>Last edited {formatTimestamp(edited)}</span>
                    <span aria-hidden>·</span>
                  </>
                )}
                <span>{readingTime} min read</span>
                {showCategory && (
                  <>
                    <span aria-hidden>·</span>
                    <span>
                      {note.category}
                      {note.subcategory && ` / ${note.subcategory}`}
                    </span>
                  </>
                )}
              </p>
              {note.tags.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {note.tags.map(tag => (
                    <span key={tag} className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <NoteDragHandle
              note={{ slug: note.slug, title: note.title, category: note.category, subcategory: note.subcategory }}
            />
          </div>
          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400">
            <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
            <span className="group-open:hidden">View</span>
            <span className="hidden group-open:inline">Hide</span>
          </span>
        </summary>

        <div
          className="prose px-5 pb-2 border-t border-gray-100 dark:border-gray-800 pt-4"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </details>

      {/* Actions stay visible whether or not the card is expanded */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-gray-100 dark:border-gray-800 text-sm">
        <div className="flex items-center gap-3">
          <Link href={`/kb/${note.slug}`} className="text-blue-600 dark:text-blue-400 hover:underline">
            Open full page →
          </Link>
          {showCategory && (
            <Link
              href={note.subcategory ? subcategoryHref(note.category, note.subcategory) : categoryHref(note.category)}
              className="text-gray-500 dark:text-gray-400 hover:underline"
            >
              Go to {note.subcategory ?? note.category}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ExportButton note={note} />
          <span className="text-gray-300 dark:text-gray-600" aria-hidden>|</span>
          <NoteActions slug={note.slug} title={note.title} variant="text" />
        </div>
      </div>
    </article>
  );
}
