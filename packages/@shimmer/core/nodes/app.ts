import { registerDestructor } from "@glimmer/destroyable";
import type { Cursor, SimplestDocument } from "@shimmer/dom";
import { createCache, TrackedCache } from "@shimmer/reactive";
import type { Render } from "../glimmer";
import type { DocService } from "../owner";
import { Content, StableContentResult, StableDynamicContent } from "./content";

export class Doc implements DocService {
  static of(dom: SimplestDocument): Doc {
    return new Doc(dom);
  }

  constructor(readonly dom: SimplestDocument) {}

  render(content: Content, cursor: Cursor): App {
    return new App(content.render(cursor, this.dom));
  }
}

export class App implements Render {
  readonly render: TrackedCache<void> | null;

  #content: StableContentResult | null;

  constructor(readonly content: StableContentResult) {
    this.#content = content;

    registerDestructor(this, () => this.clear());

    if (content instanceof StableDynamicContent) {
      this.render = createCache(() => {
        content.poll();
      });
    } else {
      this.render = null;
    }
  }

  clear(): void {
    if (this.#content) {
      this.#content.bounds.clear();
      this.#content = null;
    }
  }
}
