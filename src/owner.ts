export interface Services {
  [key: string]: unknown;
  router: RouterService;
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
