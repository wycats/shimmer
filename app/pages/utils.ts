import { Choice, Content, VariantInfo, Variants } from "@shimmer/core";
import { comment, defDSL, effectFunction, element, match } from "@shimmer/dsl";
import { Block, computed, IntoReactive, Reactive } from "@shimmer/reactive";

export type Attributes = Readonly<Record<string, IntoReactive<string | null>>>;

export const el = element;

export const ToBool = (value: Reactive<unknown>): Reactive<Choice<Bool>> =>
  computed(() => {
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

  return computed(() => (condition.now ? trueBranch.now : falseBranch.now));
};

export const Cond = defDSL(
  ({
    args: { bool },
    blocks: { ifTrue, ifFalse },
  }: {
    ifTrue: Block<[]>;
    ifFalse: Block<[]>;
  }): Content => {
    let res = match(bool, {
      true: () => ifTrue([]),
      false: ifFalse ? () => ifFalse.invoke([]) : () => comment(""),
    });

    return res;
  }
);

export const Classes = (
  ...classes: IntoReactive<string | null>[]
): Reactive<string | null> => {
  let reactive = classes.map((c) => Reactive.from(c));

  return computed(() => {
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

export const on = effectFunction(
  (
    element: Element,
    eventName: Reactive<string>,
    callback: Reactive<EventListener>
  ) => {
    element.addEventListener(eventName.now, callback.now);
  }
);

export type Bool = {
  true: VariantInfo<"true", Reactive<true>>;
  false: VariantInfo<"false", Reactive<false>>;
};

export const Bool = Variants.define<Bool>();
