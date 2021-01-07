import { Cache, createCache, getValue } from "@glimmer/validator";
import { Maybe } from "../utils/option";
import { registerDestructor } from "@glimmer/destroyable";
import { isObject } from "../utils/predicates";

export class Effect<T> {
  static of<T>({
    initialize,
    update,
    destructor,
  }: {
    initialize: () => T;
    update: (last: T) => T;
    destructor?: (last: T) => void;
  }): Effect<T> {
    let last: Maybe<T> = Maybe.none();

    let cache = createCache(() => {
      return last.match({
        None: () => {
          let next = initialize();
          last = Maybe.some(next);
          return next;
        },
        Some: (prev: T) => {
          let next = update(prev);
          last = Maybe.some(next);
          return next;
        },
      });
    });

    return new Effect(cache, destructor, getValue(cache)!);
  }

  #last: T;
  #cache: Cache<T>;

  constructor(
    cache: Cache<T>,
    destructor: ((last: T) => void) | undefined,
    last: T
  ) {
    this.#cache = cache;
    this.#last = last;

    if (destructor) {
      registerDestructor(this, () => {
        destructor(this.#last);
      });
    }
  }

  poll(): T {
    return getValue(this.#cache)!;
  }
}

export class Pure<T> {
  static is(value: unknown): value is Pure<unknown> {
    return isObject(value) && value instanceof Pure;
  }

  static of<T>(
    options:
      | {
          initialize: () => T;
          update: (last: T) => T;
        }
      | (() => T)
  ): Pure<T> {
    if (typeof options === "function") {
      return new Pure(createCache(options));
    } else {
      let { initialize, update } = options;
      let last: Maybe<T> = Maybe.none();

      let cache = createCache(() => {
        return last.match({
          None: () => initialize(),
          Some: (last: T) => update(last),
        });
      });

      return new Pure(cache);
    }
  }

  #cache: Cache<T>;

  constructor(cache: Cache<T>) {
    this.#cache = cache;
  }

  get current(): T {
    return getValue(this.#cache)!;
  }
}
