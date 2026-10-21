"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Heading = { id: string; text: string; level: number };

export default function TOC() {
  const pathname = usePathname();
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Re-scan on every navigation: this component lives in the layout and is not remounted
  useEffect(() => {
    let observer: IntersectionObserver | undefined;

    // Wait a frame so the new page's article is in the DOM
    const frame = requestAnimationFrame(() => {
      const elements = Array.from(
        document.querySelectorAll<HTMLHeadingElement>("article h2[id], article h3[id]")
      );

      setHeadings(
        elements.map((el) => ({
          id: el.id,
          text: el.innerText,
          level: el.tagName === "H2" ? 2 : 3,
        }))
      );
      setActiveId(elements[0]?.id ?? null);

      // Highlight the heading closest to the top of the viewport
      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          if (visible[0]) setActiveId(visible[0].target.id);
        },
        { rootMargin: "0px 0px -70% 0px" }
      );
      elements.forEach((el) => observer!.observe(el));
    });

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [pathname]);

  if (headings.length === 0) return null;

  return (
    <nav className="sticky top-6" aria-label="Table of contents">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
        On this page
      </h3>

      <ul className="space-y-1 text-sm border-l dark:border-gray-700 max-h-[calc(100vh-8rem)] overflow-y-auto">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={`block py-1 -ml-px border-l-2 transition ${
                h.level === 3 ? "pl-6" : "pl-3"
              } ${
                activeId === h.id
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 font-medium"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
