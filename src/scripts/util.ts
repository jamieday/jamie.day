export function J$(selector: string) {
  const el = document.querySelector(selector);
  if (el === null) throw new Error(`Element not found: ${selector}`);
  return el;
}

export function escapeHtml(html: string) {
  const text = document.createTextNode(html);
  const div = document.createElement("div");
  div.appendChild(text);
  return div.innerHTML;
}

interface MarkdownParsed {
  raw: string;
  html: () => string;
}

export const Markdown = {
  parse(markdown: string): MarkdownParsed {
    markdown = 'Markdown parsing not implemented';
    return { raw: markdown, html: () => markdown };
  }
}