import type { Cursor } from "./dom/cursor";
import type { SimplestDocument } from "./dom/simplest";
import type { App } from "./nodes/app";
import type { Content } from "./nodes/content";

export interface Services {
  [key: string]: unknown;
  router: RouterService;
  doc: DocService;
}

export class Owner<S extends Services = Services> {
  #services: S;

  constructor(services: S) {
    this.#services = services;
  }

  service<K extends keyof S>(key: K): S[K] {
    return this.#services[key];
  }
}

export interface RouterService {
  readonly url: string | null;
  normalizeHref(href: string): string;
  isActive(url: string): boolean;
}

export interface DocService {
  dom: SimplestDocument;
  render(content: Content, cursor: Cursor): App;
}
