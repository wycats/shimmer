import {
  Args,
  AttributeModifier,
  block,
  Blocks,
  Choice,
  Choices,
  CommentContent,
  Component,
  ComponentArgs,
  Content,
  createAttr,
  createComment,
  createEach,
  createEffect,
  createElement,
  createFragment,
  createMatch,
  createText,
  EffectContext,
  EffectModifier,
  EFFECTS,
  ElementArgs,
  ElementContent,
  Invoke,
  Match,
  Modifier,
  Services,
  TextContent,
} from "@shimmer/core";
import { userError } from "@shimmer/dev-mode";
import {
  Block,
  computed,
  isInvokableBlock,
  isReactive,
  Reactive,
} from "@shimmer/reactive";
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

  if (isInvokableBlock(into)) {
    return into;
  } else if (typeof into === "function") {
    return block((args: A) => {
      return intoContent(into(...args));
    });
  } else {
    userError(
      typeof into === "string" || Content.is(into),
      `intoBlock must be called with IntoContent (string or Content)`
    );

    return block(() => intoContent(into));
  }
}

export function attr(
  name: string,
  value?: IntoReactive<unknown>
): AttributeModifier {
  if (value === undefined) {
    return createAttr(name, Reactive.static(null));
  } else {
    let reactive = Reactive.from(value);
    return createAttr(
      name,
      computed(() => String(reactive.now))
    );
  }
}

export function effect(callback: (ctx: EffectContext) => void): EffectModifier {
  return effectFunction((ctx) => callback(ctx))();
}

export function effectFunction<A extends Args>(
  callback: (ctx: EffectContext, ...args: A) => void
): (...args: IntoArgs<A>) => EffectModifier<A> {
  let e = createEffect<A>((ctx, args) => callback(ctx, ...args));

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

  return computed(() => {
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

export function intoModifiers(into: undefined): undefined;
export function intoModifiers(into: IntoModifiers): readonly Modifier[];
export function intoModifiers(
  into: IntoModifiers | undefined
): readonly Modifier[] | undefined;
export function intoModifiers(
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
  | [tag: string]
  | [
      tag: string,
      overload: IntoContent | IntoModifiers | undefined,
      ...rest: IntoContent[]
    ];

export function intoElementArgs(into: IntoElementArgs): ElementArgs {
  let [tag, overload, ...rest] = into;

  if (overload === undefined) {
    return {
      tag,
      modifiers: null,
      body: rest.length === 0 ? null : createFragment(rest.map(intoContent)),
    };
  }

  if (
    typeof overload === "string" ||
    typeof overload === "function" ||
    Content.is(overload) ||
    isReactive(overload) ||
    isCoercibleIntoContent(overload)
  ) {
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

  let componentArgs = intoComponentArgs(args.args as any);
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

export type JSXComponent<A extends ComponentArgs, B extends Blocks> = (
  args: IntoComponentArgs<A>,
  blocks: B extends {} ? void : IntoBlocksFor<B>
) => Content;

export function def<A extends ComponentArgs, B extends Blocks = {}>(
  callback: (args: A, blocks: B) => IntoContent
): JSXComponent<A, B> {
  return (args: IntoComponentArgs<A>, blocks: IntoBlocksFor<B>): Content => {
    let content = callback(intoComponentArgs(args), intoBlocks(blocks) as B);
    return intoContent(content);
  };
}

export type Outlet = () => IntoContent;

export function defPage(callback: () => IntoContent): () => Content;
export function defPage<O extends Record<string, Outlet>>(
  callback: (outlets: O) => IntoContent
): (outlets: O) => Content;
export function defPage<O extends Record<string, Outlet>>(
  callback: (outlets?: O) => IntoContent
): (outlets?: O) => Content {
  return (outlets?: O): Content => {
    let content = callback(outlets);
    return intoContent(content);
  };
}

export function defDSL<S extends Services>(
  callback: (args: { $: Invoke<S> }) => IntoContent
): Component<[], S>;
export function defDSL<S extends Services>(
  callback: () => IntoContent
): Component<[], Services>;
export function defDSL<C extends PresentComponentDefinition>(
  callback: (args: C) => IntoContent
): Component<C, Services>;
export function defDSL<
  C extends PresentComponentDefinition,
  S extends Services
>(callback: (args: C & { $: Invoke<S> }) => IntoContent): Component<C, S>;
export function defDSL<
  C extends PresentComponentDefinition,
  S extends Services
>(callback: (args: C & { $: Invoke<S> }) => IntoContent): Component<C, S> {
  return (((intoData: IntoComponentDefinition<any>, $: Invoke): Content => {
    let data = intoComponentData<any>(intoData, $);

    let content = callback(data);
    return intoContent(content);
  }) as unknown) as Component<C, S>;
}

// export function jsxDef(callback: ())
