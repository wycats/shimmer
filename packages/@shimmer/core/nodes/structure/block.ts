import type { Bounds } from "@shimmer/dom";
import { Block, InvokableBlock, INVOKABLE_BLOCK } from "@shimmer/reactive";
import type { Args } from "../../types";
import {
  Content,
  ContentContext,
  DynamicContent,
  StableContentResult,
  StableDynamicContent,
  StaticContent,
  StaticTemplateContent,
  UpdatableDynamicContent,
} from "../content";

export interface BlockInfo<A extends Args = any> {
  args: A;
  callback: (args: A) => Content;
  content: Content;
}

interface BlockState {
  content: StableContentResult;
}

export function createBlock<A extends Args>(
  callback: (args: A) => Content
): (args: A) => Content {
  return callback;
}

export function BlockWithArgs<A extends Args>(
  callback: (args: A) => Content
): InvokableBlock<A> {
  const invoke: ((args: A) => Content) & Partial<InvokableBlock<A>> = (
    args: A
  ): Content => {
    let content = callback(args);

    let info = {
      args,
      callback: callback,
      content,
    };

    if (info.content.isStatic) {
      return StaticContent.of(
        "block",
        {
          args,
          callback,
          content,
        },
        (ctx) => (content as StaticTemplateContent).render(ctx)
      );
    } else {
      return DynamicContent.of("block", info, new UpdatableBlock(info));
    }
  };

  invoke[INVOKABLE_BLOCK] = invoke;
  invoke.invoke = invoke;

  return invoke as InvokableBlock<A>;
}

export function block<A extends Args>(callback: (args: A) => Content): Block<A>;
export function block<A extends Args>(callback: () => Content): Block<[]>;
export function block(callback: (args?: Args) => Content): Block<Args> {
  return BlockWithArgs<Args>(callback as (args: Args) => Content);
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
    if (StableDynamicContent.is(state.content)) {
      state.content.poll();
    }

    // TODO: we shouldn't get here if state.content is not an effect
  }

  render(ctx: ContentContext): { bounds: Bounds; state: BlockState } {
    let rendered = this.#data.content.render(ctx);

    return {
      bounds: rendered.bounds,
      state: { content: rendered },
    };
  }
}
