import type { Bounds } from "../../dom/bounds";
import type { Cursor } from "../../dom/cursor";
import type { SimplestDocument } from "../../dom/simplest";
import { Effect } from "../../glimmer/cache";
import { IntoReactive, Reactive } from "../../reactive/cell";
import {
  Content,
  DynamicContent,
  StableContentResult,
  StaticContent,
  StaticTemplateContent,
  UpdatableDynamicContent,
} from "../content";

// export type Block<Args extends ReactiveArgs> = (...args: Args) => Content;

export interface BlockInfo<T = any> {
  arg: Reactive<T>;
  callback: (arg: Reactive<T>) => Content;
  content: Content;
}

interface BlockState {
  content: StableContentResult;
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

    let info = {
      arg: reactive,
      callback: this.#callback,
      content,
    };

    if (info.content.isStatic) {
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
      return DynamicContent.of("block", info, new UpdatableBlock(info));
    }
  }
}

class UpdatableBlock extends UpdatableDynamicContent<BlockState> {
  #data: BlockInfo;

  constructor(data: BlockInfo) {
    super();
    this.#data = data;
  }

  isValid(): boolean {
    return true;
  }

  poll(state: BlockState): void {
    if (Effect.is(state.content)) {
      state.content.poll();
    }

    // TODO: we shouldn't get here is state.content is not an effect
  }

  render(
    cursor: Cursor,
    dom: SimplestDocument
  ): { bounds: Bounds; state: BlockState } {
    let rendered = this.#data.content.render(cursor, dom);

    return {
      bounds: rendered.bounds,
      state: { content: rendered },
    };
  }
}

// export function Block<Args extends ReactiveArgs>(
//   callback: (...args: Args) => Content
// ): (...args: IntoReactiveArgs<Args>) => Content {
//   return (...args: IntoReactiveArgs<Args>): Content => {
//     let a = (ReactiveArgs.from(...args) as any) as Args;

//     return callback(...a);
//   };
// }
