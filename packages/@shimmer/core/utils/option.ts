export abstract class Maybe<T> {
  static some<T>(value: T): Some<T> {
    return new Some(value);
  }

  static none<T>(): None<T> {
    return new None();
  }

  abstract match<U, V>(options: {
    None: () => U;
    Some: (value: T) => V;
  }): U | V;

  ifSome<U>(callback: (value: T) => U): Maybe<U> {
    return this.match({
      None: () => Maybe.none(),
      Some: (value) => Maybe.some(callback(value)),
    });
  }

  or(callback: () => T): T {
    return this.match({
      None: callback,
      Some: (value) => value,
    });
  }
}

export class Some<T> extends Maybe<T> {
  #value: T;

  constructor(value: T) {
    super();
    this.#value = value;
  }

  match<U, V>(options: { None: () => U; Some: (value: T) => V }): U | V {
    return options.Some(this.#value);
  }
}

export class None<T> extends Maybe<T> {
  match<U, V>(options: { None: () => U; Some: (value: T) => V }): U | V {
    return options.None();
  }
}
