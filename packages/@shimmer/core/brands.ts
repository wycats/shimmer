import type { Pure } from "./glimmer/cache";
import type { Content } from "./nodes/content";
import type {
  Cell,
  Reactive,
  StaticReactive,
  StaticValue,
} from "./reactive/cell";
import { isObject } from "./utils/predicates";

export const IS_PURE = Symbol("IS_PURE");
export type IS_PURE = typeof IS_PURE;

export function isPure(value: unknown): value is Pure<unknown> {
  return isObject(value) && IS_PURE in value;
}

export const IS_STATIC = Symbol("IS_STATIC");
export type IS_STATIC = typeof IS_STATIC;

export function isStaticValue(value: unknown): value is StaticValue<unknown> {
  return isObject(value) && IS_STATIC in value;
}

export const IS_STATIC_REACTIVE = Symbol("IS_STATIC_REACTIVE");
export type IS_STATIC_REACTIVE = typeof IS_STATIC_REACTIVE;

export function isStaticReactive(
  value: unknown
): value is StaticReactive<unknown> {
  return isObject(value) && IS_STATIC_REACTIVE in value;
}

export function isStatic(
  value: unknown
): value is StaticValue<unknown> | StaticReactive<unknown> {
  return isStaticReactive(value) || isStaticValue(value);
}

export const IS_CELL = Symbol("IS_CELL");
export type IS_CELL = typeof IS_CELL;

export function isCell(value: unknown): value is Cell<unknown> {
  return isObject(value) && IS_CELL in value;
}

export const IS_CONTENT = Symbol("IS_CONTENT");
export type IS_CONTENT = typeof IS_CONTENT;

export function isContent(value: unknown): value is Content {
  return isObject(value) && IS_CONTENT in value;
}

export function isReactive(value: unknown): value is Reactive<unknown> {
  return isCell(value) || isStaticReactive(value) || isPure(value);
}
