import { registerDestructor } from "@glimmer/destroyable";
import { Cache, createCache } from "@glimmer/validator";
import { Bounds } from "../dom/bounds";
import type { Cursor } from "../dom/cursor";
import type { SimplestDocument } from "../dom/simplest";
import type { Render } from "../glimmer/glimmer";
import type { Content, StableContentResult } from "./content";

export class Doc {
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

  #bounds: Bounds | Cursor;

  constructor(readonly content: StableContentResult) {
    this.#bounds = content.bounds;

    registerDestructor(this, () => this.clear());

    if (Bounds.is(content)) {
      this.render = null;
    } else {
      this.render = createCache(() => {
        content.poll();
      });
    }
  }

  clear(): Cursor {
    if (Bounds.is(this.#bounds)) {
      let bounds = this.#bounds;
      let cursor = bounds.clear();
      this.#bounds = cursor;
      return cursor;
    } else {
      return this.#bounds;
    }
  }
}
