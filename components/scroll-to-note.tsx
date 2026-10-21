'use client';

import { useEffect } from 'react';

// Brings the note opened from the sidebar into view, also when only the ?note= query changes
export default function ScrollToNote({ slug }: { slug?: string }) {
  useEffect(() => {
    if (slug) document.getElementById(`note-${slug}`)?.scrollIntoView({ block: 'start' });
  }, [slug]);

  return null;
}
