import {
  associateDestroyableChild,
  registerDestructor,
} from "@glimmer/destroyable";
import { Cache, createCache } from "@glimmer/validator";
import { Bounds } from "../dom/bounds";
import type { Cursor } from "../dom/cursor";
import type { SimplestDocument } from "../dom/simplest";
import type { Render } from "../glimmer/glimmer";
import type { Content, ContentResult } from "./content";

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

  constructor(readonly content: ContentResult) {
    if (Bounds.is(content)) {
      this.render = null;

      registerDestructor(this, () => {
        content.clear();
      });
    } else {
      this.render = createCache(() => {
        content.poll();
      });

      associateDestroyableChild(this, content);
    }
  }
}
