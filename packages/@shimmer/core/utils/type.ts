import { assert } from "@shimmer/dev-mode";

export abstract class OptionalArray<T, U extends T[] = T[]>
  implements Iterable<T> {
  static of<T>(array: T[] | readonly T[]): OptionalArray<T> {
    if (array.length === 0) {
      return new EmptyArray(array as []);
    } else {
      return new PresentArray(array as [T, ...T[]]);
    }
  }

  #array: U;

  constructor(array: U) {
    this.#array = array;
  }

  isPresent(): this is PresentArray<T> {
    return this.#array.length > 0;
  }

  flatMap<U>(callback: (value: T) => U[]): OptionalArray<U> {
    let out: U[] = [];

    for (let item of this) {
      out.push(...callback(item));
    }

    return OptionalArray.of(out);
  }

  toArray(): readonly T[] {
    return this.#array;
  }

  *[Symbol.iterator](): IterableIterator<T> {
    for (let item of this.#array) {
      yield item;
    }
  }

  map<U>(callback: (value: T) => U): OptionalArray<U> {
    return this.flatMap((value) => [callback(value)]);
  }

  filter(callback: (value: T) => boolean): OptionalArray<T> {
    return this.flatMap((value) => (callback(value) ? [value] : []));
  }

  every<U extends T>(
    callback: (value: T) => value is U
  ): this is OptionalArray<U> {
    for (let item of this) {
      if (!callback(item)) {
        return false;
      }
    }

    return true;
  }

  first(): T | null {
    if (this.#array.length === 0) {
      return null;
    } else {
      return this.#array[0] as T;
    }
  }

  last(): T | null {
    if (this.#array.length === 0) {
      return null;
    } else {
      return this.#array[this.#array.length - 1] as T;
    }
  }
}

export class PresentArray<T> extends OptionalArray<T, [T, ...T[]]> {
  static of<T>(array: T[] | readonly T[]): PresentArray<T> {
    assert(
      array.length > 0,
      `Cannot instantiate PresentArray with an empty array`
    );

    return new PresentArray(array as [T, ...T[]]);
  }

  declare map: <U>(callback: (this: this, value: T) => U) => PresentArray<U>;
  declare every: <U extends T>(
    this: this,
    callback: (value: T) => value is U
  ) => this is PresentArray<U>;

  declare first: (this: this) => T;
  declare last: (this: this) => T;

  split(): [T, OptionalArray<T>] {
    let iter = this[Symbol.iterator]();

    let first: T = iter.next().value;

    return [first, OptionalArray.of([...iter])];
  }
}

export class EmptyArray<T> extends OptionalArray<T, []> {}
