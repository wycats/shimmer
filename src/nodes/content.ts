import { Bounds } from "../dom/bounds";
import type { Cursor } from "../dom/cursor";
import type { SimplestDocument } from "../dom/simplest";
import { Effect } from "../glimmer/cache";
import type { CommentInfo } from "./comment";
import type { ElementInfo } from "./element/element";
import type { FragmentInfo } from "./fragment";
import type { TextInfo } from "./text";

export type ContentType =
  | "text"
  | "comment"
  | "fragment"
  | "choice"
  | "element";

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

export interface DynamicContent<
  Type extends ContentType = ContentType,
  Info = unknown
> {
  render(cursor: Cursor, dom: SimplestDocument): UpdatableContent;
}

export const DynamicContent = {
  of: <Type extends ContentType, Info>(
    type: Type,
    info: Info,
    render: (cursor: Cursor, dom: SimplestDocument) => UpdatableContent
  ): DynamicTemplateContent<Type, Info> => {
    return new DynamicTemplateContent({
      type,
      info,
      render,
    });
  },
};

export interface UpdatableContent {
  readonly bounds: Bounds;

  update(): void;
}

export const UpdatableContent = {
  of: (bounds: Bounds, update: () => void): UpdatableContent => {
    return { bounds, update };
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
      render: (
        cursor: Cursor,
        dom: SimplestDocument
      ) => Bounds | UpdatableContent;
    }
  ) {
    this.type = content.type;
    this.info = content.info;
  }

  abstract render(
    cursor: Cursor,
    dom: SimplestDocument
  ): Bounds | Effect<RenderedContent>;
}

export class StaticTemplateContent<
  Type extends ContentType = ContentType,
  Info = unknown
> extends AbstractTemplateContent<Type, Info> {
  readonly isStatic = true;

  declare readonly content: {
    type: Type;
    info: Info;
    render: (cursor: Cursor, dom: SimplestDocument) => Bounds;
  };

  render(cursor: Cursor, dom: SimplestDocument): Bounds {
    return this.content.render(cursor, dom);
  }
}

export function renderBounds(result: Bounds | Effect<RenderedContent>): Bounds {
  if (Bounds.is(result)) {
    return result;
  } else {
    return result.poll().bounds;
  }
}

export class DynamicTemplateContent<
  Type extends ContentType = ContentType,
  Info = unknown
> extends AbstractTemplateContent<Type, Info> {
  readonly isStatic = false;

  declare readonly content: {
    type: Type;
    info: Info;
    render: (cursor: Cursor, dom: SimplestDocument) => UpdatableContent;
  };

  render(cursor: Cursor, dom: SimplestDocument): Effect<RenderedContent> {
    return Effect.of({
      initialize: () => new RenderedContent(this.content.render(cursor, dom)),
      update: (content) => content.update(),
    });
  }
}

export type TemplateContent<Type extends ContentType, Info = unknown> =
  | StaticTemplateContent<Type, Info>
  | DynamicTemplateContent<Type, Info>;

export type Content =
  | TemplateContent<"text", TextInfo>
  | TemplateContent<"comment", CommentInfo>
  | TemplateContent<"fragment", FragmentInfo>
  | TemplateContent<"choice", any>
  | TemplateContent<"element", ElementInfo>;

export class RenderedContent<C extends UpdatableContent = UpdatableContent> {
  constructor(readonly content: C) {}

  get bounds(): Bounds {
    return this.content.bounds;
  }

  update(): this {
    this.content.update();
    return this;
  }
}
