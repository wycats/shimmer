import {
  Args,
  ComponentArgs,
  Content,
  createText,
  IntoComponentArgs,
  IntoContent,
  isContent,
} from "@shimmer/core";
import { isReactive, Reactive, StaticReactive } from "@shimmer/reactive";

export type IntoReactive<T> = Reactive<T> | T;

export function intoReactive<T>(into: IntoReactive<T>): Reactive<T> {
  if (isReactive(into)) {
    return into;
  } else {
    return Reactive.static(into) as StaticReactive<T>;
  }
}

export function intoContent(into: IntoContent): Content {
  if (isContent(into)) {
    return into;
  } else if (isReactive(into)) {
    return createText(into);
  } else {
    return createText(Reactive.static(into));
  }
}

export function intoComponentArgs<A extends ComponentArgs>(
  args: IntoComponentArgs<A> | undefined
): A | undefined {
  if (args === undefined) {
    return args;
  }

  let out: ComponentArgs = {};

  for (let [key, value] of Object.entries(args)) {
    out[key] = intoReactive(value);
  }

  return out as A;
}

export type IntoArgs<A extends Args> = {
  [P in keyof A]: A[P] extends Reactive<infer T> ? IntoReactive<T> : never;
};

export function intoArgs<A extends Args>(into: IntoArgs<A>): A {
  return (into.map((arg) => intoReactive(arg)) as unknown) as A;
}
