import type { SimplestCharacterData } from "@shimmer/dom";
import { StaticBounds } from "@shimmer/dom";
import { build, isStaticReactive, Reactive } from "@shimmer/reactive";
import {
  ContentContext,
  DynamicContent,
  StaticContent,
  TemplateContent,
} from "./content";

export type TextInfo = Reactive<string>;
export type TextContent = TemplateContent<"text", Reactive<string>>;

export function createText(
  string: Reactive<string>
): TemplateContent<"text", Reactive<string>> {
  return build(() => {
    if (isStaticReactive(string)) {
      return StaticContent.of("text", string, (ctx) => {
        let text = initialize(string, ctx);

        return StaticBounds.single(text);
      });
    } else {
      return DynamicContent.of("text", string, {
        isValid: () => true,
        shouldClear: false,
        poll: (text: SimplestCharacterData) => {
          text.data = string.now;
        },
        render: (ctx, state) => {
          if (state) {
            state.data = string.now;
            return { bounds: StaticBounds.single(state), state };
          }

          let text = initialize(string, ctx);
          let bounds = StaticBounds.single(text);
          return { bounds, state: text };
        },
      });
    }
  });
}

function initialize(
  value: Reactive<string>,
  ctx: ContentContext
): SimplestCharacterData {
  return ctx.cursor.insert(ctx.dom.createTextNode(value.now));
}
