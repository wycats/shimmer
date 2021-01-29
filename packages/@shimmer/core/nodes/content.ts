import {
  AbstractBounds,
  Bounds,
  Cursor,
  DynamicBounds,
  SimplestDocument,
  SimplestElement,
  SimplestNode,
  StaticBounds,
} from "@shimmer/dom";
import type { DynamicRenderedContent } from "../glimmer";
import type { Realm, Services } from "../realm";
import { isObject } from "../utils";
import type { CommentInfo } from "./comment";
import type { ElementInfo } from "./element";
import type { FragmentInfo } from "./fragment";
import type { BlockInfo, EachInfo } from "./structure";
import type { TextInfo } from "./text";

export const IS_CONTENT = Symbol("IS_CONTENT");
export type IS_CONTENT = typeof IS_CONTENT;

export function isContent(value: unknown): value is Content {
  return isObject(value) && IS_CONTENT in value;
}

export type ContentType =
  | "text"
  | "comment"
  | "fragment"
  | "choice"
  | "each"
  | "element"
  | "block";

export class ContentContext<S extends Services = Services> {
  static of<S extends Services>(
    cursor: Cursor,
    realm: Realm<S>
  ): ContentContext<S> {
    return new ContentContext(cursor, realm);
  }

  constructor(readonly cursor: Cursor, readonly realm: Realm<S>) {}

  get dom(): SimplestDocument {
    return this.realm.doc.dom;
  }

  withCursor(cursor: Cursor): ContentContext<S> {
    return new ContentContext(cursor, this.realm);
  }

  withAppendingCursor(element: SimplestElement): ContentContext<S> {
    return new ContentContext(Cursor.appending(element), this.realm);
  }
}

export interface StaticContent<
  Type extends ContentType = ContentType,
  Info = unknown
> {
  readonly type: ContentType;
  readonly info: Info;

  render(ctx: ContentContext): Bounds;
}

export const StaticContent = {
  of: <Type extends ContentType, Info>(
    type: Type,
    info: Info,
    render: (ctx: ContentContext) => Bounds
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

  abstract render(ctx: ContentContext): StableContentResult;
}

export class StaticTemplateContent<
  Type extends ContentType = ContentType,
  Info = unknown
> extends AbstractTemplateContent<Type, Info> {
  readonly isStatic = true;
  readonly [IS_CONTENT] = true;

  declare readonly content: {
    type: Type;
    info: Info;
    render: StaticRenderFunction;
  };

  render(ctx: ContentContext): Bounds {
    return this.content.render(ctx);
  }
}

export type StableContentResult = Bounds;
export type ContentResult =
  | StaticBounds
  | DynamicBounds
  | DynamicRenderedContent;

export interface DynamicContentHooks<State> {
  readonly shouldClear: boolean;

  isValid(state: State): boolean;
  poll(state: State, realm: Realm): void;
  render(
    ctx: ContentContext,
    state: State | null
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

  readonly shouldClear: boolean = true;

  abstract isValid(state: State): boolean;
  abstract poll(state: State, realm: Realm): void;
  abstract render(
    ctx: ContentContext,
    state: State | null
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

  poll(state: State, realm: Realm): void {
    return this.#hooks.poll(state, realm);
  }

  render(
    ctx: ContentContext,
    state: State | null
  ): { bounds: Bounds; state: State } {
    return this.#hooks.render(ctx, state);
  }
}

export type StableRenderFunction = (ctx: ContentContext) => StableContentResult;

export type StaticRenderFunction = (ctx: ContentContext) => Bounds;

export class StableDynamicContent<State = unknown> extends AbstractBounds {
  static is(value: unknown): value is StableDynamicContent {
    return isObject(value) && value instanceof StableDynamicContent;
  }

  static of<State>(
    hooks: DynamicContentHooks<State>,
    info: { type: ContentType; info: unknown }
  ): StableRenderFunction {
    return (ctx) => {
      let first = hooks.render(ctx, null);
      return new StableDynamicContent(hooks, first, info, ctx.realm);
    };
  }

  readonly #hooks: UpdatableDynamicContent<State>;
  #info: { type: ContentType; info: unknown };
  #last: { bounds: Bounds; state: State };
  #realm: Realm;

  constructor(
    hooks: UpdatableDynamicContent<State>,
    first: { bounds: Bounds; state: State },
    info: { type: ContentType; info: unknown },
    realm: Realm
  ) {
    super(first.bounds.parent);
    this.#hooks = hooks;
    this.#last = first;
    this.#info = info;
    this.#realm = realm;
  }

  readonly kind = "dynamic";

  get firstNode(): SimplestNode {
    return this.#last.bounds.firstNode;
  }

  get lastNode(): SimplestNode {
    return this.#last.bounds.lastNode;
  }

  get type(): ContentType {
    return this.#info.type;
  }

  get info(): unknown {
    return this.#info.info;
  }

  get bounds(): Bounds {
    return this.#last.bounds;
  }

  poll(): void {
    if (this.#hooks.isValid(this.#last.state)) {
      this.#hooks.poll(this.#last.state, this.#realm);
      return;
    }

    let cursor = this.#hooks.shouldClear
      ? this.#last.bounds.clear()
      : this.#last.bounds.cursorAfter;
    this.#last = this.#hooks.render(
      this.#realm.contentContext(cursor),
      this.#last.state
    );
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
      render: StableDynamicContent.of(render, { type, info }),
    });
  }

  readonly [IS_CONTENT] = true;
  readonly isStatic = false;

  declare readonly content: {
    type: Type;
    info: Info;
    render: StableRenderFunction;
  };

  render(ctx: ContentContext): StableContentResult {
    return this.content.render(ctx);
  }
}

export const TemplateContent = {
  isStatic: (content: Content): content is Content & StaticTemplateContent => {
    return content.isStatic;
  },
};

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

export const Content = {
  is: (value: unknown): value is Content => {
    if (isObject(value)) {
      return (
        value instanceof StaticTemplateContent ||
        value instanceof DynamicContent
      );
    } else {
      return false;
    }
  },
};

export class RenderedContent {
  readonly kind = "dynamic";

  #inner: DynamicRenderedContent;

  constructor(content: DynamicRenderedContent) {
    this.#inner = content;
  }

  update(): this {
    let newContent = this.#inner.poll();

    if (newContent) {
      this.#inner = newContent.#inner;
    }

    return this;
  }
}
