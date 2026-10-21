import Link from "next/link";
import TOC from "@/components/toc";
import { getNotesByCategory } from "@/lib/notes";

export default async function KBLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menu = await getNotesByCategory();

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* LEFT SIDEBAR */}
      <aside className="w-64 border-r bg-white p-5 hidden md:block sticky top-0 h-screen overflow-y-auto">
        <h2 className="font-bold text-lg mb-6">
          Knowledge Base
        </h2>

        <div className="space-y-6">
          {menu.map((section) => (
            <div key={section.category}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                {section.category}
              </h3>

              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/kb/${item.slug}`}
                      className="block text-sm px-2 py-1 rounded hover:bg-gray-100 hover:text-blue-600 transition"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN CONTENT + RIGHT TOC */}
      <main className="flex-1 p-8 flex gap-8">

        {/* ARTICLE CONTENT */}
        <div className="flex-1 max-w-3xl">
          {children}
        </div>

        {/* RIGHT SIDEBAR (TOC) */}
        <aside className="w-64 hidden lg:block">
          <TOC />
        </aside>

      </main>
    </div>
  );
}