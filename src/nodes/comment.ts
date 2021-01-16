import { StaticBounds } from "../dom/bounds";
import type { Cursor } from "../dom/cursor";
import type { SimplestCharacterData, SimplestDocument } from "../dom/simplest";
import { build, Reactive } from "../reactive/cell";
import { DynamicContent, StaticContent, TemplateContent } from "./content";

export type CommentInfo = Reactive<string>;
export type CommentContent = TemplateContent<"comment", CommentInfo>;

export function createComment(string: Reactive<string>): CommentContent {
  return build(() => {
    if (Reactive.isStatic(string)) {
      return StaticContent.of("comment", string, (cursor, dom) => {
        let text = initialize(string, cursor, dom);

        return StaticBounds.single(text);
      });
    } else {
      return DynamicContent.of("comment", string, {
        isValid: () => true,
        shouldClear: true,
        poll: (text: SimplestCharacterData) => {
          text.data = string.now;
        },
        render: (cursor, dom) => {
          let text = initialize(string, cursor, dom);
          let bounds = StaticBounds.single(text);
          return { bounds, state: text };
        },
      });
    }
  });
}

function initialize(
  value: Reactive<string>,
  cursor: Cursor,
  dom: SimplestDocument
): SimplestCharacterData {
  return cursor.insert(dom.createComment(value.now));
}
