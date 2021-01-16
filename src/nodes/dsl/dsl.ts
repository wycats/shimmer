import type { SimplestElement } from "../../dom/simplest";
import { Pure } from "../../glimmer/cache";
import type { Owner } from "../../owner";
import { Reactive } from "../../reactive/cell";
import { CommentContent, createComment } from "../comment";
import { Content } from "../content";
import { createAttr } from "../element/attribute";
import { createElement, ElementArgs, ElementContent } from "../element/element";
import { createEffect, EffectModifier } from "../element/element-effect";
import type { AttributeModifier, Modifier } from "../element/modifier-content";
import { createFragment } from "../fragment";
import { BlockFunction, createBlock } from "../structure/block";
import { Choice, Choices, createMatch, Match } from "../structure/choice";
import { createEach } from "../structure/each";
import { createText, TextContent } from "../text";
import {
  Args,
  intoArgs,
  IntoArgs,
  intoContent,
  intoReactive,
  IntoReactive,
} from "./utils";

export const EFFECTS = Symbol("EFFECTS");
export type EFFECTS = typeof EFFECTS;

export function text(string: IntoReactive<string>): TextContent {
  return createText(intoReactive(string));
}

export function comment(string: IntoReactive<string>): CommentContent {
  return createComment(intoReactive(string));
}

export type IntoContent = Content | string;

export function fragment(...parts: readonly IntoContent[]): Content {
  let content = parts.map(intoContent);

  return createFragment(content);
}

export function match<C extends Choices>(
  value: IntoReactive<Choice<C>>,
  matcher: Match<C, IntoContent>
): Content {
  let reactive = intoReactive(value);

  let out: Match<Choices, Content> = {};

  for (let [key, value] of Object.entries(matcher)) {
    out[key] = intoContent(value);
  }

  let match = out as Match<C, Content>;

  return createMatch(reactive, match);
}

export type IntoBlockFunction<A extends Args> = (...args: A) => IntoContent;

export function intoBlockFunction<A extends Args>(
  into: IntoBlockFunction<A>
): BlockFunction<A> {
  return (args: A): Content => {
    let content = into(...args);
    return intoContent(content);
  };
}

export function block<A extends Args>(
  callback: IntoBlockFunction<A>
): (...args: IntoArgs<A>) => Content {
  let block = createBlock(
    (args: A): Content => {
      let content = callback(...args);
      return intoContent(content);
    }
  );

  return (...into: IntoArgs<A>) => {
    let args = intoArgs(into);
    return block.invoke(args);
  };
}

export function attr(
  name: string,
  value?: IntoReactive<string | null>
): AttributeModifier {
  if (value === undefined) {
    return createAttr(name, Reactive.static(null));
  } else {
    let reactive = Reactive.from(value);
    return createAttr(name, reactive);
  }
}

export function effect<A extends Args>(
  callback: (element: SimplestElement, ...args: A) => void
): (...args: IntoArgs<A>) => EffectModifier<A> {
  let e = createEffect<A>((element, args) => callback(element, ...args));

  return (...into: IntoArgs<A>): EffectModifier<A> => {
    let args = intoArgs(into);

    return e(args);
  };
}

export type IntoReactiveIterable<T> = IntoReactive<Iterable<IntoReactive<T>>>;
export type ReactiveIterable<T> = Reactive<Iterable<Reactive<T>>>;

export function intoReactiveIterable<T>(
  into: IntoReactiveIterable<T>
): Reactive<Iterable<Reactive<T>>> {
  let reactive = intoReactive(into);

  return Pure.of(() => {
    return intoIterable(reactive.now);
  });
}

function* intoIterable<T>(
  into: Iterable<IntoReactive<T>>
): Iterable<Reactive<T>> {
  for (let item of into) {
    yield intoReactive(item);
  }
}

export function each<T>(
  into: IntoReactiveIterable<T>,
  key: (arg: T) => unknown,
  intoBlock: IntoBlockFunction<[Reactive<T>]>
): Content {
  let reactive = intoReactiveIterable(into);
  let block = intoBlockFunction(intoBlock);

  return createEach(reactive, key, block);
}

export interface IntoModifiers {
  [key: string]: IntoReactive<string | null>;
  [EFFECTS]?: EffectModifier<any>[];
}

function intoModifiers(into: IntoModifiers): readonly Modifier[] {
  let modifiers: Modifier[] = [];

  let effects = into[EFFECTS];

  if (effects) {
    modifiers.push(...effects);
  }

  for (let [key, value] of Object.entries(into)) {
    let reactive = intoReactive(value);
    modifiers.push(createAttr(key, reactive));
  }

  return modifiers;
}

export type IntoElementArgs =
  | [tag: string, ...content: IntoContent[]]
  | [
      tag: string,
      modifiers: IntoModifiers | undefined,
      ...content: IntoContent[]
    ];

function intoElementArgs(into: IntoElementArgs): ElementArgs {
  let [tag, overload, ...rest] = into;

  if (overload === undefined) {
    return {
      tag,
      modifiers: null,
      body: rest.length === 0 ? null : createFragment(rest.map(intoContent)),
    };
  }

  if (typeof overload === "string" || Content.is(overload)) {
    let body = [intoContent(overload), ...rest.map(intoContent)];

    return {
      tag,
      modifiers: null,
      body: createFragment(body),
    };
  } else {
    let body = rest.map(intoContent);

    return {
      tag,
      modifiers: intoModifiers(overload),
      body: createFragment(body),
    };
  }
}

export function element(...into: IntoElementArgs): ElementContent {
  let args = intoElementArgs(into);
  return createElement(args);
}

export type IntoComponentDefinition<O extends Owner, A extends Args> = (
  owner: O
) => (...args: A) => IntoContent;

export function component<O extends Owner, A extends Args>(
  into: IntoComponentDefinition<O, A>
): (owner: O) => (...args: IntoArgs<A>) => Content {
  return (owner: O) => (...args: IntoArgs<A>) => {
    let a = intoArgs(args);
    let content = into(owner)(...a);
    return intoContent(content);
  };
}
