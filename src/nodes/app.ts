import { registerDestructor } from "@glimmer/destroyable";
import { Cache, createCache } from "@glimmer/validator";
import type { Cursor } from "../dom/cursor";
import type { SimplestDocument } from "../dom/simplest";
import type { Render } from "../glimmer/glimmer";
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
  readonly render: Cache<void> | null;

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
