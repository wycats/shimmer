import { Bounds, StaticBounds } from "../../../dom/bounds";
import { Cursor } from "../../../dom/cursor";
import type { SimplestDocument } from "../../../dom/simplest";
import { Effect } from "../../glimmer/cache";
import {
  Content,
  DynamicContent,
  StableDynamicContent,
  StaticContent,
  TemplateContent,
  UpdatableDynamicContent,
} from "../content";
import type { Modifier, RenderedModifier } from "./modifier-content";

export interface ElementInfo {
  tag: string;
  modifiers: readonly Modifier[] | null;
  body: Content | null;
}

export type ElementArgs = ElementInfo;
export type ElementContent = TemplateContent<"element", ElementInfo>;

interface ElementState {
  body: StableDynamicContent | null;
  modifiers: readonly Effect<RenderedModifier>[] | null;
}

export function createElement({
  tag,
  modifiers,
  body,
}: {
  tag: string;
  modifiers: readonly Modifier[] | null;
  body: Content | null;
}): ElementContent {
  let staticBody = body === null || body.isStatic;
  let staticModifiers =
    modifiers === null || modifiers.every((m) => m.isStatic);

  if (staticBody && staticModifiers) {
    return StaticContent.of(
      "element",
      { tag, modifiers, body },
      (cursor, dom) => {
        return render({ tag, modifiers, body }, cursor, dom).bounds;
      }
    );
  } else {
    return DynamicContent.of(
      "element",
      { tag, modifiers, body },
      new UpdatableElement({ tag, modifiers, body })
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
    modifiers,
    body,
  }: {
    tag: string;
    modifiers: readonly Modifier[] | null;
    body: Content | null;
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

  if (modifiers) {
    for (let modifier of modifiers) {
      let rendered = modifier.render(element, dom);

      if (Effect.is(rendered)) {
        dynamicModifiers.push(rendered);
      }
    }
  }

  // insert attributes

  cursor.insert(element);

  let appending = Cursor.appending(element);

  if (body === null) {
    return {
      bounds: StaticBounds.single(element),
      state: {
        body: null,
        modifiers: dynamicModifiers.length === 0 ? null : dynamicModifiers,
      },
    };
  }

  let renderedBody = body.render(appending, dom);

  if (renderedBody instanceof StableDynamicContent) {
    return {
      bounds: StaticBounds.single(element),
      state: {
        body: renderedBody,
        modifiers: dynamicModifiers.length === 0 ? null : dynamicModifiers,
      },
    };
  } else {
    return {
      bounds: StaticBounds.single(element),
      state: { body: null, modifiers: null },
    };
  }
}
