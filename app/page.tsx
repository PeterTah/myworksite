import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import NoteCardList from "@/components/note-card-list";
import KBShell from "@/components/kb-shell";
import { getAllNotes, getNotesByCategory } from "@/lib/notes";
import { loadNoteCards } from "@/lib/note-cards";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const notes = await getAllNotes();
  const categories = await getNotesByCategory();
  const filteredNotes = params.category
    ? notes.filter(note => note.category === params.category)
    : notes;
  const cards = await loadNoteCards(filteredNotes);

  return (
    <KBShell showToc={false}>
      <div className="space-y-10">

        {/* CATEGORIES */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Browse Categories
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.category}
                href={`?category=${encodeURIComponent(cat.category)}`}
              >
                <Card className={`hover:shadow-lg transition cursor-pointer dark:bg-gray-800 dark:border-gray-700 ${
                  params.category === cat.category ? 'ring-2 ring-blue-500' : ''
                }`}>
                  <CardContent>
                    <h3 className="text-lg font-semibold">{cat.category}</h3>
                    <p className="text-gray-500 text-sm mt-1">
                      {cat.items.length} article{cat.items.length !== 1 ? 's' : ''}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {params.category && (
            <div>
              <Link
                href="/"
                className="text-sm text-blue-500 hover:underline"
              >
                Clear filter
              </Link>
            </div>
          )}
        </section>

        {/* LATEST ARTICLES */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Latest Articles
          </h2>

          <NoteCardList cards={cards} />
        </section>

      </div>
    </KBShell>
  );
}
