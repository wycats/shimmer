import { Effect, getValue } from "@shimmer/reactive";
import type { RenderedContent } from "../nodes";

export class DynamicRenderedContent extends Effect<RenderedContent> {
  static create(options: {
    initialize: () => RenderedContent;
    update: (last: RenderedContent) => RenderedContent;
    destructor?: (last: RenderedContent) => void;
  }): DynamicRenderedContent {
    let { cache, destructor } = Effect.cache(options);

    return new DynamicRenderedContent(cache, destructor, getValue(cache));
  }
}
