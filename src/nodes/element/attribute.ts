import { IntoReactive, Reactive } from "../../reactive/cell";
import {
  DynamicModifier,
  StaticModifier,
  TemplateModifier,
  UpdatableModifier,
} from "./modifier-content";

export interface AttributeInfo {
  name: string;
  value: Reactive<string | null>;
}

export function attr(
  name: string,
  value: IntoReactive<string | null>
): TemplateModifier<"attribute", AttributeInfo> {
  let reactive = Reactive.from(value);

  if (Reactive.isStatic(reactive)) {
    return StaticModifier.of(
      "attribute",
      { name, value: reactive },
      (cursor) => {
        if (reactive.now !== null) {
          cursor.setAttributeNS(null, name, reactive.now);
        }

        return cursor;
      }
    );
  } else {
    return DynamicModifier.of(
      "attribute",
      { name, value: reactive },
      (cursor) => {
        if (reactive.now !== null) {
          cursor.setAttributeNS(null, name, reactive.now);
        }

        return UpdatableModifier.of(cursor, () => {
          if (reactive.now === null) {
            cursor.removeAttributeNS(null, name);
          } else {
            cursor.setAttributeNS(null, name, reactive.now);
          }
        });
      }
    );
  }
}
