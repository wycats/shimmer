import { StaticBounds } from "../dom/bounds";
import type { Cursor } from "../dom/cursor";
import type { SimplestCharacterData, SimplestDocument } from "../dom/simplest";
import { build, IntoReactive, Reactive } from "../reactive/cell";
import { DynamicContent, StaticContent, TemplateContent } from "./content";

export type CommentInfo = Reactive<string>;

export function comment(
  value: IntoReactive<string>
): TemplateContent<"comment", CommentInfo> {
  return build(() => {
    let reactive = Reactive.from(value);

    if (Reactive.isStatic(reactive)) {
      return StaticContent.of("comment", reactive, (cursor, dom) => {
        let text = initialize(reactive, cursor, dom);

        return StaticBounds.single(text);
      });
    } else {
      return DynamicContent.of("comment", reactive, {
        isValid: () => true,
        shouldClear: true,
        poll: (text: SimplestCharacterData) => {
          text.data = reactive.now;
        },
        render: (cursor, dom) => {
          let text = initialize(reactive, cursor, dom);
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
