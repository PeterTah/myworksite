"use client";

import { useEffect, useState } from "react";

export default function TOC() {
  const [headings, setHeadings] = useState<
    { id: string; text: string }[]
  >([]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const elements = Array.from(
        document.querySelectorAll("article h2, article h3")
      ) as HTMLHeadingElement[];

      const mapped = elements
        .filter((el) => el.id)
        .map((el) => ({
          id: el.id,
          text: el.innerText,
        }));

      if (mapped.length > 0) {
        setHeadings(mapped);
        observer.disconnect(); // ✅ stop once found
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  if (headings.length === 0) return null;

  return (
    <div className="sticky top-20">
      <h3 className="text-sm font-semibold text-gray-500 mb-3">
        On this page
      </h3>

      <ul className="space-y-2 text-sm">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className="hover:text-blue-600 block transition"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}