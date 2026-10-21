import "./globals.css";
import Link from "next/link";
import ThemeToggle from "@/components/theme-toggle";
import ImportButton from "@/components/import-button";
import BackupButton from "@/components/backup-button";
import SearchBar from "@/components/search-bar";

export const metadata = {
  title: "My Knowledge Site",
  description: "Technical knowledge base",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply the saved theme before first paint to avoid a light flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}`,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-screen bg-white text-black transition-colors dark:bg-gray-900 dark:text-white">
        <header className="border-b border-gray-200 dark:border-gray-800">
          <div className="w-full mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-3">
            <h1 className="text-xl font-bold shrink-0">
              <Link href="/" className="hover:text-blue-600">My Knowledge Base</Link>
            </h1>
            {/* Search sits beside the title; on narrow screens it drops to its own full-width row */}
            <div className="order-last w-full lg:order-none lg:w-auto lg:flex-1 lg:max-w-2xl">
              <SearchBar />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Link
                href="/notes/new"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Create New Note
              </Link>
              <ImportButton />
              <BackupButton />
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="w-full mx-auto p-4">
          {children}
        </main>
      </body>
    </html>
  );
}
