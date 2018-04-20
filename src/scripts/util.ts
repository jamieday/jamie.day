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