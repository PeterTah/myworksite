import Link from "next/link";
import { getNoteBySlug, calculateReadingTime, getRelatedNotes } from "@/lib/notes";
import { notFound } from "next/navigation";
import { marked } from "marked";
import ExportButton from "@/components/export-button";
import ReadingProgress from "@/components/reading-progress";
import NoteActions from "@/components/note-actions";
import CodeEnhancer from "@/components/code-enhancer";
import ImageZoom from "@/components/image-zoom";
import { addHeadingIds } from "@/lib/headings";
import { subcategoryHref } from "@/lib/category-url";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getNoteBySlug(slug);

  if (!article) {
    notFound();
  }

  const rawHtml = article.contentType === 'html' ? article.content : await marked(article.content);
  const contentHtml = addHeadingIds(rawHtml);
  const readingTime = calculateReadingTime(article.content);
  const relatedNotes = await getRelatedNotes(article.slug, article.category, article.tags);

  return (
    <>
      <ReadingProgress />
      <div className="space-y-10">
      {/* BACK LINK */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <Link href="/" className="text-sm text-blue-500 hover:underline">
          ← Back to Home
        </Link>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <ExportButton note={article} />
          <NoteActions slug={article.slug} title={article.title} redirectTo="/" />
        </div>
      </div>

      {/* TITLE */}
      <div>
        <h1 className="text-4xl md:text-5xl font-bold">{article.title}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-3 text-lg">{article.description}</p>
        <div className="flex items-center gap-3 mt-4">
          <span className="inline-block text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded">
            {article.category}
            {article.subcategory && (
              <>
                {" / "}
                <Link href={subcategoryHref(article.category, article.subcategory)} className="hover:text-blue-600 hover:underline">
                  {article.subcategory}
                </Link>
              </>
            )}
          </span>
          <span className="text-xs text-gray-400">
            {readingTime} min read
          </span>
        </div>
        {article.tags.length > 0 && (
          <div className="flex gap-2 mt-4 flex-wrap">
            {article.tags.map(tag => (
              <span key={tag} className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* CONTENT */}
      <article
        id="article-content"
        className="prose"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
      <CodeEnhancer key={`${article.slug}-${article.updatedAt}`} targetId="article-content" />
      <ImageZoom key={`zoom-${article.slug}-${article.updatedAt}`} targetId="article-content" />

      {/* RELATED ARTICLES */}
      {relatedNotes.length > 0 && (
        <div className="border-t dark:border-gray-800 pt-8">
          <h2 className="text-2xl font-semibold mb-6">Related Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedNotes.map(note => (
              <Link
                key={note.slug}
                href={`/kb/${note.slug}`}
                className="block p-6 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <h3 className="font-semibold text-lg">{note.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{note.description}</p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <span className="text-xs text-gray-400">{note.category}</span>
                  {note.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      </div>
    </>
  );
}
