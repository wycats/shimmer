import type { Reactive, StaticValue } from "@shimmer/reactive";
import type { Owner } from "../owner";
import type { Args } from "../types";
import type { Content } from "./content";
import type { Block } from "./structure";

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

export function createComponent<A extends Args, O extends Owner>(
  definition: ComponentCallback<A, O>
): (owner: O) => (args: A) => Content {
  return definition;
}
