// @ts-nocheck

import { isObject } from "../utils/predicates";
import { IntoReactive, Reactive, ReactiveValue } from "./cell";

export type ReactiveObject = {
  [P in string]: RecursiveReactive;
};

export type ReactiveArray = Array<RecursiveReactive>;

export type RecursiveReactive =
  | IntoReactive<unknown>
  | ReactiveObject
  | ReactiveArray;

export type MapValue<R> = R extends ReactiveValue<infer T>
  ? MapValue<T>
  : R extends unknown[] | object
  ? MapNested<R>
  : R;

export type MapNested<R extends unknown[] | object> = {
  [P in keyof R]: MapValue<R[P]>;
};

export function ReactiveProxy<R extends RecursiveReactive>(
  value: R
): Proxify<R> {
  if (value === null || typeof value !== "object") {
    return value as MapValue<R>;
  }

  return new Proxy(
    {
      value: Reactive.from(value),
    },
    {
      get({ value }, prop) {
        let current = value.now;

        if (isObject(current)) {
          let inner = current[prop as any] as unknown;

          if (Reactive.isCoercible(inner)) {
            return Reactive.from(inner).now;
          } else {
            return ReactiveProxy(inner);
          }
        } else {
          return undefined;
        }
      },
    }
  ) as MapValue<R>;
}
