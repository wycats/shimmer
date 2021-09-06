import { Reactive } from "../reactive/reactive";
import { Revision } from "../reactive/revision";
import { Timeline } from "../reactive/timeline";

/** @internal */
export class AbstractUpdate<T> {
  readonly #value: T;

  constructor(value: T) {
    this.#value = value;
  }

  get value(): T {
    return this.#value;
  }
}

/**
 * A `FreshUpdate` is returned by the {@link Validator#poll} method to indicate
 * that the underlying reactive variable has not changed.
 */
export class FreshUpdate<T> extends AbstractUpdate<T> {
  readonly fresh = true;
}

/**
 * A `StaleUpdate` is returned by the {@link Validator#poll} method to indicate
 * that the underlying reactive variable *has* changed.
 */
export class StaleUpdate<T> extends AbstractUpdate<T> {
  readonly fresh = false;
}

/**
 * An `Update` is one of:
 *
 * - {@link FreshUpdate}
 * - {@link StaleUpdate}
 *
 * The `fresh` property of `Update` is a boolean that indicates whether the
 * {@link Validator#poll} operation that returned the `Update` is fresh or
 * stale.
 *
 * The `value` property of `Update` is always the most up-to-date value of the
 * underlying reactive variable.
 */
export type Update<T> = FreshUpdate<T> | StaleUpdate<T>;

export const Update = {
  fresh<T>(value: T): FreshUpdate<T> {
    return new FreshUpdate(value);
  },

  stale<T>(value: T): StaleUpdate<T> {
    return new StaleUpdate(value);
  },
};

/**
 * A `Validator` is a stable object that represents a **single** consumption
 * from a particular reactive variable.
 *
 * Internally, each `Validator` stores the last time it validated the underlying
 * reactive variable. When polled, the `Validator` returns one of:
 *
 * - A {@link FreshUpdate}, which means that the variable hasn't changed since it was
 *   last polled.
 * - A {@link StaleUpdate}, which means that the variable *has* changed since it was
 *   last polled.
 *
 * Reactive variables themselves don't track consumptions, so they can be shared
 * freely across multiple variables.
 */
export class Validator<T> {
  static initialize<T>(
    reactive: Reactive<T>,
    timeline: Timeline
  ): () => { validator: Validator<T>; value: T } {
    return () => {
      let value = reactive.current;
      let now = timeline.now;

      return { validator: new Validator(reactive, value, now), value };
    };
  }

  #lastValue: T;
  #lastChecked: Revision;
  #reactive: Reactive<T>;

  constructor(reactive: Reactive<T>, lastValue: T, lastChecked: Revision) {
    this.#reactive = reactive;
    this.#lastValue = lastValue;
    this.#lastChecked = lastChecked;
  }

  poll(now: Revision): Update<T> {
    let isFresh = this.#reactive.isFresh(this.#lastChecked);
    this.#lastChecked = now;

    if (isFresh) {
      return Update.fresh(this.#lastValue);
    } else {
      this.#lastValue = this.#reactive.current;
      return Update.stale(this.#lastValue);
    }
  }
}
