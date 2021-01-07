import { consumeTag, createTag, dirtyTag } from "@glimmer/validator";
import { Pure } from "../glimmer/cache";
import { isObject } from "../utils/predicates";

export type Reactive<T> = Cell<T> | Static<T> | Pure<T>;

export type IntoReactive<T> = Reactive<T> | T;

export const Reactive = {
  static: <T>(value: T): Static<T> => new Static(value),
  cell: <T>(value: T): Cell<T> => new Cell(value),

  isStatic: <T>(value: Reactive<T>): value is Static<T> =>
    value instanceof Static,

  from: <T>(reactive: IntoReactive<T>): Reactive<T> => {
    if (!isObject(reactive)) {
      return new Static(reactive);
    }

    if (Cell.is(reactive) || Static.is(reactive) || Pure.is(reactive)) {
      return reactive;
    }

    return new Static(reactive);
  },
};

export class Static<T = unknown> {
  static is(value: unknown): value is Static {
    return isObject(value) && value instanceof Static;
  }

  constructor(readonly current: T) {}
}

export class Cell<T = unknown> {
  static of<T>(value: T): Cell<T> {
    return new Cell(value);
  }

  static is(value: unknown): value is Cell {
    return isObject(value) && value instanceof Cell;
  }

  #value: T;
  #tag = createTag();

  constructor(value: T) {
    this.#value = value;
  }

  get current() {
    consumeTag(this.#tag);
    return this.#value;
  }

  update(callback: (oldValue: T) => T) {
    dirtyTag(this.#tag);
    this.#value = callback(this.#value);
  }
}
