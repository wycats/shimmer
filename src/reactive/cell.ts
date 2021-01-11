import { consumeTag, createTag, dirtyTag } from "@glimmer/validator";
import { Pure } from "../glimmer/cache";
import { isObject } from "../utils/predicates";

// export interface ReactiveNode<T> {
//   type: "value" | "record";
//   get?<K extends keyof T>(this: ReactiveNode<object>, key: K): Reactive<T[K]>;
// }

// export type Reactive<T> = T extends SuppliedRecord
//   ? ReactiveRecord<T>
//   : Cell<T> | Static<T> | Pure<T>;

export type IntoReactive<T> = Reactive<T> | T;

export type Reactive<T> = Cell<T> | Static<T> | Pure<T>;

// export type DerefReactive<R extends Reactive> = R extends
//   | Cell<infer T>
//   | Static<infer T>
//   | Pure<infer T>
//   ? T
//   : R;

// export type ReactiveValue<T> = Cell<T> | Static<T> | Pure<T>;

// export type IntoReactive<T> = T extends ReactiveRecord<infer U>
//   ? U | ReactiveRecord<U>
//   : T | ReactiveValue<T>;

// export type ConvertIntoReactive<T> = T extends ReactiveValue<infer I>
//   ? ReactiveValue<I>
//   : T extends RecordType
//   ? ReactiveRecord<T>
//   : T extends object
//   ? never
//   : ReactiveValue<T>;

export const Reactive = {
  static: <T>(value: T): Static<T> => new Static(value),
  cell: <T>(value: T): Cell<T> => new Cell(value),

  is: (value: unknown): value is Reactive<unknown> => {
    return Cell.is(value) || Static.is(value) || Pure.is(value);
  },

  isStatic: (value: Reactive<unknown>): value is Static<unknown> =>
    value instanceof Static,

  from: intoReactive,
};

function intoReactive<T>(reactive: IntoReactive<T>): Reactive<T> {
  if (!isObject(reactive)) {
    return new Static(reactive);
  }

  if (Cell.is(reactive) || Static.is(reactive) || Pure.is(reactive)) {
    return reactive;
  }

  return new Static(reactive);
}

export class Static<T = unknown> {
  static is(value: unknown): value is Static {
    return isObject(value) && value instanceof Static;
  }

  readonly type = "value";

  #now: T;

  constructor(now: T) {
    this.#now = now;
  }

  get now(): T {
    assertDynamicContext(
      "getting the current JavaScript value of a reactive value (Static)"
    );

    return this.#now;
  }
}

export class Cell<T = unknown> {
  static of<T>(value: T): Cell<T> {
    return new Cell(value);
  }

  static is(value: unknown): value is Cell {
    return isObject(value) && value instanceof Cell;
  }

  readonly type = "value";

  #value: T;
  #tag = createTag();

  constructor(value: T) {
    this.#value = value;
  }

  get now() {
    assertDynamicContext(
      "getting the current JavaScript value of a reactive value (Cell)"
    );

    consumeTag(this.#tag);
    return this.#value;
  }

  update(callback: (oldValue: T) => T) {
    dirtyTag(this.#tag);
    this.#value = callback(this.#value);
  }
}

let IS_BUILDING = false;

export function assertDynamicContext(operation: string): void {
  if (IS_BUILDING) {
    throw new Error(`You cannot ${operation} while building a component`);
  }
}

export function build<T>(callback: () => T): T {
  let old = IS_BUILDING;
  IS_BUILDING = true;

  try {
    return callback();
  } finally {
    IS_BUILDING = old;
  }
}
