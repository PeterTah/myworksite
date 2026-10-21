'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/** Click an image inside the element with the given id to view it full size; click or Esc closes it. */
export default function ImageZoom({ targetId }: { targetId: string }) {
  const [image, setImage] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    const root = document.getElementById(targetId);
    if (!root) return;

    root.querySelectorAll('img').forEach(img => img.setAttribute('data-zoomable', ''));
    const onClick = (e: MouseEvent) => {
      const img = (e.target as HTMLElement).closest('img');
      // Images wrapped in a link keep their link behaviour
      if (!img || !root.contains(img) || img.closest('a')) return;
      setImage({ src: img.currentSrc || img.src, alt: img.alt });
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [targetId]);

  useEffect(() => {
    if (!image) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setImage(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [image]);

  if (!image) return null;
  return createPortal(
    <div className="image-lightbox" role="dialog" aria-modal="true" aria-label={image.alt || 'Image'} onClick={() => setImage(null)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.src} alt={image.alt} />
    </div>,
    document.body
  );
}
