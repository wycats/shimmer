import { destroy, registerDestructor } from "@glimmer/destroyable";
import {
  App,
  Cell,
  Cursor,
  GLIMMER,
  Owner,
  Render,
  RouterService,
} from "../../src/index";
import { HashUrl, InitializedUrlBar, UrlBar } from "./url-bar";

export type Routes = (owner: Owner) => RoutesWithOwner;
export type RoutesWithOwner = (
  location: string,
  cursor: Cursor
) => Promise<App>;

export class Router implements RouterService {
  static startForBrowser(routes: Routes): Router {
    return Router.start(HashUrl.browser(), routes);
  }

  static start({ url, bar }: InitializedUrlBar, routes: Routes): Router {
    let router = new Router(routes, bar, Cursor.appending(document.body));

    let destructor = bar.onChange((url) => {
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
  #url: Cell<string | null> = Cell.of(null);
  #owner = new Owner({ router: this });

  constructor(router: Routes, bar: UrlBar, cursor: Cursor) {
    this.#router = router(this.#owner);
    this.#bar = bar;
    this.#cursor = cursor;
  }

  async route(url: string): Promise<void> {
    this.#set(new Loading(url));
    this.#set(await this.#router(url, this.#cursor));
    this.#url.update(() => url);
  }

  get url(): string | null {
    return this.#url.now;
  }

  normalizeHref(href: string): string {
    return this.#bar.normalizeConcreteHref(href);
  }

  isActive(logicalURL: string): boolean {
    return this.#bar.currentLogicalURL() === logicalURL;
  }

  #remove = () => {
    if (this.#page) {
      this.#page.clear();
      destroy(this.#page);
      GLIMMER.removeRenderable(this.#page);
      this.#page = null;
    }
  };

  #set = (page: App | Loading) => {
    this.#remove();

    GLIMMER.addRenderable(page);
    this.#page = page;
  };
}

class Loading implements Render {
  #url: string;

  constructor(url: string) {
    this.#url = url;
  }
  readonly render = null;

  clear(): Cursor {
    return Cursor.appending(document.body);
  }
}
