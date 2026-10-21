'use client';

import { useEffect } from 'react';
import hljs from 'highlight.js/lib/common';
import { extraLanguages } from '@/lib/code-languages';

Object.entries(extraLanguages).forEach(([name, lang]) => {
  if (!hljs.getLanguage(name)) hljs.registerLanguage(name, lang);
});

const COPY_ICON = '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts (e.g. LAN IP over http)
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

function flash(el: HTMLElement, attr = 'data-copied') {
  el.setAttribute(attr, 'true');
  setTimeout(() => el.removeAttribute(attr), 1500);
}

/**
 * Enhances rendered article HTML inside the element with the given id:
 * syntax highlighting + a copy button for code blocks, click-to-copy for inline code.
 */
export default function CodeEnhancer({ targetId }: { targetId: string }) {
  useEffect(() => {
    const root = document.getElementById(targetId);
    if (!root) return;

    root.querySelectorAll<HTMLPreElement>('pre').forEach(pre => {
      if (pre.parentElement?.classList.contains('code-block')) return;
      const code = pre.querySelector('code');
      if (!code) return;

      const langClass = Array.from(code.classList).find(c => c.startsWith('language-'));
      const lang = langClass?.slice('language-'.length);
      if (!code.classList.contains('hljs')) {
        if (lang && hljs.getLanguage(lang)) {
          code.innerHTML = hljs.highlight(code.textContent ?? '', { language: lang }).value;
        } else {
          code.innerHTML = hljs.highlightAuto(code.textContent ?? '').value;
        }
        code.classList.add('hljs');
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'code-block';
      pre.replaceWith(wrapper);

      const header = document.createElement('div');
      header.className = 'code-block-header';

      const label = document.createElement('span');
      label.textContent = lang && lang !== 'plaintext' ? lang : 'code';
      header.appendChild(label);

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'code-copy';
      button.setAttribute('aria-label', 'Copy code');
      button.innerHTML = `${COPY_ICON}<span>Copy</span>`;
      button.addEventListener('click', async () => {
        if (await copyText(code.textContent ?? '')) {
          button.querySelector('span')!.textContent = 'Copied!';
          flash(button);
          setTimeout(() => { button.querySelector('span')!.textContent = 'Copy'; }, 1500);
        }
      });
      header.appendChild(button);

      wrapper.append(header, pre);
    });

    // Inline code: click to copy
    const inlineCodes = Array.from(root.querySelectorAll<HTMLElement>('code')).filter(c => !c.closest('pre'));
    const handlers = inlineCodes.map(code => {
      // Notes saved by the old editor carry Tailwind classes on <code>; replace them with the shared style
      code.className = 'inline-code';
      code.title = 'Click to copy';
      const handler = async () => {
        if (await copyText(code.textContent ?? '')) flash(code);
      };
      code.addEventListener('click', handler);
      return () => code.removeEventListener('click', handler);
    });

    return () => handlers.forEach(remove => remove());
  }, [targetId]);

  return null;
}
