import type { Bounds } from "../../dom/bounds";
import type { Cursor } from "../../dom/cursor";
import type { SimplestDocument } from "../../dom/simplest";
import { Effect } from "../../glimmer/cache";
import { isObject } from "../../utils/predicates";
import {
  Content,
  DynamicContent,
  StableContentResult,
  StaticContent,
  StaticTemplateContent,
  UpdatableDynamicContent,
} from "../content";
import type { Args } from "../dsl/utils";

export interface BlockInfo<A extends Args = any> {
  args: A;
  callback: (args: A) => Content;
  content: Content;
}

interface BlockState {
  content: StableContentResult;
}

export class Block<A extends Args = any> {
  static is(value: unknown): value is Block<Args> {
    return isObject(value) && value instanceof Block;
  }

  static of<A extends Args>(callback: (args: A) => Content): Block<A> {
    return new Block(callback);
  }

  #callback: (args: A) => Content;

  constructor(callback: (args: A) => Content) {
    this.#callback = callback;
  }

  invoke(args: A): Content {
    let content = this.#callback(args);

    let info = {
      args,
      callback: this.#callback,
      content,
    };

    if (info.content.isStatic) {
      return StaticContent.of(
        "block",
        {
          args,
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

    // TODO: we shouldn't get here if state.content is not an effect
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
