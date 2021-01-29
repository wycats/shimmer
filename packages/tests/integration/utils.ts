import {
  Args,
  createEffect,
  createStaticEffect,
  EffectContext,
  EffectModifier,
} from "@shimmer/core";
import type {
  EventHandlerMap,
  EventHooks,
  On,
  SimplestElement,
} from "@shimmer/dom";
import { isReactive, Reactive, StaticReactive } from "@shimmer/reactive";

export function staticEffectFunction<A extends Args>(
  callback: (element: SimplestElement, ...args: A) => void
): (...args: IntoArgs<A>) => EffectModifier<A> {
  let e = createStaticEffect<A>(({ cursor }, args) =>
    callback(cursor.asElement(), ...args)
  );

  return (...into: IntoArgs<A>): EffectModifier<A> => {
    let args = intoArgs(into);

    return e(args);
  };
}

export function effectFunction<A extends Args>(
  callback: (ctx: EffectContext, ...args: A) => void
): (...args: IntoArgs<A>) => EffectModifier<A> {
  let e = createEffect<A>((ctx, args) => callback(ctx, ...args));

  return (...into: IntoArgs<A>): EffectModifier<A> => {
    let args = intoArgs(into);

    return e(args);
  };
}

export class TestEventHooks implements EventHooks<SimplestElement, object> {
  static create(map: EventHandlerMap<TestEventHooks>): TestEventHooks {
    return new TestEventHooks(map);
  }

  declare ELEMENT_TYPE: SimplestElement;
  declare EVENT_TYPE: object;

  #map: EventHandlerMap<TestEventHooks>;

  constructor(map: EventHandlerMap<TestEventHooks>) {
    this.#map = map;
  }

  fire({
    callback,
    data,
  }: {
    element: SimplestElement;
    event: string;
    callback: On<object>;
    data: object;
  }): void {
    callback.fire(data);
  }

  addEventListener(_options: {
    element: SimplestElement;
    event: string;
    callback: (
      event: object
    ) => readonly (
      | { type: "stopPropagation" }
      | { type: "stopImmediatePropagation" }
      | { type: "preventDefault" }
    )[];
  }): () => void {
    // do nothing, we're just going to introspect the event map
    // for test assertions
    return () => undefined;
  }
}

export const on = effectFunction(
  (
    ctx: EffectContext,
    eventName: Reactive<string>,
    callback: Reactive<EventListener>
  ) => {
    // let realm = getCurrentRealm();
    ctx.realm.events.on(ctx.element, eventName.now, (event) => {
      callback.now(event);
      return [];
    });
    ctx.element.addEventListener(eventName.now, callback.now);
  }
);

type IntoReactive<T> = Reactive<T> | T;

export type IntoArgs<A extends Args> = {
  [P in keyof A]: A[P] extends Reactive<infer T> ? IntoReactive<T> : never;
};

export function intoArgs<A extends Args>(into: IntoArgs<A>): A {
  return (into.map((arg) => intoReactive(arg)) as unknown) as A;
}

export function intoReactive<T>(into: IntoReactive<T>): Reactive<T> {
  if (isReactive(into)) {
    return into;
  } else {
    return Reactive.static(into) as StaticReactive<T>;
  }
}

export class ElementRef {
  static of(desc: string): { modifier: EffectModifier; ref: ElementRef } {
    let ref = new ElementRef(desc);
    return { modifier: ref.modifier(), ref };
  }

  #element: SimplestElement | null = null;
  #desc: string;

  constructor(desc: string) {
    this.#desc = desc;
  }

  modifier(): EffectModifier {
    return staticEffectFunction((element: SimplestElement) =>
      this.#attach(element)
    )();
  }

  #attach = (value: SimplestElement): void => {
    this.#element = value;
  };

  get element(): Element {
    if (this.#element === null) {
      throw new Error(
        `Attempting to access ${
          this.#desc
        } before it was attached. Make sure to wait for rendering to finish before accessing a ref.`
      );
    }

    return this.#element as Element;
  }
}
