import { consumeTag, createTag, dirtyTag } from "@glimmer/validator";
import { isPure } from "../brands";
import type { Pure } from "../glimmer/cache";
import { isObject } from "../utils/predicates";
import { Dict } from "./dict";

export type IntoReactive<T> = Reactive<T> | Static<T> | T;

export type Reactive<T> = Cell<T> | StaticReactive<T> | Pure<T> | Dict<T>;

console.log("CELL");

export const Reactive = {
  static: <T>(value: T): StaticReactive<T> => new StaticReactive(value),
  cell: <T>(value: T): Cell<T> => new Cell(value),

  is: (value: unknown): value is Reactive<unknown> => {
    return (
      Cell.is(value) ||
      StaticReactive.is(value) ||
      isPure(value) ||
      Dict.is(value)
    );
  },

  isStatic: (
    value: Reactive<unknown> | Static<unknown>
  ): value is StaticReactive<unknown> =>
    value instanceof StaticReactive || value instanceof Static,

  from: intoReactive,
};

function intoReactive<T>(reactive: IntoReactive<T>): Reactive<T> {
  if (!isObject(reactive)) {
    return new StaticReactive(reactive);
  }

  if (Static.is(reactive)) {
    return Reactive.static(reactive.now);
  }

  if (
    Cell.is(reactive) ||
    StaticReactive.is(reactive) ||
    isPure(reactive) ||
    Dict.is(reactive)
  ) {
    return reactive;
  }

  return Reactive.static(reactive);
}

export abstract class AbstractStatic<T = unknown> {
  static is<T, S>(this: { new (now: T): S }, value: unknown): value is S {
    return isObject(value) && value instanceof this;
  }

  readonly type = "value";

  #now: T;

  constructor(now: T) {
    this.#now = now;
  }

  get now(): T {
    return this.#now;
  }
}

export class Static<T = unknown> extends AbstractStatic<T> {}

export class StaticReactive<T = unknown> extends AbstractStatic<T> {
  get now(): T {
    assertDynamicContext(
      "getting the current JavaScript value of a reactive value (Static)"
    );

    return super.now;
  }

  get debug(): T {
    return super.now;
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

  get now(): T {
    assertDynamicContext(
      "getting the current JavaScript value of a reactive value (Cell)"
    );

    consumeTag(this.#tag);
    return this.#value;
  }

  get debug(): T {
    return this.now;
  }

  update(callback: (oldValue: T) => T): void {
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
