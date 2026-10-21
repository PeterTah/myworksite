import "./globals.css";
import ThemeToggle from "@/components/theme-toggle";

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
      <body className="min-h-screen bg-white text-black transition-colors dark:bg-gray-900 dark:text-white">
        <header className="border-b dark:border-gray-800">
          <main className="w-full mx-auto p-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">My Knowledge Base</h1>
            <ThemeToggle />
          </main>
        </header>
        <main className="w-full mx-auto p-4">
          {children}
        </main>
      </body>
    </html>
  );
}
