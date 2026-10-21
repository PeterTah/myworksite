import TurndownService from 'turndown';
import { marked } from 'marked';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**',
  linkStyle: 'inlined',
  bulletListMarker: '-',
});

// Keep bold text with inline styles
turndownService.addRule('bold', {
  filter: (node) => {
    return !!(
      (node.nodeName === 'STRONG' || node.nodeName === 'B') ||
      (node.style && node.style.fontWeight && (node.style.fontWeight === 'bold' || node.style.fontWeight === '700'))
    );
  },
  replacement: (content) => `**${content}**`,
});

// Keep italic text with inline styles
turndownService.addRule('italic', {
  filter: (node) => {
    return !!(
      (node.nodeName === 'EM' || node.nodeName === 'I') ||
      (node.style && node.style.fontStyle && node.style.fontStyle === 'italic')
    );
  },
  replacement: (content) => `*${content}*`,
});

// Keep strikethrough
turndownService.addRule('strikethrough', {
  filter: (node) => node.nodeName === 'DEL' || node.nodeName === 'S' || node.nodeName === 'STRIKE',
  replacement: (content) => `~~${content}~~`,
});

// Handle underline (convert to emphasis since markdown doesn't have underline)
turndownService.addRule('underline', {
  filter: (node) => {
    return !!(
      node.nodeName === 'U' || (node.style && node.style.textDecoration && node.style.textDecoration.includes('underline'))
    );
  },
  replacement: (content) => `_${content}_`,
});

// Handle headings with inline styles
turndownService.addRule('headingStyle', {
  filter: (node) => {
    return !!(node.style && node.style.fontSize && (
      node.style.fontSize.includes('24pt') ||
      node.style.fontSize.includes('32pt') ||
      node.style.fontSize.includes('18pt')
    ));
  },
  replacement: (content, node) => {
    const fontSize = node.style.fontSize;
    let level = 3;
    if (fontSize.includes('32pt') || fontSize.includes('24pt')) level = 1;
    else if (fontSize.includes('18pt')) level = 2;
    return `${'#'.repeat(level)} ${content}\n\n`;
  },
});

export function htmlToMarkdown(html: string): string {
  return turndownService.turndown(html);
}

export async function markdownToHtml(markdown: string): Promise<string> {
  return await marked(markdown);
}
