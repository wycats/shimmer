export function* enumerate<T>(input: Iterable<T>): Generator<[T, number]> {
  let i = 0;

  for (let item of input) {
    yield [item, i++];
  }
}

export function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

export function isIndexable(
  value: unknown
): value is object | ((...args: unknown[]) => unknown) {
  return typeof value === "function" || isObject(value);
}

export function unreachable(message: string, _value?: never): never {
  throw new Error(`VIOLATION: ${message}`);
}
