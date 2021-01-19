import {
  Args,
  AttributeModifier,
  Block,
  Blocks,
  Choice,
  Choices,
  CommentContent,
  Component,
  ComponentData,
  Content,
  createAttr,
  createComment,
  createEach,
  createEffect,
  createElement,
  createFragment,
  createMatch,
  createText,
  EffectModifier,
  EFFECTS,
  ElementArgs,
  ElementContent,
  IntoBlock,
  IntoBlockFunction,
  IntoBlocksFor,
  IntoComponentDefinition,
  IntoContent,
  IntoModifiers,
  Invoke,
  Match,
  Modifier,
  PresentComponentDefinition,
  Pure,
  Reactive,
  Services,
  TextContent,
  userError,
} from "@shimmer/core";
import type { SimplestElement } from "@shimmer/dom";
import {
  intoArgs,
  IntoArgs,
  intoComponentArgs,
  intoContent,
  intoReactive,
  IntoReactive,
} from "./utils";

export function text(string: IntoReactive<string>): TextContent {
  return createText(intoReactive(string));
}

export function comment(string: IntoReactive<string>): CommentContent {
  return createComment(intoReactive(string));
}

export function fragment(...parts: readonly IntoContent[]): Content {
  let content = parts.map(intoContent);

  return createFragment(content);
}

export function match<C extends Choices>(
  value: IntoReactive<Choice<C>>,
  matcher: Match<C, IntoBlockFunction<[]>>
): Content {
  let reactive = intoReactive(value);

  let out: Match<Choices, Block<[]>> = {};

  for (let [key, block] of Object.entries(matcher)) {
    out[key] = coerceIntoBlock(block);
  }

  let match = out as Match<C, Block<[]>>;

  return createMatch(reactive, match);
}

export type IntoAnyBlockFunction = (...args: any[]) => IntoContent;

function coerceIntoBlock<A extends Args>(into: IntoBlock<A>): Block<A>;
function coerceIntoBlock<A extends Args>(into: undefined): undefined;
function coerceIntoBlock<A extends Args>(
  into: IntoBlock<A> | undefined
): Block<A> | undefined;
function coerceIntoBlock<A extends Args>(
  into: IntoBlock<A> | undefined
): Block<A> | undefined {
  if (into === undefined) {
    return undefined;
  }

  if (Block.is(into)) {
    return into;
  } else if (typeof into === "function") {
    return Block.of((args: A) => {
      return intoContent(into(...args));
    });
  } else {
    userError(
      typeof into === "string" || Content.is(into),
      `intoBlock must be called with IntoContent (string or Content)`
    );

    return Block.of(() => intoContent(into));
  }
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
  intoBlock: IntoBlock<[Reactive<T>]>
): Content {
  let reactive = intoReactiveIterable(into);
  let block = coerceIntoBlock(intoBlock);

  return createEach(reactive, key, block);
}

function isModifiers(into: IntoModifiers): into is readonly Modifier[] {
  return Array.isArray(into);
}

function intoModifiers(into: undefined): undefined;
function intoModifiers(into: IntoModifiers): readonly Modifier[];
function intoModifiers(
  into: IntoModifiers | undefined
): readonly Modifier[] | undefined;
function intoModifiers(
  into: IntoModifiers | undefined
): readonly Modifier[] | undefined {
  if (into === undefined) {
    return into;
  }

  if (isModifiers(into)) {
    return into;
  }

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

export function intoComponentData<C extends ComponentData>(
  args: IntoComponentDefinition<C>,
  $: Invoke
): C {
  if (args === undefined) {
    return {
      $,
    } as C;
  }

  let componentArgs = intoComponentArgs(args.args);
  let componentAttrs = intoModifiers(args.attrs);
  let componentBlocks = intoBlocks(args.blocks);

  return {
    args: componentArgs,
    attrs: componentAttrs,
    blocks: componentBlocks,
    $,
  } as C;
}

function intoBlocks<B extends Blocks>(blocks: undefined): undefined;
function intoBlocks<B extends Blocks>(blocks: IntoBlocksFor<B>): B;
function intoBlocks<B extends Blocks>(
  blocks: IntoBlocksFor<B> | undefined
): B | undefined;
function intoBlocks<B extends Blocks>(
  blocks: IntoBlocksFor<B> | undefined
): B | undefined {
  if (blocks === undefined) {
    return undefined;
  }

  let out: Blocks = {};

  for (let [key, value] of Object.entries(blocks)) {
    out[key] = coerceIntoBlock(value);
  }

  return out as B;
}

export function def<S extends Services>(
  callback: (args: { $: Invoke<S> }) => IntoContent
): Component<[], S>;
export function def<S extends Services>(
  callback: () => IntoContent
): Component<[], Services>;
export function def<C extends PresentComponentDefinition>(
  callback: (args: C) => IntoContent
): Component<C, Services>;
export function def<C extends PresentComponentDefinition, S extends Services>(
  callback: (args: C & { $: Invoke<S> }) => IntoContent
): Component<C, S>;
export function def<C extends PresentComponentDefinition, S extends Services>(
  callback: (args: C & { $: Invoke<S> }) => IntoContent
): Component<C, S> {
  return (intoData: IntoComponentDefinition<any>, $: Invoke): Content => {
    let data = intoComponentData<any>(intoData, $);

    let content = callback(data);
    return intoContent(content);
  };
}
