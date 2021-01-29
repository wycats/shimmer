import type { ElementCursor, SimplestDocument } from "@shimmer/dom";
import { GLIMMER } from "../../glimmer";
import type { Realm, Services } from "../../realm";
import type { Args } from "../../types";
import {
  DynamicModifier,
  StaticModifier,
  TemplateModifier,
  UpdatableModifier,
} from "./modifier-content";

export interface ElementEffectInfo<A extends Args = Args> {
  callback: (context: EffectContext, args: A) => void;
}

export type EffectModifier<A extends Args = any> = TemplateModifier<
  "effect",
  ElementEffectInfo<A>
>;

export class EffectContext {
  static of(cursor: ElementCursor, realm: Realm<Services>): EffectContext {
    return new EffectContext(cursor, realm);
  }

  constructor(
    readonly cursor: ElementCursor,
    readonly realm: Realm<Services>
  ) {}

  get dom(): SimplestDocument {
    return this.realm.doc.dom;
  }

  get element(): Element {
    return this.cursor.asElement();
  }
}

export function createStaticEffect<A extends Args>(
  callback: (context: EffectContext, args: A) => void
) {
  return (
    args: A
  ): TemplateModifier<
    "effect",
    { callback: (context: EffectContext, args: A) => void }
  > => {
    return StaticModifier.of(
      "effect",
      { callback },
      (context: EffectContext): EffectContext => {
        GLIMMER.enqueueModifier((context) => callback(context, args), context);
        return context;
      }
    );
  };
}

export const createEffect = <A extends Args>(
  callback: (context: EffectContext, args: A) => void
) => (
  args: A
): TemplateModifier<
  "effect",
  { callback: (context: EffectContext, args: A) => void }
> =>
  DynamicModifier.of("effect", { callback }, (context: EffectContext) => {
    GLIMMER.enqueueModifier((context) => callback(context, args), context);
    // Promise.resolve().then(() => callback(cursor, args));
    // callback(cursor, args);

    return UpdatableModifier.of(context, () => {
      // todo: do something
    });
  });

// export function createEffect<
//   E extends SimplestElement,
//   A extends Args,
//   S extends Services
// >(
//   callback: (context: EffectContext<E, S>, args: A) => void
// ): (args: A) => TemplateModifier<"effect", ElementEffectInfo<A, E, S>> {
//   return (args: A): TemplateModifier<"effect", ElementEffectInfo<A, E, S>> => {
//     return DynamicModifier.of(
//       "effect",
//       { callback },
//       (context: EffectContext<E, S>) => {
//         GLIMMER.enqueueModifier((context) => callback(context, args), context);
//         // Promise.resolve().then(() => callback(cursor, args));
//         // callback(cursor, args);

//         return UpdatableModifier.of(context, () => {
//           // todo: do something
//         });
//       }
//     );
//   };
// }
