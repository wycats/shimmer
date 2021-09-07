import { Reactive } from "./reactive";
import { Revision } from "./revision";

export type ReactiveArray<T extends unknown[]> = {
  readonly [P in keyof T]: Reactive<T[P]>;
};

/**
 * A `StrictReactiveFunction` is a function that takes an array of reactive
 * arguments and produces a {@link StrictReactiveComputation}.
 *
 * While a {@link StrictReactiveComputation} is a {@link Reactive} value, a
 * {@link StrictReactiveFunction} is simply a wrapper around an uninvoked
 * function.
 */
export class StrictReactiveFunction<Args extends unknown[], T> {
  static of<Args extends unknown[], T>(
    callback: (...args: ReactiveArray<Args>) => T
  ): StrictReactiveFunction<Args, T> {
    return new StrictReactiveFunction(callback);
  }

  #callback: (...args: ReactiveArray<Args>) => T;

  constructor(callback: (...args: ReactiveArray<Args>) => T) {
    this.#callback = callback;
  }

  invoke(...args: ReactiveArray<Args>): StrictReactiveComputation<Args, T> {
    return new StrictReactiveComputation(args, this.#callback);
  }
}

/**
 * A `StrictComputation` is a computation whose body does not access any
 * interior reactive values. This means that the static-ness of a
 * `StrictComputation` can be determined entirely by examining the input values.
 */
export class StrictReactiveComputation<Args extends unknown[], T>
  implements Reactive<T>
{
  #args: ReactiveArray<Args>;
  #callback: (...args: ReactiveArray<Args>) => T;

  constructor(
    args: ReactiveArray<Args>,
    callback: (...args: ReactiveArray<Args>) => T
  ) {
    this.#args = args;
    this.#callback = callback;
  }

  isFresh(lastChecked: Revision): boolean {
    return this.#args.every((a) => a.isFresh(lastChecked));
  }

  get isStatic(): boolean {
    return this.#args.every((a) => a.isStatic);
  }

  get current(): T {
    return this.#callback(...this.#args);
  }
}
