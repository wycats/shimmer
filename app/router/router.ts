import { destroy, registerDestructor } from "@glimmer/destroyable";
import type { SimplestDocument } from "../../src/dom/simplest";
import {
  App,
  Cell,
  Cursor,
  Doc,
  GLIMMER,
  Owner,
  Render,
  RouterService,
} from "../../src/index";
import {
  HashUrl,
  InitializedUrlBar,
  QueryParams,
  UrlBar,
  UrlDetails,
} from "./url-bar";

export type Routes = (owner: Owner) => RoutesWithOwner;
export type RoutesWithOwner = (
  url: { path: string; params: QueryParams },
  cursor: Cursor
) => Promise<App>;

export interface Environment {
  doc: SimplestDocument;
  bar: UrlBar;
}

export class Router implements RouterService {
  static startForBrowser(routes: Routes): Router {
    return Router.start(HashUrl.browser(), document, routes);
  }

  static start(
    { url, bar }: InitializedUrlBar,
    doc: SimplestDocument,
    routes: Routes
  ): Router {
    let router = new Router(
      routes,
      { doc, bar },
      Cursor.appending(document.body)
    );

    let destructor = bar.onChange((url) => {
      console.log("bar changed", url);
      router.route(url);
    });

    registerDestructor(router, destructor);

    router.route(url);

    return router;
  }

  #page: App | Loading | null = null;
  #bar: UrlBar;
  #router: RoutesWithOwner;
  #cursor: Cursor;
  #url: Cell<UrlDetails | null> = Cell.of(null);
  #owner: Owner;

  constructor(router: Routes, env: Environment, cursor: Cursor) {
    this.#owner = new Owner({ router: this, doc: Doc.of(env.doc) });
    this.#router = router(this.#owner);
    this.#bar = env.bar;
    this.#cursor = cursor;
  }

  async route(url: UrlDetails): Promise<void> {
    console.log("routing to", url);

    this.#set(new Loading(url));
    this.#set(await this.#router(url, this.#cursor));
    this.#url.update(() => url);
  }

  get url(): string | null {
    if (this.#url.now) {
      return this.#url.now.path;
    } else {
      return null;
    }
  }

  /**
   * Converts a URL that appears in the literal URL bar into a logical application-relative absolute
   * URL (that begins with a `/`)
   */
  normalizeHref(href: string): string {
    return this.#bar.normalizeConcreteHref(href);
  }

  isActive(logicalURL: string): boolean {
    return this.#bar.currentLogicalPath() === logicalURL;
  }

  #remove = (): void => {
    if (this.#page) {
      this.#page.clear();
      destroy(this.#page);
      GLIMMER.removeRenderable(this.#page);
      this.#page = null;
    }
  };

  #set = (page: App | Loading): void => {
    this.#remove();

    GLIMMER.addRenderable(page);
    this.#page = page;
  };
}

class Loading implements Render {
  #details: UrlDetails;

  constructor(url: UrlDetails) {
    this.#details = url;
  }
  readonly render = null;

  clear(): Cursor {
    return Cursor.appending(document.body);
  }
}
