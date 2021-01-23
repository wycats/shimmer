import type { ElementCursor } from "@shimmer/dom";
import type { Args } from "../../types";
import {
  DynamicModifier,
  TemplateModifier,
  UpdatableModifier,
} from "./modifier-content";

export interface ElementEffectInfo<A extends Args = Args> {
  callback: (element: ElementCursor, args: A) => void;
}

export type EffectModifier<A extends Args = any> = TemplateModifier<
  "effect",
  ElementEffectInfo<A>
>;

export function createEffect<A extends Args>(
  callback: (element: ElementCursor, args: A) => void
): (args: A) => TemplateModifier<"effect", ElementEffectInfo<A>> {
  return (args: A): TemplateModifier<"effect", ElementEffectInfo<A>> => {
    return DynamicModifier.of("effect", { callback }, (cursor) => {
      // TODO: no
      Promise.resolve().then(() => callback(cursor, args));
      // callback(cursor, args);

      return UpdatableModifier.of(cursor, () => {
        // todo: do something
      });
    });
  };
}
