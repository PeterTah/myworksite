import Link from "next/link";
import { notFound } from "next/navigation";
import KBShell from "@/components/kb-shell";
import AddIdeaButton from "@/components/add-idea-button";
import NoteCardList from "@/components/note-card-list";
import { findSubcategory } from "@/lib/categories";
import { categoryHref } from "@/lib/category-url";
import { loadNoteCards } from "@/lib/note-cards";
import { safeDecode } from "@/lib/safe-decode";

export default async function SubcategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string; subcategory: string }>;
  searchParams: Promise<{ note?: string }>;
}) {
  const { category, subcategory } = await params;
  const { note: openSlug } = await searchParams;
  const found = await findSubcategory(safeDecode(category), safeDecode(subcategory));
  if (!found) notFound();

  const cat = found.category.name;
  const sub = found.subcategory.name;
  const cards = await loadNoteCards(found.subcategory.notes);

  return (
    <KBShell showToc={false} activeNote={openSlug}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <Link href="/" className="hover:underline">Home</Link>
              <span className="mx-1.5">/</span>
              <Link href={categoryHref(cat)} className="hover:underline">{cat}</Link>
            </p>
            <h1 className="text-3xl font-bold mt-1">{sub}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {cards.length} idea{cards.length !== 1 ? "s" : ""}
            </p>
          </div>
          <AddIdeaButton category={cat} subcategory={sub} />
        </div>

        {cards.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No ideas in {sub} yet.</p>
            <AddIdeaButton category={cat} subcategory={sub} />
          </div>
        ) : (
          <NoteCardList cards={cards} openSlug={openSlug} showCategory={false} layout="grid" />
        )}
      </div>
    </KBShell>
  );
}
