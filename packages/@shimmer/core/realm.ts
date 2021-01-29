import type {
  Cursor,
  ElementCursor,
  EventService,
  SimplestDocument,
} from "@shimmer/dom";
import {
  Content,
  ContentContext,
  EffectContext,
  isContent,
  RealmResult,
} from "./nodes";
import type { Component, ComponentArgs } from "./types";

export interface Services {
  [key: string]: unknown;
  router: RouterService;
  doc: DocService;
  events: EventService<any>;
}

export interface Invoke<S extends Services = Services> {
  (component: Component<ComponentArgs<S>>): Content;

  service<K extends keyof S>(key: K): S[K];
}

function invoke<S extends Services>(owner: Realm<S>): Invoke<S> {
  function $(
    component: Component<ComponentArgs<S>>,
    args: ComponentArgs<S>
  ): Content {
    return component(args);
  }

  $.service = <K extends keyof S>(key: K): S[K] => owner.service(key);

  return $ as Invoke<S>;
}

export interface RenderDetails<T> {
  content: Content;
  details: T;
}

export type IntoRenderDetails<T> = T extends void
  ? RenderDetails<void> | Content
  : RenderDetails<T>;

function intoRenderDetails<T>(
  details: RenderDetails<T> | Content
): RenderDetails<T> {
  if (isContent(details)) {
    return { content: details, details: (undefined as unknown) as T };
  } else {
    return details as RenderDetails<T>;
  }
}

export class Realm<S extends Services = Services> {
  static of<S extends Services = Services>(services: S): Realm<S> {
    return new Realm(services);
  }

  #services: S;

  constructor(services: S) {
    this.#services = services;
  }

  get doc(): S["doc"] {
    return this.service("doc");
  }

  get events(): S["events"] {
    return this.service("events");
  }

  get router(): S["router"] {
    return this.service("router");
  }

  service<K extends keyof S>(key: K): S[K] {
    return this.#services[key];
  }

  contentContext(cursor: Cursor): ContentContext<S> {
    return ContentContext.of(cursor, this);
  }

  effectContext(cursor: ElementCursor): EffectContext {
    return EffectContext.of(cursor, this);
  }

  render<T>(
    cursor: Cursor,
    callback: () => RenderDetails<T> | Content
  ): { result: RealmResult; content: Content; details: T } {
    let details = intoRenderDetails(callback());
    let result = RealmResult.render(details.content, cursor)(this);
    return { ...details, result };
  }

  $: Invoke<S> = invoke(this);
}

export interface RouterService {
  readonly url: string | null;
  normalizeHref(href: string): string;
  isActive(url: string): boolean;
}

export interface DocService {
  dom: SimplestDocument;
}
