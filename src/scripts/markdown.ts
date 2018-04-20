import { escapeHtml } from './util.js';
import lazy, { Lazy } from './modules/lazy-eval/lazy.js';

enum FormatType {
  Html
}
  
abstract class MarkdownNode {
  abstract format(type: FormatType): string;
}
  
abstract class MarkdownTextNode extends MarkdownNode {
  innerText: string;

  constructor(innerText: string) {
    super();
    this.innerText = innerText;
  }
}

class MarkdownRoot extends MarkdownNode {
  nodes: MarkdownNode[];

  constructor(nodes: MarkdownNode[]) {
    super();
    this.nodes = nodes;
  }

  format(type: FormatType) {
    return this.nodes.reduce((acc, current) =>
      acc + current.format(type)
    , '');
  }
}

class MarkdownPlainText extends MarkdownTextNode {
    format(type: FormatType): string {
        return escapeHtml(this.innerText);
    }
}

class MarkdownItalic extends MarkdownTextNode {
  format(type: FormatType): string {
    return `<i>${escapeHtml(this.innerText)}</i>`;
  }
}
class MarkdownBold extends MarkdownTextNode {
  format(type: FormatType): string {
    return `<b>${escapeHtml(this.innerText)}</b>`;
  }
}
class MarkdownHeading extends MarkdownTextNode {
  headingLevel: number;

  constructor(innerText: string, headingLevel: number) {
      super(innerText);
      this.headingLevel = headingLevel;
  }

  format(type: FormatType): string {
    return `<b>${escapeHtml(this.innerText)}</b>`;
  }
}
class MarkdownLink extends MarkdownTextNode {
  ref: URL;

  constructor(innerText: string, ref: URL) {
    super(innerText);
    this.ref = ref;
  }

  format(type: FormatType): string {
    return `<a href="${escapeHtml(this.ref.href)}">${escapeHtml(this.innerText)}</a>`;
  }
}
class MarkdownImage extends MarkdownNode {
  format(type: FormatType): string {
    throw new Error("Method not implemented.");
  }
}
class MarkdownBlockquote extends MarkdownNode {
  format(type: FormatType): string {
    throw new Error("Method not implemented.");
  }
}
class MarkdownUnorderedList extends MarkdownNode {
  format(type: FormatType): string {
    throw new Error("Method not implemented.");
  }
}
class MarkdownOrderedList extends MarkdownNode {
  format(type: FormatType): string {
    throw new Error("Method not implemented.");
  }
}
 
class MarkdownParsed {
  html: Lazy<string>;

  constructor(node: MarkdownNode) {
    this.html = lazy(() => node.format(FormatType.Html));
  }
}

export const Markdown = {
  parse(markdown: string): MarkdownParsed {
    const acc = {
        currentNode: null,
        append(content: string) {

        }
    };
    function parse(markdown: string): MarkdownNode {
        if (markdown.startsWith('**')) {
            const boldStart = markdown.substring(2);
            if (boldStart.indexOf('**') === -1) {
                
                return currentNode;
            }
            const innerText = markdown.substring(0, markdown.indexOf('**'));

        }
    }
    return new MarkdownParsed(parse(markdown));
  }
}