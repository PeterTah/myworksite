import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import SearchBar from "@/components/search-bar";
import ImportButton from "@/components/import-button";
import BackupButton from "@/components/backup-button";
import { getAllNotes, getNotesByCategory } from "@/lib/notes";

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

  return (
    <div className="space-y-10">

      {/* HERO */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold">
          My Knowledge Base
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          Troubleshooting guides, architecture designs, and real-world solutions
          for VMware, Azure and Linux.
        </p>

        {/* SEARCH */}
        <div className="max-w-xl mx-auto">
          <SearchBar />
        </div>

        {/* CREATE BUTTON */}
        <div className="flex gap-3 justify-center">
          <Link
            href="/notes/new"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create New Note
          </Link>
          <ImportButton />
          <BackupButton />
        </div>
      </section>

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
              <Card className={`hover:shadow-lg transition cursor-pointer ${
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

        <div className="space-y-3">
          {filteredNotes.map((note) => (
            <Link key={note.slug} href={`/kb/${note.slug}`}>
              <Card className="hover:shadow-md transition cursor-pointer bg-white dark:bg-gray-800">
                <CardContent>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{note.title}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{note.description}</p>
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
                    <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded ml-2">
                      {note.category}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
