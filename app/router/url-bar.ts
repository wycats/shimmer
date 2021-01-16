import { assert } from "../../src/index";

export interface UrlDetails {
  path: string;
  params: QueryParams;
}

export type ChangeCallback = (url: UrlDetails) => void;

export type QueryParams = Record<string, string | string[]>;

/**
 * An application-relative URL is a URL that is relative to the application's root but begins with a
 * `/`.
 */

export interface UrlBar {
  onChange(callback: ChangeCallback): () => void;

  // the current logical URL for the URL bar
  currentLogicalPath(): string;

  currentQueryParams(): QueryParams;

  /**
   * Converts a URL that appears in the literal URL bar into a logical application-relative
   * URL (that begins with a `/`)
   */
  normalizeConcreteHref(href: string): string;

  // convert the logical application-relative URL used by the application to the literal URL (e.g. used in an `href`
  // attribute)
  normalizeLogicalUrl(url: string): string;
}

export interface InitializedUrlBar {
  url: UrlDetails;
  bar: UrlBar;
}

class InnerURL implements UrlDetails {
  static forHash(url: URL): InnerURL {
    return new InnerURL(url.hash.slice(1));
  }

  #hash: string;

  constructor(hash: string) {
    this.#hash = hash;
  }

  get path(): string {
    let url = new URL(this.#hash, "http://example.com");
    return url.pathname;
  }

  get params(): QueryParams {
    let params = new URL(this.#hash, "http://example.com").searchParams;

    let out: QueryParams = {};

    console.log("qps", [...params]);

    for (let [key, value] of params) {
      let current = out[key];

      if (current) {
        if (Array.isArray(current)) {
          out[key] = [...current, value];
        } else {
          out[key] = [current, value];
        }
      } else {
        out[key] = value;
      }
    }

    return out;
  }
}

export class HashUrl implements UrlBar {
  static browser(): InitializedUrlBar {
    return HashUrl.of(window);
  }

  static of(window: Window): InitializedUrlBar {
    let hash = new HashUrl(() => location);

    window.addEventListener("hashchange", (event) => {
      let url = new URL(event.newURL);
      console.log("new URL", url);

      hash.#didChange(hash.currentLogicalDetails(InnerURL.forHash(url)));
    });

    return { url: hash.currentLogicalDetails(), bar: hash };
  }

  #onChanges: Set<ChangeCallback> = new Set();

  #didChange = (url: UrlDetails): void => {
    for (let callback of this.#onChanges) {
      callback(url);
    }
  };

  #location: () => Location;

  #hashURL = (url: URL = new URL(this.#location().href)): InnerURL => {
    return InnerURL.forHash(url);
  };

  constructor(location: () => Location) {
    this.#location = location;
  }

  currentLogicalDetails(url = this.#hashURL()): UrlDetails {
    return {
      path: this.currentLogicalPath(url),
      params: this.currentQueryParams(url),
    };
  }

  currentQueryParams(url = this.#hashURL()): QueryParams {
    return url.params;
  }

  currentLogicalPath(url = this.#hashURL()): string {
    return url.path;
  }

  normalizeConcreteHref(href: string): string {
    assert(
      href[0] === "#",
      `the URL passed to HashUrl#normalizeHref must begin with a '#' character`
    );

    return this.#hashURL(new URL(href, "http://example.com")).path;
  }

  normalizeLogicalUrl(url: string): string {
    assert(
      url[0] !== "#",
      `the URL passed to HashUrl#normalizeLogicalUrl must not begin with a '#' character`
    );

    return `#${url}`;
  }

  onChange(callback: (url: UrlDetails) => void): () => void {
    this.#onChanges.add(callback);

    return () => this.#onChanges.delete(callback);
  }
}
