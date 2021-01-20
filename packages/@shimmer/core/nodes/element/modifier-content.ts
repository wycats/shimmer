import type { ElementCursor, SimplestDocument } from "@shimmer/dom";
import { Effect } from "@shimmer/reactive";
import { isObject } from "../../utils";
import type { AttributeModifier } from "./attribute";
import type { EffectModifier } from "./element-effect";

export type ModifierType = "attribute" | "effect";

export interface StaticModifier<
  Type extends ModifierType = ModifierType,
  Info = unknown
> {
  readonly type: Type;
  readonly info: Info;

  render(cursor: ElementCursor, dom: SimplestDocument): ElementCursor;
}

export const StaticModifier = {
  of: <Type extends ModifierType, Info>(
    type: Type,
    info: Info,
    render: (cursor: ElementCursor, dom: SimplestDocument) => ElementCursor
  ): StaticTemplateModifier<Type, Info> => {
    return new StaticTemplateModifier({
      type,
      info,
      render,
    });
  },
};

export interface DynamicModifier<
  Type extends ModifierType = ModifierType,
  Info = unknown
> {
  render(cursor: ElementCursor, dom: SimplestDocument): UpdatableModifier;
}

export const DynamicModifier = {
  of: <Type extends ModifierType, Info>(
    type: Type,
    info: Info,
    render: (cursor: ElementCursor, dom: SimplestDocument) => UpdatableModifier
  ): DynamicTemplateModifier<Type, Info> => {
    return new DynamicTemplateModifier({
      type,
      info,
      render,
    });
  },
};

export interface UpdatableModifier {
  readonly element: ElementCursor;

  update(): void;
}

export const UpdatableModifier = {
  of: (element: ElementCursor, update: () => void): UpdatableModifier => {
    return { element, update };
  },
};

export abstract class AbstractModifierContent<Type extends ModifierType, Info> {
  readonly type: Type;
  readonly info: Info;

  abstract readonly isStatic: boolean;

  constructor(
    readonly content: {
      type: Type;
      info: Info;
      render: (
        cursor: ElementCursor,
        dom: SimplestDocument
      ) => ElementCursor | UpdatableModifier;
    }
  ) {
    this.type = content.type;
    this.info = content.info;
  }

  abstract render(
    cursor: ElementCursor,
    dom: SimplestDocument
  ): ElementCursor | Effect<RenderedModifier>;
}

export class StaticTemplateModifier<
  Type extends ModifierType = ModifierType,
  Info = unknown
> extends AbstractModifierContent<Type, Info> {
  readonly isStatic = true;

  declare readonly content: {
    type: Type;
    info: Info;
    render: (cursor: ElementCursor, dom: SimplestDocument) => ElementCursor;
  };

  render(cursor: ElementCursor, dom: SimplestDocument): ElementCursor {
    return this.content.render(cursor, dom);
  }
}

export function renderElement(
  result: ElementCursor | Effect<RenderedModifier>
): ElementCursor {
  if (Effect.is(result)) {
    return result.poll().element;
  } else {
    return result;
  }
}

export class DynamicTemplateModifier<
  Type extends ModifierType = ModifierType,
  Info = unknown
> extends AbstractModifierContent<Type, Info> {
  readonly isStatic = false;

  declare readonly content: {
    type: Type;
    info: Info;
    render: (cursor: ElementCursor, dom: SimplestDocument) => UpdatableModifier;
  };

  render(
    cursor: ElementCursor,
    dom: SimplestDocument
  ): Effect<RenderedModifier> {
    return Effect.of({
      initialize: () => new RenderedModifier(this.content.render(cursor, dom)),
      update: (content) => content.update(),
    });
  }
}

export type TemplateModifier<Type extends ModifierType, Info = unknown> =
  | StaticTemplateModifier<Type, Info>
  | DynamicTemplateModifier<Type, Info>;

export type Modifier = EffectModifier | AttributeModifier;

export const Modifier = {
  is: (value: unknown): value is Modifier => {
    if (isObject(value)) {
      return (
        value instanceof StaticTemplateModifier ||
        value instanceof DynamicTemplateModifier
      );
    } else {
      return false;
    }
  },
};

export class RenderedModifier<C extends UpdatableModifier = UpdatableModifier> {
  constructor(readonly content: C) {}

  get element(): ElementCursor {
    return this.content.element;
  }

  update(): this {
    this.content.update();
    return this;
  }
}
