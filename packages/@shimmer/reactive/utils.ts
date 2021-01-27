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

type MapRecord<R extends Record<keyof any, any>, V> = {
  [P in keyof R]: V;
};

export function mapRecord<K extends string, V, V2>(
  record: Record<K, V>,
  callback: (value: V, key: K) => V2
) {
  let out = {} as Record<K, V2>;

  for (let [key, value] of Object.entries(record)) {
    out[key as K] = callback(value as V, key as K);
  }

  return out;
}
