import { ElementContent, Modifier } from "@shimmer/core";
import { IntoReactive, Reactive } from "@shimmer/reactive";
import { attr, element, intoModifiers } from "./dsl";

type InvokeElement = [
  overload?: IntoModifiers | IntoContent,
  ...content: IntoContent[]
];

class ElementFunctionImpl {
  static proxy(tag: string, modifiers: readonly Modifier[]): ElementFunction {
    let el = new ElementFunctionImpl(tag, modifiers);

    function f(...overloads: InvokeElement): ElementContent {
      return el.invoke(...overloads);
    }

    return new Proxy(f, {
      has: (_, prop) => {
        return prop === COERCE_INTO_CONTENT || typeof prop === "string";
      },

      get: (_, prop) => {
        if (prop === COERCE_INTO_CONTENT) {
          return f;
        }

        if (typeof prop === "string") {
          if (prop === "attr") {
            return (name: string, value?: IntoReactive<string | null>) => {
              return el.addModifiers(attr(name, value));
            };
          } else if (prop === "attrs") {
            return (attrs: Record<string, IntoReactive<string | null>>) => {
              let modifiers = Object.entries(attrs).map(([key, value]) =>
                attr(key, value)
              );
              return el.addModifiers(...modifiers);
            };
          } else if (prop[0] === ".") {
            let classes = prop.split(".").slice(1);

            return el.addClasses(...classes.map((c) => Reactive.static(c)));
          } else {
            return el.addClasses(Reactive.static(prop));
          }
        } else {
          throw new Error(
            `unexpected symbol ${String(prop)} used in Element API (proxy)`
          );
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

  addModifiers(...modifiers: readonly Modifier[]): ElementFunction {
    return ElementFunctionImpl.proxy(this.#tag, [
      ...this.#modifiers,
      ...modifiers,
    ]);
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

type AttrProp<K extends keyof any> = K extends `[${string}]` ? K : never;

type BareProp<K extends keyof any> = Exclude<string, AttrProp<K> | "attr">;

type ElementFunction = CoerceIntoContent & {
  (...overloads: InvokeElement): ElementContent;

  attrs: (
    attrs: Record<string, IntoReactive<string | null>>
  ) => ElementFunction;
  attr: (key: string, value?: IntoReactive<string | null>) => ElementFunction;
} & {
    [P in keyof any as BareProp<P>]: ElementFunction;
  };

export type ElementDSL = {
  [P in keyof any]: ElementFunction;
};

export const html: ElementDSL = new Proxy({} as any, {
  get(_, prop): ElementFunction {
    if (typeof prop === "string") {
      return ElementFunctionImpl.proxy(prop, []);
    } else {
      throw new Error(
        `unexpected symbol ${String(prop)} used in Element API (html)`
      );
    }
  },
});
