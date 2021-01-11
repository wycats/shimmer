import { Bounds } from "../dom/bounds";
import type { Cursor } from "../dom/cursor";
import type { SimplestCharacterData, SimplestDocument } from "../dom/simplest";
import { build, IntoReactive, Reactive } from "../reactive/cell";
import {
  DynamicContent,
  StaticContent,
  TemplateContent,
  UpdatableContent,
} from "./content";

export type CommentInfo = Reactive<string>;

export function comment(
  value: IntoReactive<string>
): TemplateContent<"comment", CommentInfo> {
  return build(() => {
    let reactive = Reactive.from(value);

    if (Reactive.isStatic(reactive)) {
      return StaticContent.of("comment", reactive, (cursor, dom) => {
        let text = initialize(reactive, cursor, dom);

        return Bounds.single(text);
      });
    } else {
      return DynamicContent.of("comment", reactive, (cursor, dom) => {
        let text = initialize(reactive, cursor, dom);

        return UpdatableContent.of(
          Bounds.single(text),
          () => (text.data = reactive.now)
        );
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
