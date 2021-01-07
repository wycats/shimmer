import { FragmentInfo } from "../nodes/fragment";
import {
  CommentInfo,
  Content,
  ContentType,
  TemplateContent,
  TextInfo,
} from "../nodes/public";

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

type DebugContentNode = TextNode | CommentNode | FragmentNode;

class TreeBuilder {
  content(content: Content): DebugContentNode {
    switch (content.type) {
      case "comment":
        return this.comment(content);
      case "text":
        return this.text(content);
      case "fragment":
        return this.fragment(content);
    }
  }

  text(content: TemplateContent<"text", TextInfo>): TextNode {
    return {
      type: "text",
      static: content.isStatic,
      data: content.info.current,
    };
  }

  comment(content: TemplateContent<"comment", CommentInfo>): CommentNode {
    return {
      type: "comment",
      static: content.isStatic,
      data: content.info.current,
    };
  }

  fragment(content: TemplateContent<"fragment", FragmentInfo>): FragmentNode {
    return {
      type: "fragment",
      static: content.isStatic,
      children: content.info.children.map((c) => this.content(c)),
    };
  }
}
