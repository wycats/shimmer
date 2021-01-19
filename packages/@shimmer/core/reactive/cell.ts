import { consumeTag, createTag, dirtyTag } from "@glimmer/validator";
import { isReactive, IS_CELL, IS_STATIC, IS_STATIC_REACTIVE } from "../brands";
import type { Pure } from "../glimmer";
import { isObject } from "../utils";

export type IntoReactive<T> = Reactive<T> | T;

export type Reactive<T> = Cell<T> | StaticReactive<T> | Pure<T>;

export const Reactive = {
  static: <T>(value: T): StaticReactive<T> => new StaticReactive(value),
  cell: <T>(value: T): Cell<T> => new Cell(value),
  from: intoReactive,
};

function intoReactive<T>(reactive: IntoReactive<T>): Reactive<T> {
  if (!isObject(reactive)) {
    return new StaticReactive(reactive);
  }

  if (isReactive(reactive)) {
    return reactive;
  }

  return Reactive.static(reactive);
}

export abstract class AbstractStatic<T = unknown> {
  readonly type = "value";

  #now: T;

  constructor(now: T) {
    this.#now = now;
  }

  get now(): T {
    return this.#now;
  }
}

export class StaticValue<T = unknown> extends AbstractStatic<T> {
  readonly [IS_STATIC] = true;
}

export class StaticReactive<T = unknown> extends AbstractStatic<T> {
  static of<T>(value: T): StaticReactive<T> {
    return new StaticReactive(value);
  }

  readonly [IS_STATIC_REACTIVE] = true;

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

  readonly [IS_CELL] = true;
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
