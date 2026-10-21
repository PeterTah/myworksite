// Cleans HTML pasted from Word and similar sources before it is inserted into the editor
export function cleanPastedHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  // Remove Word-only elements (metadata, XML islands, empty <o:p> markers).
  // Word puts Mso* classes and mso- styles on real paragraphs, so those are stripped, not removed.
  body.querySelectorAll('meta, link, style, xml, o\\:p').forEach(el => el.remove());

  // Convert Word headings to proper headings
  body.querySelectorAll('[class*="Heading"], [class*="heading"]').forEach(el => {
    const className = el.className.toLowerCase();
    let newTag = el.tagName;
    if (className.includes('heading1')) newTag = 'H1';
    else if (className.includes('heading2')) newTag = 'H2';
    else if (className.includes('heading3')) newTag = 'H3';

    if (newTag !== el.tagName) {
      const newEl = doc.createElement(newTag);
      newEl.innerHTML = el.innerHTML;
      Array.from(el.attributes).forEach(attr => {
        if (attr.name !== 'class' && attr.name !== 'style') {
          newEl.setAttribute(attr.name, attr.value);
        }
      });
      el.replaceWith(newEl);
    }
  });

  // Remove empty paragraphs
  body.querySelectorAll('p').forEach(el => {
    if (!el.textContent?.trim() && !el.querySelector('img')) {
      el.remove();
    }
  });

  // Keep formatting-related inline styles only
  const allowedStyles = ['font-weight', 'font-style', 'text-decoration', 'text-align', 'font-size', 'color'];
  body.querySelectorAll('*').forEach(el => {
    const style = el.getAttribute('style');
    if (style) {
      const styleParts = style.split(';').filter(s => {
        const prop = s.split(':')[0]?.trim().toLowerCase();
        return allowedStyles.includes(prop);
      });
      if (styleParts.length > 0) {
        el.setAttribute('style', styleParts.join(';'));
      } else {
        el.removeAttribute('style');
      }
    }
  });

  // Convert bold/italic from style attributes
  body.querySelectorAll('[style]').forEach(el => {
    const style = el.getAttribute('style') || '';
    if (style.includes('bold') || style.includes('700')) {
      const strong = doc.createElement('strong');
      strong.innerHTML = el.innerHTML;
      el.innerHTML = '';
      el.appendChild(strong);
    }
    if (style.includes('italic')) {
      const em = doc.createElement('em');
      em.innerHTML = el.innerHTML;
      el.innerHTML = '';
      el.appendChild(em);
    }
  });

  // Remove class attributes except for code blocks
  body.querySelectorAll('[class]').forEach(el => {
    const tag = el.tagName.toLowerCase();
    if (tag !== 'code' && tag !== 'pre') {
      el.removeAttribute('class');
    }
  });

  return body.innerHTML;
}
