import type { Block, Reactive } from "@shimmer/reactive";
import type { Content, Modifier } from "./nodes";
import type { Owner, Services } from "./owner";

export const EFFECTS = Symbol("EFFECTS");
export type EFFECTS = typeof EFFECTS;

export type Args = Reactive<any>[];

declare const COMPONENT_ARGS: unique symbol;
export type COMPONENT_ARGS = typeof COMPONENT_ARGS;

export type Blocks = Record<string, Block>;

export type ComponentArgs<S extends Services = Services> = {
  args: Record<string, Reactive<unknown>>;
  modifiers: Modifier[];
  blocks: Record<string, Block>;
  $: Owner<S>;
};

export type Component<A extends ComponentArgs<Services>> = (args: A) => Content;

export type Modifiers = readonly Modifier[];
