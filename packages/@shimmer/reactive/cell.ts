import { consumeTag, createTag, dirtyTag } from "@glimmer/validator";
import {
  isCell,
  isReactive,
  IS_CELL,
  IS_STABLE_CELL,
  IS_STATIC,
  STATIC_REACTIVE_VALUE,
} from "./brands";
import type { Pure } from "./cache";

export type IntoReactive<T> = Reactive<T> | T;

export const Reactive = {
  static: <T>(value: T): StaticReactive<T> => new StaticReactive(value),
  cell: <T>(value: T): Cell<T> => new Cell(value),
  stable: <T>(value: Reactive<T>): StableCell<T> => StableCell.of(value),
  from: intoReactive,
};

function intoReactive<T extends unknown>(
  reactive: T | Reactive<T>
): Reactive<T> {
  if (isReactive(reactive)) {
    return reactive;
  } else {
    return Reactive.static(reactive);
  }
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

  get [STATIC_REACTIVE_VALUE](): T {
    return super.now;
  }

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

  _peek(): T {
    return this.#value;
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

  set(value: T): void {
    this.update(() => value);
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

export class StableCell<T = unknown> {
  static of<T>(reactive: Reactive<T>): StableCell<T> {
    return new StableCell(reactive);
  }

  readonly type = "value";

  [IS_STABLE_CELL] = true;

  #reactive: Reactive<T>;
  #cell: Cell<Reactive<T>>;

  constructor(reactive: Reactive<T>) {
    this.#reactive = reactive;
    this.#cell = Cell.of(reactive);
  }

  get now(): T {
    return this.#cell.now.now;
  }

  set(next: IntoReactive<T>): void {
    if (isReactive(next)) {
      this.setReactive(next);
    } else {
      this.setValue(next);
    }
  }

  #updateReactive = (value: Reactive<T>): void => {
    this.#cell.update(() => value);
  };

  #updateValue = (cell: Cell<T>, value: T): void => {
    cell.update(() => value);
  };

  setValue(value: T): void {
    if (isCell(this.#reactive)) {
      this.#updateValue(this.#reactive, value);
    } else {
      this.#updateReactive(Cell.of(value));
    }
  }

  setReactive(reactive: Reactive<T>): void {
    this.#updateReactive(reactive);
  }

  // updateValue(callback: (prev: T) => T): void {
  //   if (isCell(this.#reactive)) {
  //     this.#reactive.update(callback);
  //   } else {
  //     this.#cell.update((prev) => {
  //       let next = callback(prev.now);
  //       return Cell.of(next);
  //     });
  //   }
  // }

  // update(callback: (prev: Reactive<T>) => Reactive<T>): void {
  //   this.#cell.update((prev) => intoReactive(callback(prev)));
  // }
}

// export function indirect<T>(value: Cell<Reactive<T>>):

export type Reactive<T extends unknown> =
  | Cell<T>
  | StaticReactive<T>
  | Pure<T>
  | StableCell<T>;
