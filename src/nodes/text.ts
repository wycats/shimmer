import { Bounds } from "../dom/bounds";
import { Cursor } from "../dom/cursor";
import { SimplestCharacterData, SimplestDocument } from "../dom/simplest";
import { IntoReactive, Reactive } from "../reactive/cell";
import {
  DynamicContent,
  StaticContent,
  TemplateContent,
  UpdatableContent,
} from "./content";

export type TextInfo = Reactive<string>;

export function text(
  value: IntoReactive<string>
): TemplateContent<"text", Reactive<string>> {
  let reactive = Reactive.from(value);

  if (Reactive.isStatic(reactive)) {
    return StaticContent.of("text", reactive, (cursor, dom) => {
      let text = initialize(reactive, cursor, dom);

      return Bounds.single(text);
    });
  } else {
    return DynamicContent.of("text", reactive, (cursor, dom) => {
      let text = initialize(reactive, cursor, dom);

      return UpdatableContent.of(
        Bounds.single(text),
        () => (text.data = reactive.current)
      );
    });
  }
}

function initialize(
  value: Reactive<string>,
  cursor: Cursor,
  dom: SimplestDocument
): SimplestCharacterData {
  return cursor.insert(dom.createTextNode(value.current));
}
