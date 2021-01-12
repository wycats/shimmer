import { Bounds } from "../../dom/bounds";
import type { Cursor } from "../../dom/cursor";
import type { SimplestDocument } from "../../dom/simplest";
import type { DynamicRenderedContent } from "../../glimmer/cache";
import { build, IntoReactive, Reactive } from "../../reactive/cell";
import {
  Content,
  DynamicContent,
  renderBounds,
  UpdatableContent,
} from "../content";

export type Choices = {
  [P in string]: VariantInfo<P, Reactive<unknown>>;
};

export interface VariantInfo<K extends string, V extends Reactive<unknown>> {
  readonly discriminant: K;
  readonly value: V;
}

export class Variant<C extends Choices, K extends keyof C> {
  constructor(readonly discriminant: K, readonly value: C[K]["value"]) {}

  match<U>(match: Match<C, () => U>): U {
    let { discriminant } = this;
    return match[discriminant]();
  }
}

export class Variants<C extends Choices> {
  static define<C extends Choices>(): Variants<C> {
    return new Variants();
  }

  of<K extends keyof C & string>(key: K, value: C[K]["value"]): Variant<C, K> {
    return new Variant(key, value);
  }
}

export type Match<C extends Choices, V> = {
  [P in keyof C]: V;
};

export function matchIsStatic(match: Match<Choices, Content>): boolean {
  for (let content of Object.values(match)) {
    if (!content.isStatic) {
      return false;
    }
  }

  return true;
}

export type Choice<C extends Choices> = Variant<C, keyof C>;

export interface ChoiceInfo<C extends Choices = Choices> {
  value: Reactive<Choice<C>>;
  match: Match<C, Content>;
}

export function match<C extends Choices>(
  value: IntoReactive<Choice<C>>,
  match: Match<C, Content>
): Content {
  return build(() => {
    let reactive = Reactive.from(value);

    if (Reactive.isStatic(reactive)) {
      let { discriminant } = reactive.now;
      return match[discriminant];
    }

    return DynamicContent.of(
      "choice",
      { value: reactive, match },
      (cursor, dom) => {
        let { bounds, dynamic } = initialize(reactive, match, cursor, dom);
        let { discriminant } = reactive.now;

        return UpdatableContent.of(bounds, () => {
          let { discriminant: newDiscriminant } = reactive.now;

          if (discriminant !== newDiscriminant) {
            let cursor = bounds.clear();
            let initialized = initialize(reactive, match, cursor, dom);
            bounds = initialized.bounds;
            dynamic = initialized.dynamic;
            discriminant = newDiscriminant;
            return;
          }

          if (dynamic) {
            dynamic.poll();
          }
        });
      }
    );
  });
}

function initialize<C extends Choices>(
  reactive: Reactive<Choice<C>>,
  match: Match<C, Content>,
  cursor: Cursor,
  dom: SimplestDocument
): { bounds: Bounds; dynamic: DynamicRenderedContent | null } {
  let { discriminant } = reactive.now;
  let choice = match[discriminant] as Content;
  let result = choice.render(cursor, dom);

  if (Bounds.is(result)) {
    return { bounds: result, dynamic: null };
  } else {
    return { bounds: renderBounds(result), dynamic: result };
  }
}
