import { registerDestructor } from "@glimmer/destroyable";
import { Cache, createCache, getValue } from "@glimmer/validator";
import { unwrap } from "../assertions";
import type { RenderedContent } from "../nodes/content";
import { assertDynamicContext } from "../reactive/cell";
import { Maybe } from "../utils/option";
import { isObject } from "../utils/predicates";

console.log("CACHE");

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
  }: EffectOptions<T>): { cache: Cache<T>; destructor?: (last: T) => void } {
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

    return new Effect(cache, destructor, unwrap(getValue(cache)));
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

  /** @internal */
  get last(): T {
    return this.#last;
  }

  poll(): T {
    return unwrap(getValue(this.#cache));
  }
}

export class DynamicRenderedContent extends Effect<RenderedContent> {
  static create(options: {
    initialize: () => RenderedContent;
    update: (last: RenderedContent) => RenderedContent;
    destructor?: (last: RenderedContent) => void;
  }): DynamicRenderedContent {
    let { cache, destructor } = Effect.cache(options);

    return new DynamicRenderedContent(
      cache,
      destructor,
      unwrap(getValue(cache))
    );
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

  readonly type = "value";

  #cache: Cache<T>;

  constructor(cache: Cache<T>) {
    this.#cache = cache;
  }

  get now(): T {
    assertDynamicContext(
      "getting the current JavaScript value of a reactive value (Derived)"
    );

    return unwrap(getValue(this.#cache));
  }

  get debug(): T {
    return unwrap(getValue(this.#cache));
  }
}
