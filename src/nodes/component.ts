import type { Owner } from "../owner";
import type { Reactive, StaticValue } from "../reactive/cell";
import type { Content } from "./content";
import type { Args } from "./dsl/utils";
import type { Block } from "./structure/block";

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
