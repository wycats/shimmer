import type { Block, Reactive, StaticValue } from "@shimmer/reactive";
import type { Owner, Services } from "../owner";
import type { Args, Component, ComponentArgs } from "../types";
import type { Content } from "./content";

export type ReactiveArg =
  | Reactive<any>
  | StaticValue<any>
  | Content
  | Block<any>
  | undefined;

export type ReactiveArgs = readonly ReactiveArg[];

export type ComponentCallback<A extends Args, O extends Owner> = (
  owner: O
) => (args: A) => Content;

export function createComponent<A extends ComponentArgs<Services>>(
  definition: Component<A>
): Component<A> {
  return definition;
}
