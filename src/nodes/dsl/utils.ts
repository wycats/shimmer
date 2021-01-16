import { Reactive, Static } from "../../reactive/cell";
import { Dict } from "../../reactive/dict";
import { isObjectLiteral } from "../../utils/predicates";
import { Content } from "../content";
import { createText } from "../text";

export type IntoReactive<T> = Reactive<T> | Static<T> | T;

export function intoReactive<T>(into: IntoReactive<T>): Reactive<T> {
  if (Static.is(into)) {
    return Reactive.static(into.now);
  } else if (Reactive.is(into)) {
    return into;
  } else {
    return Reactive.static(into);
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

export type Arg<T> = Reactive<T> | Static<T> | Content | undefined;
export type IntoArg<A extends Arg<unknown>> = A extends Content
  ? Content
  : A extends Static<infer T>
  ? Static<T> | T
  : A extends Arg<infer T>
  ? IntoReactive<T>
  : never;

export function intoArg<A extends Arg<unknown>>(into: IntoArg<A>): A {
  if (Reactive.is(into) || Static.is(into) || Content.is(into)) {
    return into as A;
  } else if (isObjectLiteral(into)) {
    return new Dict(into) as A;
  } else {
    return new Static(into) as A;
  }
}

export type Args = readonly Arg<any>[];
export type IntoArgs<A extends Args> = {
  [P in keyof A]: A[P] extends Arg<unknown> ? IntoArg<A[P]> : never;
};

export function intoArgs<A extends Args>(into: IntoArgs<A>): A {
  return (into.map(intoArg) as unknown) as A;
}
