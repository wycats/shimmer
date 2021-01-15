import type { Owner } from "../owner";
import { build, Reactive, Static } from "../reactive/cell";
import {
  Dict,
  IntoReactiveObject,
  ReactiveObject,
  ReactiveObjectSpec,
  ReactiveProxy,
  ReactiveRecord,
} from "../reactive/collection";
import { isObjectLiteral } from "../utils/predicates";
import { Content } from "./content";
import { Block } from "./structure/block";

export type ReactiveArg =
  | Reactive<any>
  | Static<any>
  | Dict<any>
  | Content
  | Block<any>
  | undefined;

export type ReactiveArgs = readonly ReactiveArg[];

export type IntoReactiveRecord<T extends ReactiveObjectSpec> =
  | ReactiveRecord<T>
  | IntoReactiveObject<T>;

export type IntoReactiveArg<Arg extends ReactiveArg> = Arg extends Reactive<
  infer T
>
  ? Reactive<T> | Static<T> | T
  : Arg extends Static<infer T>
  ? T | Static<T>
  : Arg extends Dict<infer O>
  ? IntoReactiveRecord<O>
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
    if (ReactiveRecord.is(arg)) {
      return ReactiveProxy(arg) as Arg;
    } else if (
      Content.is(arg) ||
      Block.is(arg) ||
      Static.is(arg) ||
      arg === undefined
    ) {
      console.log("passthru", arg);
      return arg;
    } else if (isObjectLiteral(arg)) {
      return ReactiveProxy(
        ReactiveRecord.of(
          (arg as unknown) as ReactiveObject<ReactiveObjectSpec>
        )
      ) as Arg;
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

export type Component<Args extends ReactiveArgs, O extends Owner> = (
  owner: O
) => (...args: Args) => Content;

export function component<Args extends ReactiveArgs, O extends Owner>(
  definition: Component<Args, O>
): (owner: O) => (...args: IntoReactiveArgs<Args>) => Content {
  return (owner: O) => (...args: IntoReactiveArgs<Args>): Content => {
    return build(() => {
      let a = ReactiveArgs.from<Args>(...args);
      console.log("args", args, a);
      return definition(owner)(...a);
    });
  };
}
