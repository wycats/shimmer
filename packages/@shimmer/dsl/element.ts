import {
  Content,
  ElementContent,
  IntoContent,
  IntoModifiers,
  isIntoContent,
  Modifier,
} from "@shimmer/core";
import { IntoReactive, Reactive } from "@shimmer/reactive";
import { attr, element, intoModifiers } from "./dsl";

class ElementFunctionImpl {
  static proxy(tag: string, modifiers: readonly Modifier[]): ElementFunction {
    let el = new ElementFunctionImpl(tag, modifiers);

    function f(
      overload?: IntoModifiers | IntoContent,
      ...content: Content[]
    ): ElementContent {
      return el.invoke(overload, ...content);
    }

    return new Proxy(f, {
      get: (_, prop) => {
        if (typeof prop === "string") {
          if (prop === "attr") {
            return (name: string, value?: IntoReactive<string | null>) => {
              return el.addModifier(attr(name, value));
            };
          } else if (prop[0] === ".") {
            let classes = prop.split(".").slice(1);

            return el.addClasses(...classes.map((c) => Reactive.static(c)));
          } else {
            return el.addClasses(Reactive.static(prop));
          }
        } else {
          throw new Error(`unexpected symbol used in Element API`);
        }
      },
    }) as ElementFunction;
  }

  #tag: string;
  #modifiers: readonly Modifier[];

  constructor(tag: string, modifiers: readonly Modifier[]) {
    this.#tag = tag;
    this.#modifiers = modifiers;
  }

  addClasses(...classNames: readonly Reactive<string>[]): ElementFunction {
    let classes = classNames.map((c) => attr("class", c));

    return ElementFunctionImpl.proxy(this.#tag, [
      ...this.#modifiers,
      ...classes,
    ]);
  }

  addModifier(modifier: Modifier): ElementFunction {
    return ElementFunctionImpl.proxy(this.#tag, [...this.#modifiers, modifier]);
  }

  invoke(
    overload?: IntoModifiers | IntoContent,
    ...content: IntoContent[]
  ): ElementContent {
    if (this.#modifiers.length === 0) {
      return element(this.#tag, overload, ...content);
    } else {
      // TODO: Assert overload doesn't have a class in it

      if (isIntoContent(overload)) {
        return element(this.#tag, this.#modifiers, overload, ...content);
      } else {
        let objectAttrs = intoModifiers(overload) || [];
        return element(
          this.#tag,
          [...this.#modifiers, ...objectAttrs],
          ...content
        );
      }
    }
  }
}

type ElementFunction = {
  (
    overload?: IntoModifiers | IntoContent,
    ...content: IntoContent[]
  ): ElementContent;

  attr: (key: string, value?: IntoReactive<string | null>) => ElementFunction;
} & {
  [P in keyof any as Exclude<P, "attr">]: ElementFunction;
};

export type ElementDSL = {
  [P in keyof any]: ElementFunction;
};

export const html: ElementDSL = new Proxy({} as any, {
  get(_, prop): ElementFunction {
    if (typeof prop === "string") {
      return ElementFunctionImpl.proxy(prop, []);
    } else {
      throw new Error(`unexpected symbol used in Element API`);
    }
  },
});
