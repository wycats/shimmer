import type { IntoReactive, Reactive, StaticValue } from "@shimmer/reactive";
import type { Block, Content, EffectModifier, Modifier } from "./nodes";
import type { Invoke, Services } from "./owner";

export const EFFECTS = Symbol("EFFECTS");
export type EFFECTS = typeof EFFECTS;

export type Args = readonly Reactive<any>[];

export type Component<C extends ComponentDefinition, S extends Services> = (
  args: IntoComponentDefinition<C>,
  $: Invoke<S>
) => Content;

export type ComponentDefinition = PresentComponentDefinition | [];

export type IntoComponentDefinition<
  D extends ComponentDefinition
> = D extends PresentComponentDefinition
  ? {
      args?: IntoComponentArgs<D["args"]>;
      attrs?: IntoModifiers;
      blocks?: IntoBlocksFor<D["blocks"]>;
    }
  : undefined;
export type Blocks = Record<string, Block>;

export interface PresentComponentDefinition {
  args?: ComponentArgs;
  attrs?: Modifiers;
  blocks?: Blocks;
}
export type IntoComponentArgs<
  A extends ComponentArgs | undefined
> = A extends ComponentArgs
  ? {
      [P in keyof A]: A[P] extends Reactive<infer T> ? IntoReactive<T> : never;
    }
  : {};
export type ComponentArgs = Record<
  string,
  Reactive<unknown> | StaticValue<unknown>
>;

export type Modifiers = readonly Modifier[];

export type IntoModifiers =
  | {
      [key: string]: IntoReactive<string | null>;
      [EFFECTS]?: EffectModifier<any>[];
    }
  | Modifiers;

export type IntoBlocksFor<B extends Blocks | undefined> = B extends Blocks
  ? {
      [P in keyof B]: B[P] extends Block<infer Args> ? IntoBlock<Args> : never;
    }
  : {};

export type IntoBlock<A extends Args> =
  | IntoBlockFunction<A>
  | Block<A>
  | IntoContent;

export type IntoContent = Content | string;

export type IntoBlockFunction<A extends Args> = A extends []
  ? () => IntoContent
  : (...args: A) => IntoContent;

export interface ComponentData extends PresentComponentDefinition {
  $: Invoke<Services>;
}
