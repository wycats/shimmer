import { Bounds, ElementCursor, StaticBounds } from "@shimmer/dom";
import { Effect } from "@shimmer/reactive";
import {
  Content,
  ContentContext,
  DynamicContent,
  StableDynamicContent,
  StaticContent,
  TemplateContent,
  UpdatableDynamicContent,
} from "../content";
import { EffectContext } from "./element-effect";
import type { Modifier, RenderedModifier } from "./modifier-content";

export interface ElementInfo {
  tag: string;
  modifiers: readonly Modifier[] | null;
  body: Content | null;
}

export interface NormalizedElementArgs {
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
    return StaticContent.of("element", { tag, modifiers, body }, (ctx) => {
      return render({ tag, modifiers, body }, ctx).bounds;
    });
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

  render(ctx: ContentContext): { bounds: Bounds; state: ElementState } {
    return render(this.#data, ctx);
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
  ctx: ContentContext
): {
  bounds: StaticBounds;
  state: {
    body: StableDynamicContent | null;
    modifiers: readonly Effect<RenderedModifier>[] | null;
  };
} {
  let element = ctx.cursor.createElement(tag, ctx.dom);

  let dynamicModifiers: Effect<RenderedModifier>[] = [];

  // insert attributes
  if (modifiers) {
    for (let modifier of modifiers) {
      if (modifier.type === "attribute") {
        let effectContext = EffectContext.of(
          ElementCursor.of(element),
          ctx.realm
        );

        let rendered = modifier.render(effectContext);

        if (Effect.is(rendered)) {
          dynamicModifiers.push(rendered);
        }
      }
    }
  }

  ctx.cursor.insert(element);

  if (body === null) {
    return {
      bounds: StaticBounds.single(element),
      state: {
        body: null,
        modifiers: dynamicModifiers.length === 0 ? null : dynamicModifiers,
      },
    };
  }

  let renderedBody = body.render(ctx.withAppendingCursor(element));

  // run effects
  if (modifiers) {
    for (let modifier of modifiers) {
      if (modifier.type === "effect") {
        let effectContext = EffectContext.of(
          ElementCursor.of(element),
          ctx.realm
        );

        let rendered = modifier.render(effectContext);

        if (Effect.is(rendered)) {
          dynamicModifiers.push(rendered);
        }
      }
    }
  }

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
