import { assert } from "../../assertions";
import { Effect } from "../../glimmer/cache";
import { IntoReactive, Reactive } from "../../reactive/cell";
import {
  Content,
  DynamicContent,
  StaticContent,
  StaticTemplateContent,
  UpdatableContent,
} from "../content";

// export type Block<Args extends ReactiveArgs> = (...args: Args) => Content;

export interface BlockInfo<T = any> {
  arg: Reactive<T>;
  callback: (arg: Reactive<T>) => Content;
  content: Content;
}

export type Block<T> = (arg: IntoReactive<T>) => Content;

export function block<T>(
  callback: (arg: Reactive<T>) => Content
): (arg: IntoReactive<T>) => Content {
  let b = new BlockImpl(callback);
  return (arg: IntoReactive<T>) => b.invoke(Reactive.from(arg));
}

export class BlockImpl<T> {
  #callback: (arg: Reactive<T>) => Content;

  constructor(callback: (arg: Reactive<T>) => Content) {
    this.#callback = callback;
  }

  invoke(arg: Reactive<T>): Content {
    let reactive = Reactive.from(arg);
    let content = this.#callback(reactive);

    if (content.isStatic) {
      return StaticContent.of(
        "block",
        {
          arg: reactive,
          callback: this.#callback,
          content,
        },
        (cursor, dom) => (content as StaticTemplateContent).render(cursor, dom)
      );
    } else {
      return dynamicBlock({ reactive, callback: this.#callback, content });
    }
  }
}

function dynamicBlock<T>({
  reactive,
  callback,
  content,
}: {
  reactive: Reactive<T>;
  callback: (arg: Reactive<T>) => Content;
  content: Content;
}) {
  return DynamicContent.of(
    "block",
    {
      arg: reactive,
      callback: callback,
      content,
    },
    (cursor, dom) => {
      const rendered = content.render(cursor, dom);

      assert(
        Effect.is(rendered),
        `Since the input value is dynamic, the output value is dynamic`
      );

      return UpdatableContent.of(rendered.bounds, () => {
        rendered.poll();
      });
    }
  );
}

// export function Block<Args extends ReactiveArgs>(
//   callback: (...args: Args) => Content
// ): (...args: IntoReactiveArgs<Args>) => Content {
//   return (...args: IntoReactiveArgs<Args>): Content => {
//     let a = (ReactiveArgs.from(...args) as any) as Args;

//     return callback(...a);
//   };
// }
