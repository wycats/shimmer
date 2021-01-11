import { build, IntoReactive, Reactive } from "../reactive/cell";
import {
  Dict,
  IntoReactiveObject,
  ReactiveObject,
  ReactiveObjectSpec,
  ReactiveProxy,
  ReactiveRecord,
} from "../reactive/collection";
import { isObjectLiteral } from "../utils/predicates";
import type { Content } from "./content";

export type ReactiveArg = Reactive<any> | Dict<any>;

export type ReactiveArgs = readonly ReactiveArg[];

export type IntoReactiveRecord<T extends ReactiveObjectSpec> =
  | ReactiveRecord<T>
  | IntoReactiveObject<T>;

export type IntoReactiveArgs<Args extends ReactiveArgs> = {
  [P in keyof Args]: Args[P] extends Reactive<infer T>
    ? IntoReactive<T>
    : Args[P] extends Dict<infer O>
    ? IntoReactiveRecord<O>
    : never;
};

export const ReactiveArgs = {
  from: <Args extends ReactiveArgs>(...args: IntoReactiveArgs<Args>): Args => {
    return (args.map((a) => {
      if (ReactiveRecord.is(a)) {
        return ReactiveProxy(a);
      } else if (isObjectLiteral(a)) {
        return ReactiveProxy(
          ReactiveRecord.of(
            (a as unknown) as ReactiveObject<ReactiveObjectSpec>
          )
        );
      } else {
        return Reactive.from(a);
      }
    }) as unknown) as Args;
  },
};

export type Component<Args extends ReactiveArgs> = (...args: Args) => Content;

export function component<Args extends ReactiveArgs>(
  definition: Component<Args>
): (...args: IntoReactiveArgs<Args>) => Content {
  return (...args: IntoReactiveArgs<Args>): Content => {
    return build(() => {
      let a = ReactiveArgs.from<Args>(...args);
      return definition(...a);
    });
  };
}
