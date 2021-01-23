import { unwrap } from "@shimmer/dev-mode";
import type { Cursor, SimplestDocument } from "@shimmer/dom";
import type { App, Content } from "./nodes";
import type { Component, ComponentArgs } from "./types";

export interface Services {
  [key: string]: unknown;
  router: RouterService;
  doc: DocService;
}

export interface Invoke<S extends Services = Services> {
  (component: Component<ComponentArgs<S>>): Content;

  service<K extends keyof S>(key: K): S[K];
}

function invoke<S extends Services>(owner: Owner<S>): Invoke<S> {
  function $(
    component: Component<ComponentArgs<S>>,
    args: ComponentArgs<S>
  ): Content {
    return component(args);
  }

  $.service = <K extends keyof S>(key: K): S[K] => owner.service(key);

  return $ as Invoke<S>;
}

// export function ownerDSL<S extends Services>(owner: Owner<S>): Invoke<S> {
//   function $<D extends []>(component: Component<D, S>): Content;
//   function $<D extends PresentComponentDefinition>(
//     component: Component<D, S>,
//     data: IntoComponentDefinition<D>
//   ): Content;
//   function $<D extends PresentComponentDefinition>(
//     component: Component<D, S>
//   ): Content;
//   function $(
//     component: Component<ComponentData | [], S>,
//     data?: IntoComponentDefinition<ComponentData>
//   ): Content {
//     return component(data as ComponentData, $) as Content;
//   }

//   $.service = <K extends keyof S>(key: K): S[K] => owner.service(key);

//   return $;
// }

export class Owner<S extends Services = Services> {
  #services: S;

  constructor(services: S) {
    this.#services = services;
  }

  service<K extends keyof S>(key: K): S[K] {
    return this.#services[key];
  }

  render(cursor: Cursor, callback: () => Content): App {
    return withRealm(this, () =>
      this.service("doc").render(callback(), cursor)
    );
  }

  $: Invoke<S> = invoke(this);
}

let REALM: Owner | null = null;

export function withRealm<T>(realm: Owner, callback: () => T): T {
  let old = REALM;
  REALM = realm;

  try {
    return callback();
  } finally {
    REALM = old;
  }
}

export function getCurrentRealm(): Owner {
  return unwrap(REALM, `You can only get the realm while rendering`);
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
