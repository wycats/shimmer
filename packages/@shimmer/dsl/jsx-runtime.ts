import {
  Blocks,
  ComponentArgs,
  Content,
  createComment,
  createElement,
  IntoComponentArgs,
  IntoContent,
  Modifier,
} from "@shimmer/core";
import { userError } from "@shimmer/dev-mode";
import { computed, IntoReactive, Reactive } from "@shimmer/reactive";
import { attr, effect, fragment, JSXComponent } from "./dsl";
import { intoContent, intoReactive } from "./utils";

type JsxEffect = (element: Element) => void;

type JsxAttributes = {
  [P in keyof any]:
    | IntoReactive<string | null>
    | (() => unknown)
    | JsxEffect
    | readonly JsxEffect[];
};

function jsxFunction(
  tag: JSXComponent<ComponentArgs, Blocks>,
  attrs: IntoComponentArgs<ComponentArgs> | null,
  ...children: IntoContent[]
): Content {
  let block = normalizeBody(children);

  if (block) {
    return tag(attrs || {}, { default: block });
  } else {
    return tag(attrs || {}, {});
  }
}

function jsxElement(
  tag: string | ((...args: any[]) => any),
  attrs: JsxAttributes | null,
  ...children: IntoContent[]
): Content {
  if (tag === jsxFragment) {
    return jsxFragment(...children);
  }

  if (typeof tag === "function") {
    return jsxFunction(
      tag,
      attrs as IntoComponentArgs<ComponentArgs> | null,
      ...children
    );
  }

  let modifiers: Modifier[] = [];

  if (attrs) {
    for (let [key, value] of Object.entries(attrs)) {
      if (key === "use-effect") {
        userError(
          typeof value === "function" ||
            Array.isArray(value) ||
            Modifier.is(value),
          `use-effect must take an effect`
        );

        if (Modifier.is(value)) {
          modifiers.push(value);
        } else if (Array.isArray(value)) {
          for (let item of value) {
            modifiers.push(effect(item));
          }
        } else {
          modifiers.push(effect(value));
        }
      } else {
        modifiers.push(
          attr(
            key,
            normalizeAttrValue(value as IntoReactive<unknown> | (() => unknown))
          )
        );
      }
    }
  }

  let body: Content[] = [];

  if (Array.isArray(children)) {
    for (let item of children) {
      body.push(intoContent(item));
    }
  } else {
    body.push(intoContent(children));
  }

  return createElement({ tag, modifiers, body: normalizeBody(body) });
}

function normalizeAttrValue(
  value: IntoReactive<unknown> | (() => unknown)
): Reactive<string | null> {
  if (typeof value === "function") {
    return computed(() => {
      let now = value();

      if (now === false || now === null) {
        return null;
      } else {
        return String(now);
      }
    });
  } else {
    let reactive = intoReactive(value);

    return computed(() => {
      let now = reactive.now;

      if (now === false || now === null) {
        return null;
      } else {
        return String(now);
      }
    });
  }
}

function normalizeBody(content: IntoContent[]): Content | null {
  if (content.length === 0) {
    return null;
  } else if (content.length === 1) {
    return intoContent(content[0]);
  } else {
    return fragment(...content);
  }
}

function jsxFragment(...args: IntoContent[]): Content {
  return (
    normalizeBody(args.map(intoContent)) || createComment(Reactive.static(""))
  );
}

export { jsxElement as h };
export { jsxFragment as f };

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      [key: string]: JsxElement;
    }

    type JsxElement = {
      [P in string]: ((element: Element) => void) | IntoReactive<string | null>;
    };

    interface ElementAttributesProperty {
      COMPONENT_ARGS: object; // specify the property name to use
    }
  }
}
