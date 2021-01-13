import { registerDestructor } from "@glimmer/destroyable";
import { App, Cursor } from "../src/index";
import "./pages/patch-example.js";

type ChangeCallback = (url: string) => void;

interface UrlBar {
  // url(): string;
  // didChange(location: string): void;
  onChange(callback: ChangeCallback): () => void;
}

interface InitializedUrlBar {
  url: string;
  bar: UrlBar;
}

class HashUrl implements UrlBar {
  static browser(): InitializedUrlBar {
    return HashUrl.of(window);
  }

  static of(window: Window): InitializedUrlBar {
    let url = window.location.hash.slice(1);
    let hash = new HashUrl();

    window.addEventListener("hashchange", (event) => {
      let url = new URL(event.newURL);

      hash.#didChange(url.hash.slice(1));
    });

    return { url, bar: hash };
  }

  #onChanges: Set<ChangeCallback> = new Set();

  #didChange = (url: string): void => {
    for (let callback of this.#onChanges) {
      callback(url);
    }
  };

  onChange(callback: (url: string) => void): () => void {
    this.#onChanges.add(callback);

    return () => this.#onChanges.delete(callback);
  }
}

export type Routes = (location: string) => Promise<App>;

class Loading {
  #url: string;

  constructor(url: string) {
    this.#url = url;
  }

  clear(): Cursor {
    return Cursor.appending(document.body);
  }
}

class Router {
  static startForBrowser(routes: Routes): Router {
    return Router.start(HashUrl.browser(), routes);
  }

  static start({ url, bar }: InitializedUrlBar, routes: Routes): Router {
    let router = new Router(routes);

    let destructor = bar.onChange((url) => {
      router.route(url);
    });

    registerDestructor(router, destructor);

    router.route(url);

    return router;
  }

  #page: App | Loading | null = null;
  #router: Routes;

  constructor(router: Routes) {
    this.#router = router;
  }

  async route(url: string): Promise<void> {
    if (this.#page) {
      let cursor = this.#page.clear();
    }

    this.#page = new Loading(url);
    this.#page = await this.#router(url);
  }
}

async function route(): Promise<App> {
  switch (location.hash) {
    case "#index": {
      let page = await import("./pages/index.js");
      return page.Main.render();
    }
    case "#tutorial": {
      let page = await import("./pages/tutorial.js");
      return page.Main.render();
    }

    default:
      let page = await import("./pages/fallback.js");
      return page.Main.render();
  }
}

Router.startForBrowser(route);

export {};
