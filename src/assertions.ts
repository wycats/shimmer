export function assert(check: unknown, msg: string): asserts check {
  if (!check) {
    throw new Error(`VIOLATION: ${msg}`);
  }
}

export function userError(check: unknown, msg: string): asserts check {
  if (!check) {
    throw new Error(`Proact detected a mistake: ${msg}`);
  }
}
