import { registerDestructor } from "@glimmer/destroyable";
import type { Cursor, SimplestDocument } from "@shimmer/dom";
import { createCache, TrackedCache } from "@shimmer/reactive";
import type { Renderable } from "../glimmer";
import type { DocService, Realm } from "../realm";
import {
  Content,
  ContentContext,
  StableContentResult,
  StableDynamicContent,
} from "./content";

export class Doc implements DocService {
  static of(dom: SimplestDocument): Doc {
    return new Doc(dom);
  }

  constructor(readonly dom: SimplestDocument) {}
}

export class RealmResult implements Renderable {
  static render<T>(
    content: Content,
    cursor: Cursor
  ): (realm: Realm) => RealmResult {
    return (realm) => {
      let rendered = content.render(ContentContext.of(cursor, realm));
      return new RealmResult(rendered);
    };
  }

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
