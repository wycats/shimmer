import { isReactive } from "../../brands";
import { Reactive, StaticReactive, StaticValue } from "../../reactive/cell";
import { Content } from "../content";
import { createText } from "../text";

export type IntoReactive<T> = Reactive<T> | T;

export function intoReactive<T>(into: IntoReactive<T>): Reactive<T> {
  if (isReactive(into)) {
    return into;
  } else {
    return Reactive.static(into) as StaticReactive<T>;
  }
}

export type IntoContent = Content | string;

export function intoContent(into: IntoContent): Content {
  if (Content.is(into)) {
    return into;
  } else {
    return createText(Reactive.static(into));
  }
}

export type ComponentArgs = Record<
  string,
  Reactive<unknown> | StaticValue<unknown>
>;

// type IntoComponentArg<>

export type IntoComponentArgs<
  A extends ComponentArgs | undefined
> = A extends ComponentArgs
  ? {
      [P in keyof A]: A[P] extends Reactive<infer T> ? IntoReactive<T> : never;
    }
  : {};

export function intoComponentArgs<A extends ComponentArgs>(
  args: IntoComponentArgs<A> | undefined
): A | undefined {
  if (args === undefined) {
    return args;
  }

  let out: ComponentArgs = {};

  for (let [key, value] of Object.entries(args)) {
    out[key] = intoReactive(value);
  }

  return out as A;
}

// export type Dict<A extends object> = {
//   [P in keyof A]: A[P] extends IntoArg<infer I> ? I : never;
// } & {
//   [IS_DICT]: true;
// };

// export function dict<T extends object>(value: IntoDictObject<T>): Dict<T> {
//   return (new Proxy(
//     { into: value as any },
//     {
//       get({ into }, prop: any) {
//         if (prop === IS_DICT) {
//           return true;
//         }

//         let inner = into[prop] as IntoArg<unknown>;
//         return intoInnerArg(inner);
//       },
//     }
//   ) as unknown) as Dict<T>;
// }

// type IntoDictObject<A> = {
//   [P in keyof A]: IntoArg<A[P]>;
// };

// export function intoInnerArg<T>(
//   into: undefined | StaticValue<T> | Reactive<T> | T
// ): Arg<T> {
//   if (isReactive(into) || isStaticValue(into) || isContent(into)) {
//     return into as Arg<T>;
//   } else if (isObjectLiteral(into)) {
//     return dict(into) as Arg<T>;
//   } else {
//     return StaticReactive.of(into) as Arg<T>;
//   }
// }

// export function intoComponentArg<A extends Arg<any>>(into: IntoArg<A>): A {
//   if (isReactive(into)) {
//     return into as A;
//   } else if (isObjectLiteral(into)) {
//     return dict(into) as A;
//   } else {
//     return StaticReactive.of(into) as A;
//   }
// }

export type Args = readonly Reactive<any>[];
export type IntoArgs<A extends Args> = {
  [P in keyof A]: A[P] extends Reactive<infer T> ? IntoReactive<T> : never;
};

export function intoArgs<A extends Args>(into: IntoArgs<A>): A {
  return (into.map((arg) => intoReactive(arg)) as unknown) as A;
}
