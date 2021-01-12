import type { SimplestElement } from "../../dom/simplest";
import { IntoReactiveArgs, ReactiveArgs } from "../component";
import {
  DynamicModifier,
  TemplateModifier,
  UpdatableModifier,
} from "./modifier-content";

export interface ElementEffectInfo<Args extends ReactiveArgs = ReactiveArgs> {
  callback: (element: SimplestElement, ...args: Args) => void;
}

export function effect<Args extends ReactiveArgs>(
  callback: (element: SimplestElement, ...args: Args) => void
): (
  ...args: IntoReactiveArgs<Args>
) => TemplateModifier<"effect", ElementEffectInfo<Args>> {
  return (
    ...args: IntoReactiveArgs<Args>
  ): TemplateModifier<"effect", ElementEffectInfo<Args>> => {
    let a = ReactiveArgs.from<Args>(...args);

    return DynamicModifier.of("effect", { callback }, (cursor) => {
      callback(cursor, ...a);

      return UpdatableModifier.of(cursor, () => {
        // todo: do something
      });
    });
  };
}
