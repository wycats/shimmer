import type { ElementCursor } from "@shimmer/dom";
import { isStatic, Reactive } from "@shimmer/reactive";
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
  if (isStatic(value)) {
    return StaticModifier.of("attribute", { name, value }, ({ cursor }) => {
      if (cursor.isTokenList(name)) {
        initializeMerged(cursor, name, value);
      } else {
        initializeNormal(cursor, name, value);
      }

      return cursor;
    });
  } else {
    return DynamicModifier.of("attribute", { name, value }, (ctx) => {
      if (ctx.cursor.isTokenList(name)) {
        let last = initializeMerged(ctx.cursor, name, value);

        return UpdatableModifier.of(ctx, () => {
          last = updateMerged(last, ctx.cursor, name, value);
        });
      } else {
        initializeNormal(ctx.cursor, name, value);

        return UpdatableModifier.of(ctx, () => {
          updateNormal(ctx.cursor, name, value);
        });
      }
    });
  }
}

function initializeNormal(
  cursor: ElementCursor,
  name: string,
  value: Reactive<string | null>
): string | null {
  let string = value.now;

  if (string) {
    cursor.setAttributeNS(null, name, string);
  }

  return string;
}

function updateNormal(
  cursor: ElementCursor,
  name: string,
  value: Reactive<string | null>
): string | null {
  let string = value.now;

  if (string === null) {
    cursor.removeAttributeNS(null, name);
  } else {
    cursor.setAttributeNS(null, name, string);
  }

  return string;
}

function initializeMerged(
  cursor: ElementCursor,
  name: string,
  value: Reactive<string | null>
): string | null {
  let string = value.now;

  let tokenList = cursor.getTokenList(name);

  if (string) {
    tokenList.add(string);
  }

  return string;
}

function updateMerged(
  last: string | null,
  cursor: ElementCursor,
  name: string,
  value: Reactive<string | null>
): string | null {
  let string = value.now;
  let tokenList = cursor.getTokenList(name);

  if (last === null) {
    if (string !== null) {
      tokenList.add(string);
    }
  } else {
    if (string === null) {
      tokenList.remove(last);
    } else {
      tokenList.replace(last, string);
    }
  }

  return string;
}
