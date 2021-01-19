import { registerDestructor } from "@glimmer/destroyable";
import {
  Cache as RawCache,
  createCache as rawCreateCache,
  getValue as rawGetValue,
  isConst as rawIsConst,
} from "@glimmer/validator";
import { isPure, IS_PURE } from "./brands";
import { assertDynamicContext } from "./cell";
import { Maybe } from "./option";
import { isObject } from "./utils";

declare const CACHE_KEY: unique symbol;
export interface TrackedCache<T = unknown> {
  [CACHE_KEY]: T;
}
export function createCache<T>(
  fn: () => T,
  debuggingLabel?: string | false
): TrackedCache<T> {
  return (rawCreateCache(fn, debuggingLabel) as unknown) as TrackedCache<T>;
}

export function getValue<T>(cache: TrackedCache<T>): T {
  return rawGetValue((cache as unknown) as RawCache<T>) as T;
}

export function isConst(cache: Cache): boolean {
  return rawIsConst((cache as unknown) as RawCache);
}

export interface EffectOptions<T> {
  initialize: () => T;
  update: (last: T) => T;
  destructor?: (last: T) => void;
}

export class Effect<T> {
  static is(value: unknown): value is Effect<unknown> {
    return isObject(value) && value instanceof Effect;
  }

  static cache<T>({
    initialize,
    update,
    destructor,
  }: EffectOptions<T>): {
    cache: TrackedCache<T>;
    destructor?: (last: T) => void;
  } {
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

    return { cache, destructor };
  }

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

    return new Effect(cache, destructor, getValue(cache));
  }

  #last: T;
  #cache: TrackedCache<T>;

  constructor(
    cache: TrackedCache<T>,
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

  /** @internal */
  get last(): T {
    return this.#last;
  }

  poll(): T {
    return getValue(this.#cache);
  }
}

export class Pure<T> {
  static is(value: unknown): value is Pure<unknown> {
    return isPure(value);
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

  readonly type = "value";
  readonly [IS_PURE] = true;

  #cache: TrackedCache<T>;

  constructor(cache: TrackedCache<T>) {
    this.#cache = cache;
  }

  get now(): T {
    assertDynamicContext(
      "getting the current JavaScript value of a reactive value (Derived)"
    );

    return getValue(this.#cache);
  }

  get debug(): T {
    return getValue(this.#cache);
  }
}
