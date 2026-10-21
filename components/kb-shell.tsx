import TOC from "@/components/toc";
import KBSidebar from "@/components/kb-sidebar";
import { getCategoryTree } from "@/lib/categories";

// Sidebar + content layout shared by the home page and article pages
export default async function KBShell({
  children,
  showToc = true,
  activeNote,
}: {
  children: React.ReactNode;
  showToc?: boolean;
  /** Slug of the note expanded on this page, for sidebar highlighting */
  activeNote?: string;
}) {
  const tree = await getCategoryTree();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* LEFT SIDEBAR */}
      <aside className="w-64 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 hidden md:block sticky top-0 h-screen overflow-y-auto">
        <KBSidebar tree={tree} activeNote={activeNote} />
      </aside>

      {/* MAIN CONTENT + RIGHT TOC */}
      <main className="flex-1 min-w-0 flex gap-10 px-4 py-6 md:px-8 lg:px-10">

        {/* ARTICLE CONTENT */}
        <div className="flex-1 min-w-0">
          {children}
        </div>

        {/* RIGHT SIDEBAR (TOC) */}
        {showToc && (
          <aside className="w-56 shrink-0 hidden lg:block">
            <TOC />
          </aside>
        )}

      </main>
    </div>
  );
}
