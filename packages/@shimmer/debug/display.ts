import type {
  AttributeModifier,
  BlockInfo,
  CommentContent,
  Content,
  ContentType,
  EachInfo,
  ElementContent,
  FragmentContent,
  Modifier,
  TemplateContent,
  TextContent,
} from "@shimmer/core";
import { HTML_NS, SimplestDocument, SimplestElement } from "@shimmer/dom";
import type { Block } from "@shimmer/reactive";

export function displayContent(content: Content | Modifier): string {
  return TreeDisplay.display(content);
}

interface DebugNode {
  type: ContentType;
  static: boolean;
}

interface TextNode extends DebugNode {
  type: "text";
  data: string;
}

interface CommentNode extends DebugNode {
  type: "comment";
  data: string;
}

interface FragmentNode extends DebugNode {
  type: "fragment";
  children: readonly DebugContentNode[];
}

interface EachNode extends DebugNode {
  type: "each";
}

interface ChoiceNode extends DebugNode {
  type: "choice";
  data: unknown;
  matches: Record<string, Block<[]>>;
}

interface ElementNode extends DebugNode {
  type: "element";
  tag: string;
  body: DebugNode | null;
}

interface BlockNode extends DebugNode {
  type: "block";
  content: DebugNode;
}

type DebugContentNode =
  | TextNode
  | CommentNode
  | FragmentNode
  | EachNode
  | ChoiceNode
  | ElementNode
  | BlockNode;

class TreeDisplay {
  static display(content: Content | Modifier, doc = document): string {
    let builder = new TreeDisplay(doc);
    let el = builder.content(content);
    return (el as Element).outerHTML;
  }

  #doc: SimplestDocument;
  #indent = 0;

  constructor(doc: SimplestDocument) {
    this.#doc = doc;
  }

  #nest = (
    parent: SimplestElement,
    callback: (line: (content: SimplestElement) => void) => void
  ) => {
    this.#indent += 1;
    parent.insertBefore(this.#doc.createTextNode("\n"), null);

    callback((content) => this.#line(parent, content));
    this.#indent -= 1;
    parent.insertBefore(
      this.#doc.createTextNode("  ".repeat(this.#indent)),
      null
    );
  };

  #line = (parent: SimplestElement, content: SimplestElement) => {
    parent.insertBefore(
      this.#doc.createTextNode("  ".repeat(this.#indent)),
      null
    );
    parent.insertBefore(content, null);
    parent.insertBefore(this.#doc.createTextNode("\n"), null);
  };

  content(content: Content | Modifier): SimplestElement {
    switch (content.type) {
      case "comment":
        return this.comment(content);
      case "text":
        return this.text(content);
      case "fragment":
        return this.fragment(content);
      case "element":
        return this.element(content);
      case "attribute":
        return this.attr(content);
      case "each":
        return this.each(content);
      case "choice":
        return this.choice(content);

      case "block":
        return this.block(content);
    }
  }

  #root = (desc: string, isStatic: boolean): SimplestElement => {
    return isStatic
      ? this.#doc.createElementNS(HTML_NS, `${desc}:static`)
      : this.#doc.createElementNS(HTML_NS, `${desc}:dynamic`);
  };

  text(content: TextContent): SimplestElement {
    let text = this.#root("text", content.isStatic);
    text.insertBefore(document.createTextNode(content.info.now), null);

    return text;
  }

  comment(content: CommentContent): SimplestElement {
    let comment = this.#root("comment", content.isStatic);
    comment.insertBefore(document.createTextNode(content.info.now), null);

    return comment;
  }

  attr(content: AttributeModifier): SimplestElement {
    let el = this.#root("modifier", content.isStatic);
    el.setAttributeNS(null, content.info.name, String(content.info.value.now));
    return el;
  }

  element(content: ElementContent): SimplestElement {
    let el = this.#root(content.info.tag, content.isStatic);

    const modifiers = content.info.modifiers;

    if (modifiers) {
      this.#nest(el, (line) => {
        let attrs = this.#doc.createElementNS(HTML_NS, "attrs");
        line(attrs);

        this.#nest(attrs, (line) => {
          for (let attr of modifiers) {
            if (attr.type === "attribute") {
              line(this.content(attr));
            }
          }
        });
      });
    }

    const body = content.info.body;

    if (body) {
      this.#nest(el, (line) => {
        line(this.content(body));
      });
    }

    return el;
  }

  fragment(content: FragmentContent): SimplestElement {
    let frag = this.#root("fragment", content.isStatic);

    this.#nest(frag, (line) => {
      for (let child of content.info.children) {
        line(this.content(child));
      }
    });

    return frag;
  }

  each(content: TemplateContent<"each", EachInfo>): EachNode {
    return { type: "each", static: content.isStatic };
  }

  choice(content: ChoiceContent): ChoiceNode {
    let matches: Record<string, Block<[]>> = {};

    for (let [key, value] of Object.entries(content.info.match)) {
      matches[key] = value;
    }

    return {
      type: "choice",
      static: content.isStatic,
      data: content.info.value.now,
      matches,
    };
  }

  block(content: TemplateContent<"block", BlockInfo>): BlockNode {
    return {
      type: "block",
      static: content.isStatic,
      content: this.content(content.info.content),
    };
  }
}
