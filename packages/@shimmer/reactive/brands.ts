import type { Content } from "@shimmer/core";
import type { Pure } from "./cache";
import type {
  Cell,
  Reactive,
  StableCell,
  StaticReactive,
  StaticValue,
} from "./cell";
import { isObject } from "./utils";

export const IS_PURE = Symbol("IS_PURE");
export type IS_PURE = typeof IS_PURE;

export function isPure(value: unknown): value is Pure<unknown> {
  return isObject(value) && IS_PURE in value;
}

export const IS_STABLE_CELL = Symbol("IS_STABLE_CELL");
export type IS_STABLE_CELL = typeof IS_STABLE_CELL;

export function isStableCell(value: unknown): value is StableCell<unknown> {
  return isObject(value) && IS_STABLE_CELL in value;
}

export const IS_STATIC = Symbol("IS_STATIC");
export type IS_STATIC = typeof IS_STATIC;

export function isStaticValue(value: unknown): value is StaticValue<unknown> {
  return isObject(value) && IS_STATIC in value;
}

export const STATIC_REACTIVE_VALUE = Symbol("IS_STATIC_REACTIVE");
export type IS_STATIC_REACTIVE = typeof STATIC_REACTIVE_VALUE;

export function isStaticReactive(
  value: unknown
): value is StaticReactive<unknown> {
  return isObject(value) && STATIC_REACTIVE_VALUE in value;
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

export function isReactive<T>(value: T | Reactive<T>): value is Reactive<T> {
  return (
    isObject(value) &&
    (isCell(value) ||
      isStaticReactive(value) ||
      isPure(value) ||
      isStableCell(value))
  );
}

export const ZERO_ARG_BLOCK = Symbol("ZERO_ARG_BLOCK");
export type ZERO_ARG_BLOCK = typeof ZERO_ARG_BLOCK;

export interface InvokableZeroArgBlock {
  [ZERO_ARG_BLOCK]: () => Content;
}

export function isZeroArgBlock(
  value: unknown | Partial<InvokableZeroArgBlock>
): value is InvokableZeroArgBlock {
  return (
    isObject(value) &&
    (value as Partial<InvokableZeroArgBlock>)[ZERO_ARG_BLOCK] !== undefined
  );
}

export const INVOKABLE_BLOCK = Symbol("INVOKABLE_BLOCK");
export type INVOKABLE_BLOCK = typeof INVOKABLE_BLOCK;

export type Block<A extends Reactive<any>[] = Reactive<any>[]> = (
  args: A
) => Content;

export interface InvokableBlock<A extends Reactive<any>[] = Reactive<any>[]>
  extends Block<A> {
  [INVOKABLE_BLOCK]: (args: A) => Content;

  /** @deprecated */
  invoke: (args: A) => Content;
}

export function isInvokableBlock(
  value: unknown | Partial<Block>
): value is InvokableBlock {
  return (
    isObject(value) &&
    (value as Partial<InvokableBlock>)[INVOKABLE_BLOCK] !== undefined
  );
}
