export function assert(check: unknown, msg: string): asserts check {
  if (!check) {
    throw new Error(`VIOLATION: ${msg}`);
  }
}

export function unwrap<T>(
  value: T | null | undefined,
  msg = `unexpected null`
): T {
  if (value == null) {
    throw new Error(msg);
  }

  return value;
}

export function userError(check: unknown, msg: string): asserts check {
  if (!check) {
    throw new Error(`Shimmer detected a mistake: ${msg}`);
  }
}
