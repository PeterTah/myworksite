import Link from "next/link";
import { notFound } from "next/navigation";
import KBShell from "@/components/kb-shell";
import NoteCardList from "@/components/note-card-list";
import { getCategoryTree } from "@/lib/categories";
import { subcategoryHref } from "@/lib/category-url";
import { loadNoteCards } from "@/lib/note-cards";
import { safeDecode } from "@/lib/safe-decode";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ note?: string }>;
}) {
  const { category } = await params;
  const { note: openSlug } = await searchParams;
  const name = safeDecode(category).toLowerCase();
  const cat = (await getCategoryTree()).find(c => c.name.toLowerCase() === name);
  if (!cat) notFound();

  const cards = await loadNoteCards(cat.notes);

  return (
    <KBShell showToc={false} activeNote={openSlug}>
      <div className="space-y-6">
        <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <Link href="/" className="hover:underline">Home</Link>
          </p>
          <h1 className="text-3xl font-bold mt-1">{cat.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {cat.count} note{cat.count !== 1 ? "s" : ""}
            {cat.subcategories.length > 0 &&
              ` · ${cat.subcategories.length} sub-categor${cat.subcategories.length !== 1 ? "ies" : "y"}`}
          </p>
        </div>

        {cat.subcategories.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Sub-categories</h2>
            <div className="flex flex-wrap gap-2">
              {cat.subcategories.map(sub => (
                <Link
                  key={sub.name}
                  href={subcategoryHref(cat.name, sub.name)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-blue-400 hover:text-blue-600"
                >
                  {sub.name} <span className="text-gray-400 tabular-nums">{sub.notes.length}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {cards.length > 0 ? (
          <NoteCardList cards={cards} openSlug={openSlug} showCategory={false} layout="grid" />
        ) : (
          <p className="text-gray-500 dark:text-gray-400 py-8 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
            {cat.subcategories.length > 0
              ? "All notes in this category are inside its sub-categories."
              : "No notes in this category yet. Use + in the sidebar to add a sub-category."}
          </p>
        )}
      </div>
    </KBShell>
  );
}
