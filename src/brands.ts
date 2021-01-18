import type { Pure } from "./glimmer/cache";
import { isObject } from "./utils/predicates";

export const IS_PURE = Symbol("IS_PURE");
export type IS_PURE = typeof IS_PURE;

export function isPure(value: unknown): value is Pure<unknown> {
  return isObject(value) && IS_PURE in value;
}
