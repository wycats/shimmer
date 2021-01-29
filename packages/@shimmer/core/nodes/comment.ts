import { SimplestCharacterData, StaticBounds } from "@shimmer/dom";
import { build, isStaticReactive, Reactive } from "@shimmer/reactive";
import {
  ContentContext,
  DynamicContent,
  StaticContent,
  TemplateContent,
} from "./content";

export type CommentInfo = Reactive<string>;
export type CommentContent = TemplateContent<"comment", CommentInfo>;

export function createComment(string: Reactive<string>): CommentContent {
  return build(() => {
    if (isStaticReactive(string)) {
      return StaticContent.of("comment", string, (ctx) => {
        let text = initialize(string, ctx);

        return StaticBounds.single(text);
      });
    } else {
      return DynamicContent.of("comment", string, {
        isValid: () => true,
        shouldClear: true,
        poll: (text: SimplestCharacterData) => {
          text.data = string.now;
        },
        render: (ctx) => {
          let text = initialize(string, ctx);
          let bounds = StaticBounds.single(text);
          return { bounds, state: text };
        },
      });
    }
  });
}

function initialize(
  value: Reactive<string>,
  { cursor, dom }: ContentContext
): SimplestCharacterData {
  return cursor.insert(dom.createComment(value.now));
}
