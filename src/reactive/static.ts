import { Reactive } from "./reactive";
import { Revision } from "./revision";

export class Static<T> implements Reactive<T> {
  readonly #value: T;

  readonly isStatic = true;

  constructor(value: T) {
    this.#value = value;
  }

  get current(): T {
    return this.#value;
  }

  isStale(): false {
    return false;
  }

  isFresh(_lastChecked: Revision): true {
    return true;
  }
}
