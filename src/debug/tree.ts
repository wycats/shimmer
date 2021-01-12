import type { ElementInfo } from "../nodes/element/element";
import type { FragmentInfo } from "../nodes/fragment";
import type {
  ChoiceInfo,
  CommentInfo,
  Content,
  ContentType,
  TemplateContent,
  TextInfo,
} from "../nodes/public";
import type { BlockInfo } from "../nodes/structure/block";
import type { EachInfo } from "../nodes/structure/each";

export function tree(content: Content): DebugContentNode {
  return new TreeBuilder().content(content);
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
  matches: Record<string, DebugContentNode>;
}

interface ElementNode extends DebugNode {
  type: "element";
  tag: string;
  body: DebugNode;
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

class TreeBuilder {
  content(content: Content): DebugContentNode {
    switch (content.type) {
      case "comment":
        return this.comment(content);
      case "text":
        return this.text(content);
      case "fragment":
        return this.fragment(content);
      case "each":
        return this.each(content);
      case "choice":
        return this.choice(content);
      case "element":
        return this.element(content);
      case "block":
        return this.block(content);
    }
  }

  text(content: TemplateContent<"text", TextInfo>): TextNode {
    return {
      type: "text",
      static: content.isStatic,
      data: content.info.now,
    };
  }

  comment(content: TemplateContent<"comment", CommentInfo>): CommentNode {
    return {
      type: "comment",
      static: content.isStatic,
      data: content.info.now,
    };
  }

  fragment(content: TemplateContent<"fragment", FragmentInfo>): FragmentNode {
    return {
      type: "fragment",
      static: content.isStatic,
      children: [...content.info.children.map((c) => this.content(c))],
    };
  }

  each(content: TemplateContent<"each", EachInfo>): EachNode {
    return { type: "each", static: content.isStatic };
  }

  choice(content: TemplateContent<"choice", ChoiceInfo>): ChoiceNode {
    let matches: Record<string, DebugContentNode> = {};

    for (let [key, value] of Object.entries(content.info.match)) {
      matches[key] = this.content(value);
    }

    return {
      type: "choice",
      static: content.isStatic,
      data: content.info.value.now,
      matches,
    };
  }

  element(content: TemplateContent<"element", ElementInfo>): ElementNode {
    return {
      type: "element",
      static: content.isStatic,
      tag: content.info.tag,
      body: this.content(content.info.body),
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
