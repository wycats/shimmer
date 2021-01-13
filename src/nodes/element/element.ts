import { Bounds, StaticBounds } from "../../dom/bounds";
import { Cursor } from "../../dom/cursor";
import type { SimplestDocument } from "../../dom/simplest";
import { Effect } from "../../glimmer/cache";
import {
  Content,
  DynamicContent,
  StableDynamicContent,
  StaticContent,
  TemplateContent,
  UpdatableDynamicContent,
} from "../content";
import type { AttributeInfo } from "./attribute";
import type { ElementEffectInfo } from "./element-effect";
import type {
  Modifier,
  RenderedModifier,
  TemplateModifier,
} from "./modifier-content";

export interface ElementInfo {
  tag: string;
  attributes: readonly TemplateModifier<"attribute", AttributeInfo>[];
  effects: readonly TemplateModifier<"effect", ElementEffectInfo<any>>[];
  body: Content;
}

interface ElementState {
  body: StableDynamicContent | null;
  modifiers: readonly Effect<RenderedModifier>[] | null;
}

export function element(
  tag: string,
  modifiers: readonly Modifier[],
  body: Content
): TemplateContent<"element", ElementInfo> {
  let attributes = modifiers.filter(
    (a): a is TemplateModifier<"attribute", AttributeInfo> =>
      a.type === "attribute"
  );
  let effects = modifiers.filter(
    (a): a is TemplateModifier<"effect", ElementEffectInfo> =>
      a.type === "effect"
  );

  if (
    body.isStatic &&
    attributes.every((a) => a.isStatic) &&
    effects.every((e) => e.isStatic)
  ) {
    return StaticContent.of(
      "element",
      { tag, attributes, effects, body },
      (cursor, dom) => {
        return render({ tag, attributes, effects, body }, cursor, dom).bounds;
      }
    );
  } else {
    return DynamicContent.of(
      "element",
      { tag, attributes, effects, body },
      new UpdatableElement({ tag, attributes, effects, body })
    );
  }
}

class UpdatableElement extends UpdatableDynamicContent<ElementState> {
  #data: ElementInfo;

  constructor(data: ElementInfo) {
    super();
    this.#data = data;
  }

  isValid(): boolean {
    return true;
  }

  poll(state: ElementState): void {
    if (state.body) {
      state.body.poll();
    }

    if (state.modifiers) {
      for (let attr of state.modifiers) {
        attr.poll();
      }
    }
  }

  render(
    cursor: Cursor,
    dom: SimplestDocument
  ): { bounds: Bounds; state: ElementState } {
    return render(this.#data, cursor, dom);
  }
}

function render(
  {
    tag,
    attributes,
    effects,
    body,
  }: {
    tag: string;
    attributes: readonly TemplateModifier<"attribute", AttributeInfo>[];
    effects: readonly TemplateModifier<"effect", ElementEffectInfo>[];
    body: Content;
  },
  cursor: Cursor,
  dom: SimplestDocument
): {
  bounds: StaticBounds;
  state: {
    body: StableDynamicContent | null;
    modifiers: readonly Effect<RenderedModifier>[] | null;
  };
} {
  let element = cursor.createElement(tag, dom);

  let dynamicModifiers: Effect<RenderedModifier>[] = [];

  for (let attribute of attributes) {
    let attr = attribute.render(element, dom);

    if (Effect.is(attr)) {
      dynamicModifiers.push(attr);
    }
  }

  for (let effect of effects) {
    let result = effect.render(element, dom);

    if (Effect.is(result)) {
      dynamicModifiers.push(result);
    }
  }

  // insert attributes

  cursor.insert(element);

  let appending = Cursor.appending(element);

  let renderedBody = body.render(appending, dom);

  if (Bounds.is(renderedBody)) {
    return {
      bounds: StaticBounds.single(element),
      state: { body: null, modifiers: null },
    };
  } else {
    return {
      bounds: StaticBounds.single(element),
      state: {
        body: renderedBody,
        modifiers: dynamicModifiers.length === 0 ? null : dynamicModifiers,
      },
    };
  }
}
