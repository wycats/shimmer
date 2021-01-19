import type { Block, EffectModifier } from "@shimmer/core";
import {
  Choice,
  Content,
  dom,
  EFFECTS,
  IntoReactive,
  PresentComponentDefinition,
  Pure,
  Reactive,
  VariantInfo,
  Variants,
} from "@shimmer/core";
import { comment, def, effect, element, match } from "@shimmer/dsl";

export type Attributes = Readonly<Record<string, IntoReactive<string | null>>>;

export type ModifiersSpec = Attributes & {
  readonly [EFFECTS]?: readonly EffectModifier[];
};

export const el = element;

export const ToBool = (value: Reactive<unknown>): Reactive<Choice<Bool>> =>
  Pure.of(() => {
    if (value.now) {
      return Bool.of("true", Reactive.static(true));
    } else {
      return Bool.of("false", Reactive.static(false));
    }
  });

export const If = <T, U>(
  bool: IntoReactive<boolean>,
  ifTrue: IntoReactive<T>,
  ifFalse: IntoReactive<U>
): Reactive<T | U> => {
  let condition = Reactive.from(bool);
  let trueBranch = Reactive.from(ifTrue);
  let falseBranch = Reactive.from(ifFalse);

  return Pure.of(() => (condition.now ? trueBranch.now : falseBranch.now));
};

interface CondArgs extends PresentComponentDefinition {
  args: {
    bool: Reactive<Choice<Bool>>;
  };
  blocks: { ifTrue: Block<[]>; ifFalse?: Block<[]> };
}

export const Cond = def<CondArgs>(
  ({ args: { bool }, blocks: { ifTrue, ifFalse } }: CondArgs): Content => {
    let res = match(bool, {
      true: () => ifTrue.invoke([]),
      false: ifFalse ? () => ifFalse.invoke([]) : () => comment(""),
    });

    return res;
  }
);

export const Classes = (
  ...classes: IntoReactive<string | null>[]
): Reactive<string | null> => {
  let reactive = classes.map((c) => Reactive.from(c));

  return Pure.of(() => {
    let className = [];

    for (let item of reactive) {
      let value = item.now;

      if (value !== null) {
        className.push(value);
      }
    }

    if (className.length === 0) {
      return null;
    } else {
      return className.join(" ");
    }
  });
};

export const on = effect(
  (
    element: dom.SimplestElement,
    eventName: Reactive<string>,
    callback: Reactive<EventListener>
  ) => {
    (element as Element).addEventListener(eventName.now, callback.now);
  }
);

export type Bool = {
  true: VariantInfo<"true", Reactive<true>>;
  false: VariantInfo<"false", Reactive<false>>;
};

console.log("BOOL");

export const Bool = Variants.define<Bool>();
