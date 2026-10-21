// Adds stable id attributes to h2/h3 elements so the table of contents can link to them.
// Pass a prefix when several notes render on one page so their ids don't collide.
export function addHeadingIds(html: string, prefix = ''): string {
  const used = new Map<string, number>();

  return html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, level: string, attrs: string, inner: string) => {
    if (/\sid\s*=/.test(attrs)) return match;

    const text = inner.replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/gi, ' ');
    const base = text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-') || 'section';

    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    const id = prefix + (count === 0 ? base : `${base}-${count}`);

    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });
}
