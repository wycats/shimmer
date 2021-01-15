import {
  attr,
  Choice,
  comment,
  component,
  Content,
  dom,
  effect,
  element,
  fragment,
  IntoReactive,
  match,
  Pure,
  Reactive,
} from "../../src/index";
import type {
  AttributeModifier,
  EffectModifier,
  Modifier,
} from "../../src/nodes/element/modifier-content";
import { Bool } from "../choice";

export const EFFECTS = Symbol("MODIFIERS");
export type EFFECTS = typeof EFFECTS;

export type Attributes = Readonly<Record<string, IntoReactive<string | null>>>;

export type ModifiersSpec = Attributes & {
  readonly [EFFECTS]?: readonly EffectModifier[];
};

export function el(
  tag: string,
  ...rest:
    | [attrs: ModifiersSpec | undefined, ...body: Content[]]
    | [...body: Content[]]
): Content {
  let { modifiers, body } = normalizeEl(rest);

  return element(tag, flatModifiers(modifiers), body);
}

// function recordToAttrs(record: ModifiersSpec): Modifier[] {
//   let modifiers: Modifier[] = [];

//   for (let [key, value] of Object.entries(record)) {
//     modifiers.push(attr(key, value));
//   }

//   let effects = record[EFFECTS];

//   if (effects) {
//     modifiers.push(...effects);
//   }

//   return modifiers;
// }

interface NormalizedElement {
  modifiers?: NormalizedModifiers;
  body?: Content;
}

function normalizeEl(
  args:
    | [modifiers: ModifiersSpec | undefined, ...body: Content[]]
    | [...body: Content[]]
): NormalizedElement {
  if (Content.is(args[0])) {
    return { body: fragment(...(args as Content[])) };
  } else {
    let [rawModifiers, ...body] = args;

    let modifiers = normalizeModifiers(rawModifiers);

    if (body.length > 0) {
      return { modifiers, body: fragment(...(body as Content[])) };
    } else {
      return { modifiers };
    }
  }
}

interface NormalizedModifiers {
  attrs: readonly AttributeModifier[] | null;
  effects: readonly EffectModifier[] | null;
}

function flatModifiers(modifiers: NormalizedModifiers | undefined): Modifier[] {
  if (modifiers === undefined) {
    return [];
  }

  let attrs = modifiers.attrs === null ? [] : modifiers.attrs;
  let effects = modifiers.effects === null ? [] : modifiers.effects;

  return [...attrs, ...effects];
}

function normalizeModifiers(
  spec: ModifiersSpec | undefined
): NormalizedModifiers {
  if (spec === undefined) {
    return { attrs: null, effects: null };
  }

  let attrs: AttributeModifier[] = [];
  let effects = spec[EFFECTS];

  for (let [key, value] of Object.entries(spec)) {
    attrs.push(attr(key, value));
  }

  return { attrs: attrs.length === 0 ? null : attrs, effects: effects || null };
}

export const ToBool = (value: Reactive<unknown>): Reactive<Choice<Bool>> =>
  Pure.of(() => {
    if (!!value.now) {
      return Bool.of("true", Reactive.static(true));
    } else {
      return Bool.of("false", Reactive.static(false));
    }
  });

export const If = <T, U>(
  bool: IntoReactive<boolean>,
  ifTrue: IntoReactive<T>,
  ifFalse: IntoReactive<U>
): Reactive<T | U> => {
  let condition = Reactive.from(bool);
  let trueBranch = Reactive.from(ifTrue);
  let falseBranch = Reactive.from(ifFalse);

  return Pure.of(() => (condition.now ? trueBranch.now : falseBranch.now));
};

export const Cond = component(
  () => (bool: Reactive<Choice<Bool>>, ifTrue: Content, ifFalse?: Content) => {
    return match(bool, {
      true: ifTrue,
      false: ifFalse || comment(""),
    });
  }
);

export const Classes = (
  ...classes: IntoReactive<string | null>[]
): Reactive<string | null> => {
  let reactive = classes.map((c) => Reactive.from(c));

  return Pure.of(() => {
    let className = [];

    for (let item of reactive) {
      let value = item.now;

      if (value !== null) {
        className.push(value);
      }
    }

    if (className.length === 0) {
      return null;
    } else {
      return className.join(" ");
    }
  });
};

export const on = effect(
  (
    element: dom.SimplestElement,
    eventName: Reactive<string>,
    callback: Reactive<EventListener>
  ) => {
    (element as Element).addEventListener(eventName.now, callback.now);
  }
);
