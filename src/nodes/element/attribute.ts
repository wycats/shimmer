import { Reactive } from "../../reactive/cell";
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

export type AttributeModifier = TemplateModifier<"attribute", AttributeInfo>;

export function createAttr(
  name: string,
  value: Reactive<string | null>
): AttributeModifier {
  if (Reactive.isStatic(value)) {
    return StaticModifier.of("attribute", { name, value }, (cursor) => {
      if (value.now !== null) {
        cursor.setAttributeNS(null, name, value.now);
      }

      return cursor;
    });
  } else {
    return DynamicModifier.of("attribute", { name, value }, (cursor) => {
      if (value.now !== null) {
        cursor.setAttributeNS(null, name, value.now);
      }

      return UpdatableModifier.of(cursor, () => {
        if (value.now === null) {
          cursor.removeAttributeNS(null, name);
        } else {
          cursor.setAttributeNS(null, name, value.now);
        }
      });
    });
  }
}
