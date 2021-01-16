import type { Pure } from "../glimmer/cache";
import { isObject } from "../utils/predicates";
import type { Cell, StaticReactive } from "./cell";

interface DictParent {
  [key: string]: DictChild;
}

type DictChild =
  | Dict<DictParent>
  | Cell<unknown>
  | Pure<unknown>
  | StaticReactive<unknown>;

export class Dict<T> {
  static is(value: unknown): value is Dict<unknown> {
    return isObject(value) && value instanceof Dict;
  }

  static of<T>(value: T): Dict<T> {
    return new Dict(value);
  }

  constructor(readonly now: T) {}

  // get now(): T {
  //   throw new Error("unimplemented");
  // }

  get debug(): T {
    throw new Error("unimplemented");
  }
}

// export function intoDict<T>(into: IntoDict<T>): Dict<T> {
//   return {
//     now: (() => {
//       throw new Error("unimplemented");
//     })(),
//   };
// }
