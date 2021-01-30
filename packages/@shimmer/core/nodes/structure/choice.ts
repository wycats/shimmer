import type { Bounds } from "@shimmer/dom";
import {
  Block,
  build,
  ChoiceKey,
  Choices,
  ChoiceValue,
  Match,
  Reactive,
  ReactiveChoice,
} from "@shimmer/reactive";
import {
  Content,
  ContentContext,
  DynamicContent,
  StableDynamicContent,
  TemplateContent,
  UpdatableDynamicContent,
} from "../content";

export type MatchBlocks<C extends Choices> = {
  [P in ChoiceKey<C>]: Block<[Reactive<ChoiceValue<C, P>>]>;
};

export function matchIsStatic(match: Match<Choices, Content>): boolean {
  for (let content of Object.values(match)) {
    if (!content.isStatic) {
      return false;
    }
  }

  return true;
}

export interface ChoiceInfo<C extends Choices = Choices> {
  value: ReactiveChoice<C>;
  match: MatchBlocks<C>;
}

export type ChoiceContent<C extends Choices = Choices> = TemplateContent<
  "choice",
  ChoiceInfo<C>
>;

interface ChoiceState<C extends Choices> {
  discriminant: keyof C;
  content: StableDynamicContent | null;
}

export function createMatch<C extends Choices>(
  reactive: ReactiveChoice<C>,
  match: MatchBlocks<C>
): Content {
  return build(() => {
    if (reactive.isStatic()) {
      let { discriminant, value } = reactive.staticVariant;
      return match[discriminant]([Reactive.static(value)]);
    }

    let data: ChoiceInfo<C> = { value: reactive, match };
    return DynamicContent.of("choice", data, new UpdatableChoice(data));
  });
}

class UpdatableChoice<C extends Choices> extends UpdatableDynamicContent<
  ChoiceState<C>
> {
  #data: ChoiceInfo<C>;

  constructor(data: ChoiceInfo<C>) {
    super();
    this.#data = data;
  }

  isValid(state: ChoiceState<C>): boolean {
    let { discriminant: newDiscriminant } = this.#data.value.variantNow;

    return state.discriminant === newDiscriminant;
  }

  poll(state: ChoiceState<C>): void {
    if (state.content) {
      state.content.poll();
    }
  }

  render(ctx: ContentContext): { bounds: Bounds; state: ChoiceState<C> } {
    let { value, match } = this.#data;

    let { bounds, content } = initialize(value, match, ctx);
    let { discriminant } = value.variantNow;

    return {
      bounds,
      state: { discriminant, content },
    };
  }
}

function initialize<C extends Choices>(
  reactive: ReactiveChoice<C>,
  match: MatchBlocks<C>,
  ctx: ContentContext
): { bounds: Bounds; content: StableDynamicContent | null } {
  let { discriminant, value } = reactive.variantNow;
  let choice = match[discriminant];
  let result = choice([value]).render(ctx);

  if (result instanceof StableDynamicContent) {
    return { bounds: result, content: result };
  } else {
    return { bounds: result, content: null };
  }
}
