import type { Cursor } from "./dom/cursor";
import type { SimplestDocument } from "./dom/simplest";
import type { App } from "./nodes/app";
import type { Content } from "./nodes/content";
import type {
  Component,
  ComponentData,
  IntoComponentDefinition,
  PresentComponentDefinition,
} from "./nodes/dsl/dsl";

export interface Services {
  [key: string]: unknown;
  router: RouterService;
  doc: DocService;
}

export interface Invoke<S extends Services = Services> {
  <D extends []>(component: Component<D, S>): Content;
  <D extends PresentComponentDefinition>(
    component: Component<D, S>,
    data: IntoComponentDefinition<D>
  ): Content;
  <D extends PresentComponentDefinition>(component: Component<D, S>): Content;

  service<K extends keyof S>(key: K): S[K];
}

export function ownerDSL<S extends Services>(owner: Owner<S>): Invoke<S> {
  function $<D extends []>(component: Component<D, S>): Content;
  function $<D extends PresentComponentDefinition>(
    component: Component<D, S>,
    data: IntoComponentDefinition<D>
  ): Content;
  function $<D extends PresentComponentDefinition>(
    component: Component<D, S>
  ): Content;
  function $(
    component: Component<ComponentData, S>,
    data?: IntoComponentDefinition<ComponentData>
  ): Content {
    return component(data as ComponentData, $) as Content;
  }

  $.service = <K extends keyof S>(key: K): S[K] => owner.service(key);

  return $;
}

export class Owner<S extends Services = Services> {
  #services: S;

  constructor(services: S) {
    this.#services = services;
  }

  service<K extends keyof S>(key: K): S[K] {
    return this.#services[key];
  }

  $: Invoke<S> = ownerDSL(this);
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
