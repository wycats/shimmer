import { assert } from "../../src/assertions";

export type ChangeCallback = (url: string) => void;

export interface UrlBar {
  onChange(callback: ChangeCallback): () => void;

  // the current logical URL for the URL bar
  currentLogicalURL(): string;

  // convert the literal URL (from an `href` attribute) to the logical URL used by the application.
  normalizeConcreteHref(href: string): string;

  // convert the logical URL used by the application to the literal URL (e.g. used in an `href`
  // attribute)
  normalizeLogicalUrl(url: string): string;
}

export interface InitializedUrlBar {
  url: string;
  bar: UrlBar;
}

export class HashUrl implements UrlBar {
  static browser(): InitializedUrlBar {
    return HashUrl.of(window);
  }

  static of(window: Window): InitializedUrlBar {
    let url = window.location.hash.slice(1);
    let hash = new HashUrl(() => location);

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

  #location: () => Location;

  constructor(location: () => Location) {
    this.#location = location;
  }

  currentLogicalURL(): string {
    return this.#location().hash.slice(1);
  }

  normalizeConcreteHref(href: string): string {
    assert(
      href[0] === "#",
      `the URL passed to HashUrl#normalizeHref must begin with a '#' character`
    );

    return href.slice(1);
  }

  normalizeLogicalUrl(url: string): string {
    assert(
      url[0] !== "#",
      `the URL passed to HashUrl#normalizeLogicalUrl must not begin with a '#' character`
    );

    return `#${url}`;
  }

  onChange(callback: (url: string) => void): () => void {
    this.#onChanges.add(callback);

    return () => this.#onChanges.delete(callback);
  }
}
