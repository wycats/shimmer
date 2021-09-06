import { Reactive } from "./reactive";

export type ReactiveArray<T extends unknown[]> = {
  readonly [P in keyof T]: Reactive<T[P]>;
};

/**
 * A `StrictComputation` is a computation whose body does not access any
 * interior reactive values. This means that the static-ness of a
 * `StrictComputation` can be determined entirely by examining the input values.
 */
export class StrictComputation<Args extends unknown[], T>
  implements Reactive<T>
{
  #args: ReactiveArray<Args>;
  #callback: (...args: Args) => T;

  constructor(args: ReactiveArray<Args>, callback: (...args: Args) => T) {
    this.#args = args;
    this.#callback = callback;
  }

  get isStatic(): boolean {
    return this.#args.every((a) => a.isStatic);
  }

  get current(): T {
    let args = this.#args.map((a) => a.current) as Args;
    return this.#callback(...args);
  }
}
