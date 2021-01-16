import type { Owner } from "../owner";
import { Reactive, Static } from "../reactive/cell";
import { Dict } from "../reactive/dict";
import { isObjectLiteral } from "../utils/predicates";
import { Content } from "./content";
import type { Args } from "./dsl/utils";
import { Block } from "./structure/block";

export type ReactiveArg =
  | Reactive<any>
  | Static<any>
  | Content
  | Block<any>
  | undefined;

export type ReactiveArgs = readonly ReactiveArg[];

export type IntoReactiveArg<Arg extends ReactiveArg> = Arg extends Dict<infer T>
  ? Dict<T> | T
  : Arg extends Reactive<infer T>
  ? Reactive<T> | Static<T> | T
  : Arg extends Static<infer T>
  ? T | Static<T>
  : Arg extends Reactive<undefined>
  ? void
  : Arg extends Block<infer T>
  ? Block<T>
  : Arg extends Content
  ? Arg
  : never;

export type IntoReactiveArgs<Args extends ReactiveArgs> = {
  [P in keyof Args]: Args[P] extends ReactiveArg
    ? IntoReactiveArg<Args[P]>
    : never;
};

export const ReactiveArg = {
  from: <Arg extends ReactiveArg>(arg: IntoReactiveArg<Arg>): Arg => {
    if (
      Content.is(arg) ||
      Block.is(arg) ||
      Reactive.is(arg) ||
      arg === undefined
    ) {
      return arg;
    } else if (isObjectLiteral(arg)) {
      return new Dict(arg) as Arg;
    } else {
      return new Static(arg) as Arg;
    }
  },
};

export const ReactiveArgs = {
  from: <Args extends ReactiveArgs>(...args: IntoReactiveArgs<Args>): Args => {
    return (args.map((a) => ReactiveArg.from(a)) as unknown) as Args;
  },
};

export type ComponentDefinition<A extends Args, O extends Owner> = (
  owner: O
) => (args: A) => Content;

export function createComponent<A extends Args, O extends Owner>(
  definition: ComponentDefinition<A, O>
): (owner: O) => (args: A) => Content {
  return definition;
}

// export function component<Args extends ReactiveArgs, O extends Owner>(
//   definition: Component<Args, O>
// ): (owner: O) => (...args: IntoReactiveArgs<Args>) => Content {
//   return (owner: O) => (...args: IntoReactiveArgs<Args>): Content => {
//     return build(() => {
//       let a = ReactiveArgs.from<Args>(...args);
//       console.log("args", args, a);
//       return definition(owner)(...a);
//     });
//   };
// }
