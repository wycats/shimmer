import { StaticBounds } from "../dom/bounds";
import type { Cursor } from "../dom/cursor";
import type { SimplestCharacterData, SimplestDocument } from "../dom/simplest";
import { build, IntoReactive, Reactive } from "../reactive/cell";
import { DynamicContent, StaticContent, TemplateContent } from "./content";

export type TextInfo = Reactive<string>;

export function text(
  value: IntoReactive<string>
): TemplateContent<"text", Reactive<string>> {
  return build(() => {
    let reactive = Reactive.from(value);

    if (Reactive.isStatic(reactive)) {
      return StaticContent.of("text", reactive, (cursor, dom) => {
        let text = initialize(reactive, cursor, dom);

        return StaticBounds.single(text);
      });
    } else {
      return DynamicContent.of("text", reactive, {
        isValid: () => true,
        shouldClear: false,
        poll: (text: SimplestCharacterData) => {
          text.data = reactive.now;
        },
        render: (cursor, dom, state) => {
          if (state) {
            state.data = reactive.now;
            return { bounds: StaticBounds.single(state), state };
          }

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
  return cursor.insert(dom.createTextNode(value.now));
}
