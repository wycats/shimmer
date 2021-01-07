import {
  associateDestroyableChild,
  registerDestructor,
} from "@glimmer/destroyable";
import { Cache, createCache } from "@glimmer/validator";
import { Bounds } from "../dom/bounds";
import { Cursor } from "../dom/cursor";
import { SimplestDocument } from "../dom/simplest";
import { Effect } from "../glimmer/cache";
import { Render } from "../glimmer/glimmer";
import { Content, RenderedContent } from "./content";

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

  constructor(readonly content: Bounds | Effect<RenderedContent>) {
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
