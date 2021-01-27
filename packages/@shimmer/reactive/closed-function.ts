import { isStaticReactive } from "./brands";
import { computed } from "./cache";
import { inClosedFunction, Reactive } from "./cell";
import { mapRecord } from "./utils";

type ArgsRecord<T extends unknown> = Record<string, Reactive<T>>;

type ArgsFor<A extends ArgsRecord<any>> = {
  [P in keyof A]: A[P] extends Reactive<infer T> ? T : never;
};

function isStaticArgs<A extends ArgsRecord<any>>(args: A): boolean {
  return Object.values(args).every(isStaticReactive);
}

export type ClosedFunction<A extends ArgsRecord<any>, T> = (
  args: A
) => Reactive<T>;

export const ClosedFunction = {
  of: <A extends ArgsRecord<any>, T>(
    callback: (args: ArgsFor<A>) => T
  ): ClosedFunction<A, T> => {
    return (args: A) => {
      function get() {
        let argsNow = mapRecord(args, (v) => v.now) as ArgsFor<A>;
        return inClosedFunction(() => callback(argsNow));
      }

      if (isStaticArgs(args)) {
        return Reactive.static(get());
      } else {
        return computed(get);
      }
    };
  },
};
