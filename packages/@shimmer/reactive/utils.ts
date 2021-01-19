export function* enumerate<T>(input: Iterable<T>): Generator<[T, number]> {
  let i = 0;

  for (let item of input) {
    yield [item, i++];
  }
}

export function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}
