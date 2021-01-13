import { AbstractBounds, Bounds } from "../dom/bounds";
import type { Cursor } from "../dom/cursor";
import type { SimplestDocument, SimplestNode } from "../dom/simplest";
import type { DynamicRenderedContent } from "../glimmer/cache";
import { isObject } from "../utils/predicates";
import type { CommentInfo } from "./comment";
import type { ElementInfo } from "./element/element";
import type { FragmentInfo } from "./fragment";
import type { BlockInfo } from "./structure/block";
import type { EachInfo } from "./structure/each";
import type { TextInfo } from "./text";

export type ContentType =
  | "text"
  | "comment"
  | "fragment"
  | "choice"
  | "each"
  | "element"
  | "block";

export interface StaticContent<
  Type extends ContentType = ContentType,
  Info = unknown
> {
  readonly type: ContentType;
  readonly info: Info;

  render(cursor: Cursor, dom: SimplestDocument): Bounds;
}

export const StaticContent = {
  of: <Type extends ContentType, Info>(
    type: Type,
    info: Info,
    render: (cursor: Cursor, dom: SimplestDocument) => Bounds
  ): StaticTemplateContent<Type, Info> => {
    return new StaticTemplateContent({
      type,
      info,
      render,
    });
  },
};

export abstract class AbstractTemplateContent<Type extends ContentType, Info> {
  readonly type: Type;
  readonly info: Info;

  abstract readonly isStatic: boolean;

  constructor(
    readonly content: {
      type: Type;
      info: Info;
      render: StableRenderFunction;
    }
  ) {
    this.type = content.type;
    this.info = content.info;
  }

  abstract render(cursor: Cursor, dom: SimplestDocument): StableContentResult;
}

export class StaticTemplateContent<
  Type extends ContentType = ContentType,
  Info = unknown
> extends AbstractTemplateContent<Type, Info> {
  readonly isStatic = true;

  declare readonly content: {
    type: Type;
    info: Info;
    render: StaticRenderFunction;
  };

  render(cursor: Cursor, dom: SimplestDocument): Bounds {
    return this.content.render(cursor, dom);
  }
}

export type StableContentResult = Bounds | StableDynamicContent;
export type ContentResult = Bounds | DynamicRenderedContent;

export function firstNode(result: ContentResult): SimplestNode {
  if (Bounds.is(result)) {
    return result.firstNode;
  } else {
    return result.bounds.firstNode;
  }
}

export function lastNode(result: ContentResult): SimplestNode {
  if (Bounds.is(result)) {
    return result.lastNode;
  } else {
    return result.poll().bounds.lastNode;
  }
}

export function renderBounds(result: Bounds | ContentResult): Bounds {
  if (Bounds.is(result)) {
    return result;
  } else {
    return result.bounds;
  }
}

export interface DynamicContentHooks<State> {
  isValid(state: State): boolean;
  poll(state: State): void;
  render(
    cursor: Cursor,
    dom: SimplestDocument
  ): { bounds: Bounds; state: State };
}

export abstract class UpdatableDynamicContent<State = unknown>
  implements DynamicContentHooks<State> {
  static of<State>(hooks: DynamicContentHooks<State>): UpdatableDynamicContent {
    if (UpdatableDynamicContent.is(hooks)) {
      return hooks;
    } else {
      return new ConcreteUpdatableDynamicContent(hooks);
    }
  }

  static is(value: unknown): value is UpdatableDynamicContent {
    return isObject(value) && value instanceof UpdatableDynamicContent;
  }

  abstract isValid(state: State): boolean;
  abstract poll(state: State): void;
  abstract render(
    cursor: Cursor,
    dom: SimplestDocument
  ): { bounds: Bounds; state: State };
}

export class ConcreteUpdatableDynamicContent<
  State
> extends UpdatableDynamicContent<State> {
  #hooks: DynamicContentHooks<State>;

  constructor(hooks: DynamicContentHooks<State>) {
    super();
    this.#hooks = hooks;
  }

  isValid(state: State): boolean {
    return this.#hooks.isValid(state);
  }

  poll(state: State): void {
    return this.#hooks.poll(state);
  }

  render(
    cursor: Cursor,
    dom: SimplestDocument
  ): { bounds: Bounds; state: State } {
    return this.#hooks.render(cursor, dom);
  }
}

export type StableRenderFunction = (
  cursor: Cursor,
  dom: SimplestDocument
) => StableContentResult;

export type StaticRenderFunction = (
  cursor: Cursor,
  dom: SimplestDocument
) => Bounds;

export class StableDynamicContent<State = unknown> {
  static of<State>(hooks: DynamicContentHooks<State>): StableRenderFunction {
    return (cursor, dom) => {
      let first = hooks.render(cursor, dom);
      return new StableDynamicContent(hooks, first, dom);
    };
  }

  readonly #hooks: UpdatableDynamicContent<State>;
  #last: { bounds: Bounds; state: State };
  #dom: SimplestDocument;

  constructor(
    hooks: UpdatableDynamicContent<State>,
    first: { bounds: Bounds; state: State },
    dom: SimplestDocument
  ) {
    this.#hooks = hooks;
    this.#last = first;
    this.#dom = dom;
  }

  get bounds(): Bounds {
    return this.#last.bounds;
  }

  poll(): void {
    if (this.#hooks.isValid(this.#last.state)) {
      this.#hooks.poll(this.#last.state);
      return;
    }

    let cursor = this.#last.bounds.clear();
    this.#last = this.#hooks.render(cursor, this.#dom);
  }
}

export class DynamicContent<
  Type extends ContentType = ContentType,
  Info = unknown
> extends AbstractTemplateContent<Type, Info> {
  static of<Type extends ContentType, Info, State>(
    type: Type,
    info: Info,
    render: DynamicContentHooks<State>
  ): DynamicContent<Type, Info> {
    return new DynamicContent({
      type,
      info,
      render: StableDynamicContent.of(render),
    });
  }

  readonly isStatic = false;

  declare readonly content: {
    type: Type;
    info: Info;
    render: StableRenderFunction;
  };

  render(cursor: Cursor, dom: SimplestDocument): StableContentResult {
    return this.content.render(cursor, dom);
  }
}

export type TemplateContent<Type extends ContentType, Info = unknown> =
  | StaticTemplateContent<Type, Info>
  | DynamicContent<Type, Info>;

export type Content =
  | TemplateContent<"text", TextInfo>
  | TemplateContent<"comment", CommentInfo>
  | TemplateContent<"fragment", FragmentInfo>
  | TemplateContent<"choice", any>
  | TemplateContent<"each", EachInfo>
  | TemplateContent<"element", ElementInfo>
  | TemplateContent<"block", BlockInfo>;

export class RenderedContent extends AbstractBounds {
  #inner: DynamicRenderedContent;

  constructor(content: DynamicRenderedContent) {
    super(content.bounds.parent);
    this.#inner = content;
  }

  get bounds(): Bounds {
    return this.#inner.bounds;
  }

  get firstNode(): SimplestNode {
    return this.#inner.bounds.firstNode;
  }

  get lastNode(): SimplestNode {
    return this.#inner.bounds.lastNode;
  }

  update(): this {
    let newContent = this.#inner.poll();

    if (newContent) {
      this.#inner = newContent.#inner;
    }

    return this;
  }
}
