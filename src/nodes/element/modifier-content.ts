import type { SimplestDocument, SimplestElement } from "../../dom/simplest";
import { Effect } from "../../glimmer/cache";
import type { AttributeInfo } from "./attribute";
import type { ElementEffectInfo } from "./element-effect";

export type ModifierType = "attribute" | "effect";

export interface StaticModifier<
  Type extends ModifierType = ModifierType,
  Info = unknown
> {
  readonly type: Type;
  readonly info: Info;

  render(cursor: SimplestElement, dom: SimplestDocument): SimplestElement;
}

export const StaticModifier = {
  of: <Type extends ModifierType, Info>(
    type: Type,
    info: Info,
    render: (cursor: SimplestElement, dom: SimplestDocument) => SimplestElement
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
  render(cursor: SimplestElement, dom: SimplestDocument): UpdatableModifier;
}

export const DynamicModifier = {
  of: <Type extends ModifierType, Info>(
    type: Type,
    info: Info,
    render: (
      cursor: SimplestElement,
      dom: SimplestDocument
    ) => UpdatableModifier
  ): DynamicTemplateModifier<Type, Info> => {
    return new DynamicTemplateModifier({
      type,
      info,
      render,
    });
  },
};

export interface UpdatableModifier {
  readonly element: SimplestElement;

  update(): void;
}

export const UpdatableModifier = {
  of: (element: SimplestElement, update: () => void): UpdatableModifier => {
    return { element, update };
  },
};

export abstract class AbstractTemplateContent<Type extends ModifierType, Info> {
  readonly type: Type;
  readonly info: Info;

  abstract readonly isStatic: boolean;

  constructor(
    readonly content: {
      type: Type;
      info: Info;
      render: (
        cursor: SimplestElement,
        dom: SimplestDocument
      ) => SimplestElement | UpdatableModifier;
    }
  ) {
    this.type = content.type;
    this.info = content.info;
  }

  abstract render(
    cursor: SimplestElement,
    dom: SimplestDocument
  ): SimplestElement | Effect<RenderedModifier>;
}

export class StaticTemplateModifier<
  Type extends ModifierType = ModifierType,
  Info = unknown
> extends AbstractTemplateContent<Type, Info> {
  readonly isStatic = true;

  declare readonly content: {
    type: Type;
    info: Info;
    render: (cursor: SimplestElement, dom: SimplestDocument) => SimplestElement;
  };

  render(cursor: SimplestElement, dom: SimplestDocument): SimplestElement {
    return this.content.render(cursor, dom);
  }
}

export function renderElement(
  result: SimplestElement | Effect<RenderedModifier>
): SimplestElement {
  if (Effect.is(result)) {
    return result.poll().element;
  } else {
    return result;
  }
}

export class DynamicTemplateModifier<
  Type extends ModifierType = ModifierType,
  Info = unknown
> extends AbstractTemplateContent<Type, Info> {
  readonly isStatic = false;

  declare readonly content: {
    type: Type;
    info: Info;
    render: (
      cursor: SimplestElement,
      dom: SimplestDocument
    ) => UpdatableModifier;
  };

  render(
    cursor: SimplestElement,
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

export type Modifier =
  | TemplateModifier<"attribute", AttributeInfo>
  | TemplateModifier<"effect", ElementEffectInfo<any>>;

export class RenderedModifier<C extends UpdatableModifier = UpdatableModifier> {
  constructor(readonly content: C) {}

  get element(): SimplestElement {
    return this.content.element;
  }

  update(): this {
    this.content.update();
    return this;
  }
}
